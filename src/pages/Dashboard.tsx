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
  Heart,
  Calendar,
  Cloud,
  Play,
  DollarSign,
  MessageSquare,
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

interface ActivityStats {
  heartReports: number;
  meetings: number;
  prayerRequests: number;
  testimonies: number;
  totalPartnership: number;
}

interface RecentActivity {
  id: string;
  type: 'heart' | 'meeting' | 'prayer' | 'testimony' | 'partnership';
  title: string;
  date: string;
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
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    heartReports: 0,
    meetings: 0,
    prayerRequests: 0,
    testimonies: 0,
    totalPartnership: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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

      // Fetch activity stats
      const [heartRes, meetingsRes, prayersRes, testimoniesRes, partnershipsRes] = await Promise.all([
        supabase.from('heart_reports').select('id, outreach_name, created_at').eq('profile_id', profile.id),
        supabase.from('connect_meetings').select('id, meeting_title, created_at').eq('profile_id', profile.id),
        supabase.from('prayer_requests').select('id, request, created_at').eq('profile_id', profile.id),
        supabase.from('testimonies').select('id, title, created_at').eq('profile_id', profile.id),
        supabase.from('partnerships').select('id, amount, category, created_at').eq('profile_id', profile.id),
      ]);

      const heartReports = heartRes.data || [];
      const meetings = meetingsRes.data || [];
      const prayers = prayersRes.data || [];
      const testimonies = testimoniesRes.data || [];
      const partnerships = partnershipsRes.data || [];

      const totalPartnership = partnerships.reduce((sum, p) => sum + Number(p.amount), 0);

      setActivityStats({
        heartReports: heartReports.length,
        meetings: meetings.length,
        prayerRequests: prayers.length,
        testimonies: testimonies.length,
        totalPartnership,
      });

      // Build recent activity feed
      const allActivities: RecentActivity[] = [
        ...heartReports.map(h => ({ id: h.id, type: 'heart' as const, title: h.outreach_name, date: h.created_at })),
        ...meetings.map(m => ({ id: m.id, type: 'meeting' as const, title: m.meeting_title, date: m.created_at })),
        ...prayers.map(p => ({ id: p.id, type: 'prayer' as const, title: p.request.substring(0, 50) + '...', date: p.created_at })),
        ...testimonies.map(t => ({ id: t.id, type: 'testimony' as const, title: t.title, date: t.created_at })),
        ...partnerships.map(p => ({ id: p.id, type: 'partnership' as const, title: `$${p.amount} - ${p.category}`, date: p.created_at })),
      ];

      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(allActivities.slice(0, 8));

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

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'heart': return <Heart className="h-4 w-4 text-destructive" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-primary" />;
      case 'prayer': return <Cloud className="h-4 w-4 text-chart-2" />;
      case 'testimony': return <MessageSquare className="h-4 w-4 text-chart-1" />;
      case 'partnership': return <DollarSign className="h-4 w-4 text-chart-3" />;
    }
  };

  const getActivityLabel = (type: RecentActivity['type']) => {
    switch (type) {
      case 'heart': return 'HEART Report';
      case 'meeting': return 'Meeting';
      case 'prayer': return 'Prayer Request';
      case 'testimony': return 'Testimony';
      case 'partnership': return 'Partnership';
    }
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

        {/* HEART Reports */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              HEART Reports
            </CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activityStats.heartReports}</div>
            <p className="text-xs text-muted-foreground mt-1">Outreaches submitted</p>
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

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-gradient-to-br from-card to-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activityStats.meetings}</p>
              <p className="text-xs text-muted-foreground">Meetings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-chart-2/10">
              <Cloud className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activityStats.prayerRequests}</p>
              <p className="text-xs text-muted-foreground">Prayers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-chart-1/10">
              <MessageSquare className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activityStats.testimonies}</p>
              <p className="text-xs text-muted-foreground">Testimonies</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-card to-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-chart-3/10">
              <DollarSign className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${activityStats.totalPartnership.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Partnership</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth Progress */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Member Growth</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/members')}>
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

      {/* Watch GYTV eCard and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Watch GYTV eCard */}
        <Card className="border-border overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Watch GYTV</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Stay connected with the latest GYLF programs, teachings, and events.
              </p>
              <Button 
                className="w-full"
                onClick={() => window.open('https://www.youtube.com/@GYLFTV', '_blank')}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Now
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Latest Programs</span>
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate">Youth Leadership Masterclass</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate">Global Impact Stories</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start engaging with GYLF programs to see your activity here!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/heart')}>
                    <Heart className="mr-2 h-4 w-4" />
                    HEART
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/prayer')}>
                    <Cloud className="mr-2 h-4 w-4" />
                    Prayer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/testimony')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Testimony
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-full bg-background">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{getActivityLabel(activity.type)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Referrals */}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {referral.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{referral.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
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
