import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CourseVideoPlayer from '@/components/academy/CourseVideoPlayer';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  Trophy,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface CourseProgress {
  id: string;
  progress_percentage: number;
  watch_time_seconds: number;
  completed_at: string | null;
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCourseAndProgress = async () => {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError || !courseData) {
        toast({
          title: 'Course not found',
          description: 'The requested course could not be found.',
          variant: 'destructive',
        });
        navigate('/dashboard/academy');
        return;
      }

      setCourse(courseData);

      // Fetch progress if logged in
      if (profile?.id) {
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('*')
          .eq('course_id', id)
          .eq('profile_id', profile.id)
          .single();

        if (progressData) {
          setProgress(progressData);
        }
      }

      setIsLoading(false);
    };

    fetchCourseAndProgress();
  }, [id, profile?.id, navigate, toast]);

  const handleProgressUpdate = useCallback(async (progressPercent: number, watchTime: number) => {
    if (!profile?.id || !id || isSavingProgress) return;

    setIsSavingProgress(true);

    try {
      const { data: existing } = await supabase
        .from('course_progress')
        .select('id')
        .eq('course_id', id)
        .eq('profile_id', profile.id)
        .single();

      if (existing) {
        await supabase
          .from('course_progress')
          .update({
            progress_percentage: Math.round(progressPercent),
            watch_time_seconds: Math.round(watchTime),
            last_watched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('course_progress')
          .insert({
            course_id: id,
            profile_id: profile.id,
            progress_percentage: Math.round(progressPercent),
            watch_time_seconds: Math.round(watchTime),
          });
      }

      setProgress((prev) => ({
        ...prev!,
        progress_percentage: Math.round(progressPercent),
        watch_time_seconds: Math.round(watchTime),
      }));
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
    }
  }, [profile?.id, id, isSavingProgress]);

  const handleCourseComplete = useCallback(async () => {
    if (!profile?.id || !id || progress?.completed_at) return;

    try {
      // Mark course as completed
      await supabase
        .from('course_progress')
        .update({
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('course_id', id)
        .eq('profile_id', profile.id);

      // Generate certificate
      const certificateNumber = 'GYLF-CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      await supabase
        .from('user_certificates')
        .insert({
          course_id: id,
          profile_id: profile.id,
          certificate_number: certificateNumber,
          points_awarded: 100,
        });

      setProgress((prev) => ({
        ...prev!,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
      }));

      setShowCompletionModal(true);

      toast({
        title: 'Congratulations! 🎉',
        description: 'You have completed this course and earned 100 points!',
      });
    } catch (error) {
      console.error('Error completing course:', error);
    }
  }, [profile?.id, id, progress?.completed_at, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-32 bg-surface-container-high rounded animate-pulse" />
        <div className="aspect-video bg-surface-container-high rounded-xl animate-pulse" />
        <div className="h-24 bg-surface-container-high rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const isCompleted = progress?.completed_at !== null && progress?.completed_at !== undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/academy')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{course.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{course.category}</Badge>
            {course.duration_hours && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration_hours}h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {course.video_url ? (
        <CourseVideoPlayer
          videoUrl={course.video_url}
          thumbnailUrl={course.thumbnail_url}
          initialProgress={progress?.progress_percentage || 0}
          onProgress={handleProgressUpdate}
          onComplete={handleCourseComplete}
        />
      ) : (
        <Card className="aspect-video flex items-center justify-center">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Video Coming Soon</h3>
            <p className="text-muted-foreground">
              This course video is being prepared and will be available soon.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress?.progress_percentage || 0}%
            </span>
          </div>
          <Progress value={progress?.progress_percentage || 0} className="h-2" />
          {isCompleted && (
            <div className="flex items-center gap-2 mt-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Course Completed!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">About This Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {course.description || 'No description available for this course.'}
          </p>
        </CardContent>
      </Card>

      {/* Completion Reward Card */}
      {!isCompleted && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Complete to Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Watch the full video to earn 100 points and a certificate!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="max-w-sm w-full animate-in zoom-in-95">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Congratulations! 🎉
              </h2>
              <p className="text-muted-foreground mb-6">
                You've completed "{course.title}" and earned:
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-high p-4 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">+100</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="bg-surface-container-high p-4 rounded-lg">
                  <Award className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">1</p>
                  <p className="text-xs text-muted-foreground">Certificate</p>
                </div>
              </div>
              <Button onClick={() => setShowCompletionModal(false)} className="w-full">
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
