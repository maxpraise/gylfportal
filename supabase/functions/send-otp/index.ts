import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, fullName } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const mailtrapApiKey = Deno.env.get('MAILTRAP_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing OTPs for this email
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', email)

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        email,
        otp_code: otpCode,
        otp_type: 'email',
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      })

    if (insertError) {
      console.error('Error inserting OTP:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Mailtrap
    const emailResponse = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailtrapApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: 'noreply@gylf.org',
          name: 'GYLF Communications',
        },
        to: [{ email }],
        subject: 'Your GYLF Verification Code',
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
              .otp-code { background: #1e40af; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌍 Global Youth Leaders' Forum</h1>
              </div>
              <div class="content">
                <p>Hello${fullName ? ` ${fullName}` : ''},</p>
                <p>Welcome to GYLF! Use the verification code below to complete your registration:</p>
                <div class="otp-code">${otpCode}</div>
                <p><strong>This code expires in 10 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>God bless you!</p>
                <p><em>— GYLF Communications Team</em></p>
              </div>
              <div class="footer">
                <p>Raising Leaders, Building the Future...</p>
                <p>© 2025 Global Youth Leaders' Forum. All Rights Reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Mailtrap error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
