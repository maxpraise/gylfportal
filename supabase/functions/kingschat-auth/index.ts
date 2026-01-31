import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface KingschatUserInfo {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  avatar?: string;
  phone_number?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, refreshToken, expiresInMillis, userInfo } = await req.json();

    if (!accessToken || !userInfo) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accessToken and userInfo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Kingschat auth request received');
    console.log('User info:', JSON.stringify(userInfo));

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Construct email - use Kingschat email if available, otherwise create one from username/id
    const email = userInfo.email || 
                  (userInfo.username ? `${userInfo.username}@kingschat.user` : `kc_${userInfo.id}@kingschat.user`);
    const fullName = userInfo.name || userInfo.username || 'Kingschat User';

    console.log('Looking up user with email:', email);

    // Check if user already exists by email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    let user = existingUsers?.users?.find(u => u.email === email);
    
    if (!user) {
      // Also check if user exists by kingschat_id in metadata
      user = existingUsers?.users?.find(u => 
        u.user_metadata?.kingschat_id === userInfo.id
      );
    }
    
    if (!user) {
      // Create new user
      console.log('Creating new user for Kingschat ID:', userInfo.id);
      
      // Generate a secure random password for the user
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          kingschat_id: userInfo.id,
          kingschat_username: userInfo.username,
          avatar_url: userInfo.avatar,
          provider: 'kingschat',
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      user = newUser.user;
      console.log('User created successfully:', user.id);

      // Create profile for the new user
      const { data: newCode } = await supabase.rpc('generate_referral_code');
      
      const { data: levelData } = await supabase
        .from('growth_paths')
        .select('id')
        .eq('level', 1)
        .single();

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id,
        email,
        full_name: fullName,
        referral_code: newCode || `GYLF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        current_level_id: levelData?.id,
        avatar_url: userInfo.avatar,
        phone: userInfo.phone_number,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw, profile might already exist from trigger
      } else {
        console.log('Profile created successfully');
      }
    } else {
      console.log('Existing user found:', user.id);
      
      // Update user metadata with latest Kingschat info
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          kingschat_id: userInfo.id,
          kingschat_username: userInfo.username,
          avatar_url: userInfo.avatar,
          full_name: fullName,
        },
      });

      // Also update the profile with latest info
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            avatar_url: userInfo.avatar,
            phone: userInfo.phone_number,
          })
          .eq('id', existingProfile.id);
      }
    }

    // Generate a session for the user using magic link
    console.log('Generating magic link for user:', user.id);
    
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    if (sessionError) {
      console.error('Error generating session link:', sessionError);
      throw sessionError;
    }

    // Extract the token from the action link
    const actionLink = sessionData?.properties?.action_link;
    if (!actionLink) {
      console.error('No action link in response');
      throw new Error('Failed to generate authentication link');
    }

    console.log('Action link generated');

    // Parse the token from the link
    const url = new URL(actionLink);
    const token = url.searchParams.get('token');
    const tokenType = url.searchParams.get('type');

    console.log('Token extracted, type:', tokenType);

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        tokenType,
        email: user.email,
        userId: user.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Kingschat auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Authentication failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
