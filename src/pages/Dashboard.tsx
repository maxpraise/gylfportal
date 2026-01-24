import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Award,
  Copy,
  ExternalLink,
  ArrowUpRight,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface GrowthPath {
  id: string;
  name: string;
  level: number;
  description: string;
  min_referrals: number;
  badge_color: string;
}

interface ReferralStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
}

interface RecentReferral {
  id: string;
  full_name: string;
  created_at: string;
  avatar_url: string | null;
}

const Dashboard = () => {
  const { profile, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentLevel, setCurrentLevel] = useState<GrowthPath | null>(null);
  const [nextLevel, setNextLevel] = useState<GrowthPath | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({ total: 0, thisMonth: 0, thisWeek: 0 });
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [chartData, setChartData] = useState<{ month: string; referrals: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      // Fetch current level
      if (profile.current_level_id) {
        const { data: levelData } = await supabase
          .from('growth_paths')
          .select('*')
          .eq('id', profile.current_level_id)
          .single();
        
        if (levelData) {
          setCurrentLevel(levelData);
          
          // Fetch next level
          const { data: nextLevelData } = await supabase
            .from('growth_paths')
            .select('*')
            .eq('level', levelData.level + 1)
            .maybeSingle();
          
          setNextLevel(nextLevelData);
        }
      }

      // Fetch referral stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const { data: referrals } = await supabase
        .from('referral_tracking')
        .select('created_at, referred_profile_id')
        .eq('referrer_profile_id', profile.id);

      if (referrals) {
        const thisMonthCount = referrals.filter(
          (r) => new Date(r.created_at) >= startOfMonth
        ).length;
        const thisWeekCount = referrals.filter(
          (r) => new Date(r.created_at) >= startOfWeek
        ).length;

        setReferralStats({
          total: referrals.length,
          thisMonth: thisMonthCount,
          thisWeek: thisWeekCount,
        });

        // Generate chart data for last 6 months
        const monthlyData: { [key: string]: number } = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const key = `${months[date.getMonth()]}`;
          monthlyData[key] = 0;
        }

        referrals.forEach((r) => {
          const date = new Date(r.created_at);
          const key = `${months[date.getMonth()]}`;
          if (monthlyData[key] !== undefined) {
            monthlyData[key]++;
          }
        });

        setChartData(Object.entries(monthlyData).map(([month, referrals]) => ({ month, referrals })));
      }

      // Fetch recent referrals
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, avatar_url')
        .eq('referred_by_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentReferrals(recent);
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [profile]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard.',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const progressToNextLevel = () => {
    if (!currentLevel || !nextLevel) return 100;
    const current = profile?.total_referrals || 0;
    const needed = nextLevel.min_referrals - currentLevel.min_referrals;
    const progress = current - currentLevel.min_referrals;
    return Math.min((progress / needed) * 100, 100);
  };

  const referralsToNextLevel = () => {
    if (!nextLevel) return 0;
    return Math.max(0, nextLevel.min_referrals - (profile?.total_referrals || 0));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your leadership journey
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/invite')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Referrals */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{referralStats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-chart-1" />
              <span className="text-chart-1">+{referralStats.thisMonth}</span> this month
            </p>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Level
            </CardTitle>
            <Award className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentLevel?.name || 'New Ambassador'}</div>
            <Badge variant="secondary" className="mt-1">
              Level {currentLevel?.level || 1}
            </Badge>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{referralStats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">New referrals</p>
          </CardContent>
        </Card>

        {/* Referral Code */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Referral Code
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={copyReferralLink} className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-primary">{profile?.referral_code}</div>
            <button 
              onClick={copyReferralLink}
              className="text-xs text-muted-foreground flex items-center gap-1 mt-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Copy referral link
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth Progress */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Referral Growth</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/referrals')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="referrals"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReferrals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Level Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{currentLevel?.name || 'New Ambassador'}</h3>
              <p className="text-sm text-muted-foreground">{currentLevel?.description}</p>
            </div>

            {nextLevel && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
                  <span className="font-medium">{Math.round(progressToNextLevel())}%</span>
                </div>
                <Progress value={progressToNextLevel()} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {referralsToNextLevel()} more referrals needed
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard/growth')}
            >
              View Growth Path
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Referrals</span>
            {recentReferrals.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/referrals')}>
                View All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing your referral code to grow your network!
              </p>
              <Button onClick={() => navigate('/dashboard/invite')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {referral.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{referral.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Level 1</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
