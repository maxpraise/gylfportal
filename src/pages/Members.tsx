import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Download, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Referral {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  avatar_url: string | null;
  total_referrals: number;
  current_level_id: string | null;
}

interface GrowthPath {
  id: string;
  name: string;
  level: number;
}

const Referrals = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [levels, setLevels] = useState<GrowthPath[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch growth paths for level names
      const { data: levelsData } = await supabase
        .from('growth_paths')
        .select('id, name, level')
        .order('level');

      if (levelsData) {
        setLevels(levelsData);
      }

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, avatar_url, total_referrals, current_level_id')
        .eq('referred_by_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [profile]);

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return 'New Ambassador';
    const level = levels.find((l) => l.id === levelId);
    return level?.name || 'New Ambassador';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredReferrals = referrals.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Joined Date', 'Level', 'Their Members'];
    const rows = filteredReferrals.map((r) => [
      r.full_name,
      r.email,
      new Date(r.created_at).toLocaleDateString(),
      getLevelName(r.current_level_id),
      r.total_referrals.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-members.csv';
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your network of {referrals.length} members
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={referrals.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => navigate('/dashboard/invite')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite More
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {referrals.filter((r) => {
                const joinDate = new Date(r.created_at);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Network Reach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {referrals.reduce((sum, r) => sum + r.total_referrals, 0) + referrals.length}
            </div>
            <p className="text-xs text-muted-foreground">Including their referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-4">
                Share your referral code to start building your network.
              </p>
              <Button onClick={() => navigate('/dashboard/invite')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Their Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={referral.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(referral.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{referral.full_name}</p>
                            <p className="text-sm text-muted-foreground">{referral.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getLevelName(referral.current_level_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {referral.total_referrals}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;
