import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_SECONDS = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailtrapApiKey = Deno.env.get("MAILTRAP_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("email", email)
      .maybeSingle();

    // Always return success to prevent email enumeration attacks
    if (!profile) {
      console.log("Password reset requested for non-existent email:", email);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: Check if a reset was recently requested
    const rateLimitTime = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
    const { data: recentReset } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email)
      .eq("otp_type", "password_reset")
      .gte("created_at", rateLimitTime)
      .maybeSingle();

    if (recentReset) {
      return new Response(
        JSON.stringify({ error: "Please wait 60 seconds before requesting another reset" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", email)
      .eq("otp_type", "password_reset");

    // Insert new reset token
    const { error: insertError } = await supabase.from("otp_verifications").insert({
      email,
      otp_code: resetToken,
      otp_type: "password_reset",
      expires_at: expiresAt.toISOString(),
      verified: false,
      attempts: 0,
    });

    if (insertError) {
      console.error("Error inserting reset token:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate reset token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Construct reset URL
    const resetUrl = `https://gylfportal.lovable.app/auth?mode=reset&token=${resetToken}`;
    const sanitizedName = profile.full_name ? profile.full_name.replace(/[<>&"']/g, '').slice(0, 100) : '';

    // Send email via Mailtrap
    const emailResponse = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailtrapApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "noreply@dispatch.globalyouthleadersforum.org",
          name: "GYLF Communications",
        },
        to: [{ email }],
        subject: "Reset Your GYLF Portal Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #1e40af; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔒 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello${sanitizedName ? ` ${sanitizedName}` : ""},</p>
                <p>We received a request to reset your password for your GYLF Portal account.</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset My Password</a>
                </p>
                <div class="warning">
                  <strong>⏰ This link expires in 1 hour.</strong>
                </div>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <p>God bless you!</p>
                <p><em>— GYLF Communications Team</em></p>
              </div>
              <div class="footer">
                <p>Raising Leaders, Building the Future...</p>
                <p>© 2026 Global Youth Leaders' Forum. All Rights Reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Mailtrap error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send reset email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Password reset email sent to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
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
