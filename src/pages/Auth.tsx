import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Eye, EyeOff, User, Lock, UserPlus, KeyRound, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import gylfLogo from '@/assets/gylf-logo.png';

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
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-body-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (signupStep === 'otp') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top App Bar */}
        <header className="top-app-bar">
          <button
            onClick={handleBackToForm}
            className="p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors touch-target"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-title-large flex-1">Verify Email</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-safe-nav">
          <div className="w-full max-w-sm space-y-8">
            {/* Icon */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-headline-small text-foreground">Check your email</h2>
                <p className="text-body-medium text-muted-foreground">
                  We sent a verification code to
                </p>
                <p className="text-body-large font-medium text-foreground">{email}</p>
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
                      className="w-12 h-14 text-xl rounded-xl border-2 border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <p className="text-body-small text-destructive text-center">{otpError}</p>
            )}

            {/* Verify Button */}
            <Button 
              onClick={handleVerifyOTP}
              className="w-full h-14"
              disabled={isSubmitting || otpValue.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-body-medium text-muted-foreground">
                Didn't receive the code?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-foreground font-medium">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    className="text-primary font-medium hover:underline"
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-title-large text-foreground">Creating your account</h2>
            <p className="text-body-medium text-muted-foreground">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <img src={gylfLogo} alt="GYLF" className="w-20 h-20 mb-4" />
        <h1 className="text-headline-small text-foreground font-medium">GYLF Portal</h1>
        <p className="text-body-medium text-muted-foreground mt-1">
          {authMode === 'signin' ? 'Welcome back!' : 'Join the movement'}
        </p>
      </div>

      {/* Form Container */}
      <div className="flex-1 px-6 pb-safe-nav">
        <div className="w-full max-w-sm mx-auto">
          {authMode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-body-small text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-body-small text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-body-small text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <Button 
                type="submit" 
                className="w-full h-14 mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Switch to Sign Up */}
              <div className="text-center pt-4">
                <p className="text-body-medium text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          ) : authMode === 'forgot' ? (
            /* Forgot Password Form */
            resetEmailSent ? (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                    <Mail className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-small text-foreground">Check your email</h2>
                    <p className="text-body-medium text-muted-foreground">
                      We've sent a password reset link to
                    </p>
                    <p className="text-body-large font-medium text-foreground">{email}</p>
                  </div>
                </div>
                
                <p className="text-body-small text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <Button 
                  variant="outline"
                  className="w-full h-14"
                  onClick={() => switchMode('signin')}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-title-large text-foreground">Forgot Password?</h2>
                  <p className="text-body-medium text-muted-foreground mt-2">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-label-large text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-body-small text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-body-medium text-primary font-medium hover:underline inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : authMode === 'reset' ? (
            /* Reset Password Form */
            passwordResetSuccess ? (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-small text-foreground">Password Reset!</h2>
                    <p className="text-body-medium text-muted-foreground">
                      Your password has been updated successfully.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full h-14"
                  onClick={() => switchMode('signin')}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-title-large text-foreground">Create New Password</h2>
                  <p className="text-body-medium text-muted-foreground mt-2">
                    Enter your new password below
                  </p>
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <label className="text-label-large text-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-body-small text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-label-large text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-12 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-body-small text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUpInitiate} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`pl-12 ${errors.fullName ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-body-small text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-body-small text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-body-small text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-12 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-body-small text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Referral Code (Optional) */}
              <div className="space-y-2">
                <label className="text-label-large text-foreground">
                  Referral Code <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>

              {/* Sign Up Button */}
              <Button 
                type="submit" 
                className="w-full h-14 mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending verification...' : 'Continue'}
              </Button>

              {/* Switch to Sign In */}
              <div className="text-center pt-2">
                <p className="text-body-medium text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
