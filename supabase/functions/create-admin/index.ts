import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client to create admin user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, fullName } = await req.json();

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users.find(u => u.email === email);
    
    if (existingAdmin) {
      // Admin exists, just make sure they have admin role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingAdmin.id)
        .eq('role', 'admin')
        .single();

      if (!existingRole) {
        // Delete any existing roles and add admin role
        await supabaseAdmin.from('user_roles').delete().eq('user_id', existingAdmin.id);
        await supabaseAdmin.from('user_roles').insert({
          user_id: existingAdmin.id,
          role: 'admin',
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Admin user already exists and role verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Generate referral code
    const { data: referralCode } = await supabaseAdmin.rpc('generate_referral_code');

    // Get default level
    const { data: levelData } = await supabaseAdmin
      .from('growth_paths')
      .select('id')
      .eq('level', 1)
      .single();

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      user_id: authData.user.id,
      email,
      full_name: fullName,
      referral_code: referralCode || `GYLF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      current_level_id: levelData?.id,
    });

    // Delete any auto-assigned ambassador role and set admin role
    await supabaseAdmin.from('user_roles').delete().eq('user_id', authData.user.id);
    await supabaseAdmin.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'admin',
    });

    return new Response(
      JSON.stringify({ success: true, message: "Admin user created successfully", userId: authData.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating admin:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
