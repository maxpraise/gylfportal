import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Eye, EyeOff, User, Lock, UserPlus, KeyRound, CheckCircle, MessageCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import gylfLogo from '@/assets/gylf-logo.png';

// Import custom fonts
import '@fontsource/outfit/900.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/700.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';
type SignupStep = 'form' | 'otp' | 'creating';

// Glassmorphism card class
const glassCard = "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-[1.5rem]";

// Input styling - clean white background
const glassInput = "bg-white dark:bg-slate-800 border-0 rounded-[1rem] h-14 px-5 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 font-['Plus_Jakarta_Sans'] font-medium shadow-sm";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Check for reset token in URL
  const resetToken = searchParams.get('token');
  const modeParam = searchParams.get('mode');
  
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (modeParam === 'reset' && resetToken) return 'reset';
    return 'signin';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP state
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Password reset state
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/home');
    }
  }, [user, isLoading, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleKingschatLogin = () => {
    // TODO: Implement Kingschat OAuth when available
    toast({
      title: 'Coming Soon',
      description: 'Kingschat login will be available soon.',
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Incorrect email or password. Please try again.' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to GYLF Portal.',
      });
    }
    setIsSubmitting(false);
  };

  const sendOTP = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, fullName },
      });

      if (error) throw error;

      toast({
        title: 'Verification Code Sent',
        description: `We've sent a 6-digit code to ${email}`,
      });
      setSignupStep('otp');
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: 'Failed to Send Code',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = signupSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await sendOTP();
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setOtpError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otpCode: otpValue },
      });

      if (error) throw error;

      if (data.verified) {
        setSignupStep('creating');
        
        const { error: signUpError } = await signUp(email, password, fullName, referralCode || undefined);
        
        if (signUpError) {
          const errorMessage = signUpError.message.includes('already registered')
            ? 'An account with this email already exists. Please sign in instead.'
            : signUpError.message;
          
          toast({
            title: 'Registration Failed',
            description: errorMessage,
            variant: 'destructive',
          });
          setSignupStep('form');
        } else {
          toast({
            title: 'Welcome to GYLF!',
            description: 'Your account has been created successfully.',
          });
        }
      }
    } catch (error: any) {
      setOtpError(error.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await sendOTP();
  };

  const handleBackToForm = () => {
    setSignupStep('form');
    setOtpValue('');
    setOtpError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const emailValidation = z.string().email('Please enter a valid email address').safeParse(email);
    if (!emailValidation.success) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists with this email, you will receive a password reset link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send Reset Link',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { token: resetToken, newPassword: password },
      });

      if (error) throw error;

      if (data.success) {
        setPasswordResetSuccess(true);
        toast({
          title: 'Password Updated',
          description: 'Your password has been reset successfully. You can now sign in.',
        });
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Please try again or request a new reset link.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setResetEmailSent(false);
    setPasswordResetSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[hsl(200,80%,90%)] via-[hsl(200,70%,95%)] to-[hsl(200,60%,98%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-['Plus_Jakarta_Sans'] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Sky blue gradient background
  const bgGradient = "bg-gradient-to-b from-[hsl(200,80%,90%)] via-[hsl(200,70%,95%)] to-[hsl(200,60%,98%)]";

  // OTP Verification Screen
  if (signupStep === 'otp') {
    return (
      <div className={`min-h-screen ${bgGradient} flex flex-col`}>
        {/* Top App Bar */}
        <header className="flex items-center gap-2 h-16 px-4">
          <button
            onClick={handleBackToForm}
            className="p-2 -ml-2 rounded-full hover:bg-white/30 transition-colors touch-target"
          >
            <ArrowLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-title-large flex-1 font-['Plus_Jakarta_Sans'] font-bold text-slate-800">Verify Email</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-safe-nav">
          <div className={`w-full max-w-sm ${glassCard} p-8 space-y-8`}>
            {/* Icon */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-headline-small font-['Outfit'] font-black uppercase italic tracking-tighter text-slate-800">Check your email</h2>
                <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                  We sent a verification code to
                </p>
                <p className="font-['Plus_Jakarta_Sans'] font-bold text-slate-800">{email}</p>
              </div>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(value) => {
                  setOtpValue(value);
                  setOtpError('');
                }}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot 
                      key={index} 
                      index={index} 
                      className="w-12 h-14 text-xl rounded-xl border-0 bg-white/80 focus:ring-2 focus:ring-primary/30 font-['Plus_Jakarta_Sans'] font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <p className="text-body-small text-destructive text-center font-['Plus_Jakarta_Sans']">{otpError}</p>
            )}

            {/* Verify Button */}
            <Button 
              onClick={handleVerifyOTP}
              className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg"
              disabled={isSubmitting || otpValue.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            {/* Resend */}
            <div className="text-center">
              <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                Didn't receive the code?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-slate-800 font-bold">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    className="text-primary font-bold hover:underline"
                    disabled={isSubmitting}
                  >
                    Resend
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Creating Account Screen
  if (signupStep === 'creating') {
    return (
      <div className={`min-h-screen ${bgGradient} flex flex-col items-center justify-center px-6`}>
        <div className={`${glassCard} p-8 flex flex-col items-center gap-6`}>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-xl text-slate-800">Creating your account</h2>
            <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgGradient} flex flex-col`}>
      {/* Header with Logo */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <img src={gylfLogo} alt="GYLF" className="w-24 h-24 mb-6 drop-shadow-lg" />
        <h1 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-4xl text-[hsl(220,80%,50%)]">GYLF</h1>
        <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-3xl text-slate-800 -mt-1">MOBILE</h2>
        <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-500 mt-3 tracking-widest text-xs uppercase">
          Empowering Youth for Global Impact
        </p>
      </div>

      {/* Form Container */}
      <div className="flex-1 px-6 pb-safe-nav">
        <div className="w-full max-w-sm mx-auto space-y-6">
          
          {authMode === 'signin' ? (
            <>
              {/* Kingschat Login Button */}
              <Button
                type="button"
                onClick={handleKingschatLogin}
                className="w-full h-14 rounded-[1rem] bg-[hsl(200,70%,55%)] hover:bg-[hsl(200,70%,50%)] text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-6 w-6" />
                Login with Kingschat
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-300" />
                <span className="font-['Plus_Jakarta_Sans'] font-medium text-slate-400 text-sm tracking-widest uppercase">Or use email</span>
                <div className="flex-1 h-px bg-slate-300" />
              </div>

              {/* Glass Card Form */}
              <div className={`${glassCard} p-6`}>
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${glassInput} ${errors.email ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${glassInput} pr-12 ${errors.password ? 'ring-2 ring-destructive/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.password}</p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-body-small text-primary font-['Plus_Jakarta_Sans'] font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Enter Mobile App'}
                  </Button>
                </form>
              </div>

              {/* Switch to Sign Up */}
              <div className="text-center pt-2">
                <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </>
          ) : authMode === 'forgot' ? (
            /* Forgot Password Form */
            resetEmailSent ? (
              <div className={`${glassCard} p-8 space-y-6 text-center`}>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-xl text-slate-800">Check your email</h2>
                    <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                      We've sent a password reset link to
                    </p>
                    <p className="font-['Plus_Jakarta_Sans'] font-bold text-slate-800">{email}</p>
                  </div>
                </div>
                
                <p className="text-body-small font-['Plus_Jakarta_Sans'] text-slate-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <Button 
                  variant="outline"
                  className="w-full h-14 rounded-[1rem] border-2 border-slate-300 font-['Outfit'] font-black uppercase italic tracking-tighter"
                  onClick={() => switchMode('signin')}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <div className={`${glassCard} p-6`}>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-xl text-slate-800">Forgot Password?</h2>
                    <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600 mt-2">
                      Enter your email and we'll send you a reset link
                    </p>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${glassInput} ${errors.email ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.email}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-['Plus_Jakarta_Sans'] font-bold text-primary hover:underline inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : authMode === 'reset' ? (
            /* Reset Password Form */
            passwordResetSuccess ? (
              <div className={`${glassCard} p-8 space-y-6 text-center`}>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-xl text-slate-800">Password Reset!</h2>
                    <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                      Your password has been updated successfully.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg"
                  onClick={() => switchMode('signin')}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className={`${glassCard} p-6`}>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-['Outfit'] font-black uppercase italic tracking-tighter text-xl text-slate-800">Create New Password</h2>
                    <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600 mt-2">
                      Enter your new password below
                    </p>
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="NEW PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${glassInput} pr-12 ${errors.password ? 'ring-2 ring-destructive/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="CONFIRM PASSWORD"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${glassInput} pr-12 ${errors.confirmPassword ? 'ring-2 ring-destructive/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </div>
            )
          ) : (
            /* Sign Up Form */
            <>
              {/* Kingschat Signup Button */}
              <Button
                type="button"
                onClick={handleKingschatLogin}
                className="w-full h-14 rounded-[1rem] bg-[hsl(200,70%,55%)] hover:bg-[hsl(200,70%,50%)] text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-6 w-6" />
                Sign up with Kingschat
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-300" />
                <span className="font-['Plus_Jakarta_Sans'] font-medium text-slate-400 text-sm tracking-widest uppercase">Or use email</span>
                <div className="flex-1 h-px bg-slate-300" />
              </div>

              <div className={`${glassCard} p-6`}>
                <form onSubmit={handleSignUpInitiate} className="space-y-4">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="FULL NAME"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${glassInput} ${errors.fullName ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                    {errors.fullName && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${glassInput} ${errors.email ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${glassInput} pr-12 ${errors.password ? 'ring-2 ring-destructive/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="CONFIRM PASSWORD"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${glassInput} pr-12 ${errors.confirmPassword ? 'ring-2 ring-destructive/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-body-small text-destructive font-['Plus_Jakarta_Sans']">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Referral Code (Optional) */}
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="REFERRAL CODE (OPTIONAL)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className={glassInput}
                    />
                  </div>

                  {/* Sign Up Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-[1rem] bg-slate-900 hover:bg-slate-800 text-white font-['Outfit'] font-black uppercase italic tracking-tighter text-lg mt-2" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending verification...' : 'Continue'}
                  </Button>
                </form>
              </div>

              {/* Switch to Sign In */}
              <div className="text-center pt-2">
                <p className="font-['Plus_Jakarta_Sans'] font-medium text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-primary font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
