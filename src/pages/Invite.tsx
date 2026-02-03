import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  Share2,
  Mail,
  MessageSquare,
  QrCode,
  Check,
  Users,
  Globe,
} from 'lucide-react';

const Invite = () => {
  const { profile, isLoading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  // Show loading state while profile is being fetched
  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  const inviteMessage = `Join me in the Global Youth Leaders' Forum! 🌍

I'm building a network of young leaders who are making a difference in their communities. 

Use my referral code: ${referralCode}

Or join directly here: ${referralLink}

#GYLF #YoungLeaders #Leadership`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform: string) => {
    const encodedMessage = encodeURIComponent(inviteMessage);
    const encodedLink = encodeURIComponent(referralLink);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodeURIComponent(inviteMessage)}`,
      email: `mailto:?subject=${encodeURIComponent('Join the Global Youth Leaders Forum!')}&body=${encodedMessage}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Invite Members</h1>
        <p className="text-muted-foreground mt-1">
          Grow your network by inviting others to join GYLF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referral Code Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share this unique code with people you want to invite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-6 text-center border-2 border-dashed border-primary/20">
              <p className="text-3xl font-bold font-mono text-primary tracking-wider">
                {profile?.referral_code}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => copyToClipboard(profile?.referral_code || '', 'Referral code')}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Anyone who signs up with this link will be added to your network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={referralLink}
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralLink, 'Referral link')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => copyToClipboard(referralLink, 'Referral link')}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Share Options */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Invite
          </CardTitle>
          <CardDescription>
            Choose how you want to share your referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('whatsapp')}
            >
              <MessageSquare className="h-6 w-6 text-chart-1" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('telegram')}
            >
              <MessageSquare className="h-6 w-6 text-chart-4" />
              <span className="text-xs">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('twitter')}
            >
              <Share2 className="h-6 w-6 text-foreground" />
              <span className="text-xs">Twitter/X</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('facebook')}
            >
              <Share2 className="h-6 w-6 text-chart-4" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('linkedin')}
            >
              <Users className="h-6 w-6 text-chart-4" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => shareVia('email')}
            >
              <Mail className="h-6 w-6 text-destructive" />
              <span className="text-xs">Email</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Message */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Invite Message Template
          </CardTitle>
          <CardDescription>
            Copy and customize this message to send to your contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            readOnly
            value={inviteMessage}
            className="min-h-[180px] resize-none bg-muted"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => copyToClipboard(inviteMessage, 'Message')}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Message
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-border bg-primary/5">
        <CardHeader>
          <CardTitle>Tips for Growing Your Network</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
              <span>Share your referral link on your social media profiles</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
              <span>Send personalized invites to friends who are passionate about leadership</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
              <span>Share your GYLF journey and achievements to inspire others</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
              <span>Include your referral code in your email signature</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
