import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface KingschatTokenResponse {
  accessToken: string;
  expiresInMillis: number;
  refreshToken: string;
}

interface KingschatUserInfo {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, refreshToken, expiresInMillis, userInfo } = await req.json();

    if (!accessToken || !userInfo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accessToken and userInfo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Kingschat auth request received for user:', userInfo.username || userInfo.id);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Construct a unique email for Kingschat users if they don't have one
    const email = userInfo.email || `${userInfo.id}@kingschat.local`;
    const fullName = userInfo.name || userInfo.username || 'Kingschat User';

    // Check if user already exists by email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    let user = existingUsers?.users?.find(u => u.email === email);
    
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
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw, profile might already exist from trigger
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
        },
      });
    }

    // Generate a session for the user
    // We'll use a magic link approach - generate a token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      console.error('Error generating session link:', sessionError);
      throw sessionError;
    }

    // Extract the token from the action link
    const actionLink = sessionData?.properties?.action_link;
    if (!actionLink) {
      throw new Error('Failed to generate authentication link');
    }

    // Parse the token from the link
    const url = new URL(actionLink);
    const token = url.searchParams.get('token');
    const tokenType = url.searchParams.get('type');

    console.log('Authentication link generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        tokenType,
        email,
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
