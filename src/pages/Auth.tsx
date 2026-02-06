import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Globe, Users, TrendingUp, Shield, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

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

type SignupStep = 'form' | 'otp' | 'creating';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // OTP state
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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
        
        // Now create the account
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-primary p-8 lg:p-12 flex flex-col justify-center text-primary-foreground">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Global Youth Leaders&apos; Forum</h1>
              <p className="text-sm opacity-80">Raising Leaders, building the future...</p>
            </div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Welcome to the GYLF Ambassador Portal
          </h2>
          
          <p className="text-lg opacity-90 mb-8">
            Join thousands of young leaders making a difference in their communities worldwide.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/20 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Build Your Network</h3>
                <p className="text-sm opacity-80">Connect with leaders globally</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Grow Your Impact</h3>
                <p className="text-sm opacity-80">Track your leadership journey</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/20 p-3 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Access Resources</h3>
                <p className="text-sm opacity-80">Exclusive leadership materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Auth Forms */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">GYLF Portal</CardTitle>
            <CardDescription className="text-muted-foreground">
              {signupStep === 'otp' 
                ? 'Enter the verification code sent to your email'
                : signupStep === 'creating'
                ? 'Creating your account...'
                : 'Sign in to your account or create a new one'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signupStep === 'otp' ? (
              <div className="space-y-6">
                <button
                  onClick={handleBackToForm}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">We sent a code to</p>
                    <p className="font-medium text-foreground">{email}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={(value) => {
                      setOtpValue(value);
                      setOtpError('');
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                {otpError && (
                  <p className="text-sm text-destructive text-center">{otpError}</p>
                )}
                
                <Button 
                  onClick={handleVerifyOTP}
                  className="w-full"
                  disabled={isSubmitting || otpValue.length !== 6}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-foreground">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        onClick={handleResendOTP}
                        className="text-primary hover:underline font-medium"
                        disabled={isSubmitting}
                      >
                        Resend
                      </button>
                    )}
                  </p>
                </div>
              </div>
            ) : signupStep === 'creating' ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Creating your account...</p>
              </div>
            ) : (
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUpInitiate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? 'border-destructive' : ''}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
                      <Input
                        id="signup-referral"
                        type="text"
                        placeholder="GYLF123ABC"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending Code...' : 'Continue'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
