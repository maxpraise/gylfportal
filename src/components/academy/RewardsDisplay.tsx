import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Award, Flame, Star, Medal } from 'lucide-react';

interface UserPoints {
  total_points: number;
  courses_completed: number;
  quizzes_passed: number;
  current_streak: number;
  longest_streak: number;
}

interface Certificate {
  id: string;
  certificate_number: string;
  earned_at: string;
  points_awarded: number;
  course: {
    title: string;
    category: string;
  };
}

const RewardsDisplay = () => {
  const { profile } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchRewards = async () => {
      // Fetch user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (pointsData) {
        setUserPoints(pointsData);
      }

      // Fetch certificates with course info
      const { data: certsData } = await supabase
        .from('user_certificates')
        .select(`
          id,
          certificate_number,
          earned_at,
          points_awarded,
          course:academy_courses(title, category)
        `)
        .eq('profile_id', profile.id)
        .order('earned_at', { ascending: false });

      if (certsData) {
        setCertificates(certsData as unknown as Certificate[]);
      }

      setIsLoading(false);
    };

    fetchRewards();
  }, [profile?.id]);

  const getLevel = (points: number) => {
    if (points >= 1000) return { name: 'Gold Leader', color: 'bg-yellow-500', next: null, progress: 100 };
    if (points >= 500) return { name: 'Silver Leader', color: 'bg-gray-400', next: 1000, progress: ((points - 500) / 500) * 100 };
    if (points >= 200) return { name: 'Bronze Leader', color: 'bg-amber-700', next: 500, progress: ((points - 200) / 300) * 100 };
    return { name: 'Rising Star', color: 'bg-primary', next: 200, progress: (points / 200) * 100 };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-surface-container-high rounded-xl animate-pulse" />
        <div className="h-48 bg-surface-container-high rounded-xl animate-pulse" />
      </div>
    );
  }

  const points = userPoints?.total_points || 0;
  const level = getLevel(points);

  return (
    <div className="space-y-4">
      {/* Points & Level Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${level.color}`}>
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{level.name}</p>
                <p className="text-sm text-muted-foreground">{points} points</p>
              </div>
            </div>
            {level.next && (
              <Badge variant="secondary">
                {level.next - points} pts to next level
              </Badge>
            )}
          </div>

          {/* Progress to next level */}
          {level.next && (
            <div className="space-y-1">
              <Progress value={level.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(level.progress)}% to next level
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-surface-container rounded-lg">
              <Award className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{userPoints?.courses_completed || 0}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div className="text-center p-3 bg-surface-container rounded-lg">
              <Medal className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-lg font-bold">{userPoints?.quizzes_passed || 0}</p>
              <p className="text-xs text-muted-foreground">Quizzes</p>
            </div>
            <div className="text-center p-3 bg-surface-container rounded-lg">
              <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{userPoints?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Certificates Earned
            </CardTitle>
            <CardDescription>Your achievements and certifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-3 p-3 bg-surface-container-high rounded-lg"
                >
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{cert.course?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.certificate_number} • +{cert.points_awarded} pts
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(cert.earned_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {certificates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Certificates Yet</h3>
            <p className="text-sm text-muted-foreground">
              Complete courses to earn certificates and rewards!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RewardsDisplay;
