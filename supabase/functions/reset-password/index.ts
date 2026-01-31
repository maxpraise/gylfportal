import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token and new password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the reset token
    const { data: resetRecord, error: findError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("otp_code", token)
      .eq("otp_type", "password_reset")
      .eq("verified", false)
      .maybeSingle();

    if (findError || !resetRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset link" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token has expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Delete expired token
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("id", resetRecord.id);

      return new Response(
        JSON.stringify({ error: "Reset link has expired. Please request a new one." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check attempts (max 3)
    if (resetRecord.attempts >= 3) {
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("id", resetRecord.id);

      return new Response(
        JSON.stringify({ error: "Too many attempts. Please request a new reset link." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", resetRecord.email)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (updateError) {
      // Increment attempts on failure
      await supabase
        .from("otp_verifications")
        .update({ attempts: resetRecord.attempts + 1 })
        .eq("id", resetRecord.id);

      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark token as used and delete it
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("id", resetRecord.id);

    console.log("Password reset successful for:", resetRecord.email);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
