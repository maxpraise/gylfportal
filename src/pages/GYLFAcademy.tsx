import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RewardsDisplay from '@/components/academy/RewardsDisplay';
import {
  Play,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  Trophy,
  Lock,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_hours: number;
  video_url: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  order_index: number;
}

const GYLFAcademy = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [stats, setStats] = useState({ completed: 0, quizzesPassed: 0, certificates: 0 });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index');

      if (coursesData) {
        setCourses(coursesData);
      }

      // Fetch user progress and stats if logged in
      if (profile?.id) {
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('course_id, progress_percentage, completed_at')
          .eq('profile_id', profile.id);

        if (progressData) {
          const progressMap: Record<string, number> = {};
          let completedCount = 0;
          progressData.forEach((p) => {
            progressMap[p.course_id] = p.progress_percentage;
            if (p.completed_at) completedCount++;
          });
          setCourseProgress(progressMap);
          setStats((prev) => ({ ...prev, completed: completedCount }));
        }

        const { data: pointsData } = await supabase
          .from('user_points')
          .select('quizzes_passed, courses_completed')
          .eq('profile_id', profile.id)
          .single();

        if (pointsData) {
          setStats((prev) => ({
            ...prev,
            quizzesPassed: pointsData.quizzes_passed,
            certificates: pointsData.courses_completed,
          }));
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [profile?.id]);

  const sampleQuizQuestions = [
    {
      question: 'What is the primary mission of GYLF?',
      options: [
        'Entertainment',
        'Raising leaders and building the future',
        'Sports activities',
        'Fashion shows',
      ],
    },
    {
      question: 'Which of the following is a HEART Initiative category?',
      options: ['Sports', 'Humanitarian', 'Fashion', 'Gaming'],
    },
    {
      question: 'How can you invite new members to GYLF?',
      options: ['Social media only', 'Using your referral code', 'Phone calls only', 'Email only'],
    },
  ];

  const handleQuizSubmit = () => {
    const correctAnswers = ['Raising leaders and building the future', 'Humanitarian', 'Using your referral code'];
    let score = 0;
    Object.keys(quizAnswers).forEach((key, index) => {
      if (quizAnswers[parseInt(key)] === correctAnswers[index]) {
        score++;
      }
    });

    const percentage = Math.round((score / sampleQuizQuestions.length) * 100);
    const passed = percentage >= 70;

    toast({
      title: passed ? 'Congratulations! 🎉' : 'Keep Learning!',
      description: `You scored ${percentage}% (${score}/${sampleQuizQuestions.length}). ${passed ? 'You passed!' : 'You need 70% to pass. Try again!'}`,
      variant: passed ? 'default' : 'destructive',
    });

    setShowQuiz(false);
    setQuizAnswers({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">GYLF Academy</h1>
        <p className="text-muted-foreground mt-1">
          Learn and grow through training courses and quizzes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-muted-foreground">Courses Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.quizzesPassed}</p>
                <p className="text-xs text-muted-foreground">Quizzes Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.certificates}</p>
                <p className="text-xs text-muted-foreground">Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        {/* Training Videos */}
        <TabsContent value="courses" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground">Training courses will be available soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progress = courseProgress[course.id] || 0;
                const isCompleted = progress === 100;
                
                return (
                  <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <Play className="h-12 w-12 text-muted-foreground" />
                      )}
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{course.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration_hours}h
                        </span>
                      </div>
                      <CardTitle className="text-base mt-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {progress > 0 && !isCompleted && (
                        <div className="space-y-1">
                          <Progress value={progress} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">{progress}% complete</p>
                        </div>
                      )}
                      <Button 
                        variant={isCompleted ? "secondary" : "outline"} 
                        className="w-full" 
                        onClick={() => navigate(`/dashboard/academy/${course.id}`)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {isCompleted ? 'Watch Again' : progress > 0 ? 'Continue' : 'Start Course'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Sample courses for demo */}
          {courses.length === 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {[
                { title: 'GYLF Leadership Fundamentals', category: 'Leadership', duration: 2 },
                { title: 'Effective Communication', category: 'Skills', duration: 1.5 },
                { title: 'Building Your Network', category: 'Growth', duration: 1 },
              ].map((course, i) => (
                <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <Play className="h-12 w-12 text-muted-foreground" />
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{course.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}h
                      </span>
                    </div>
                    <CardTitle className="text-base mt-2">{course.title}</CardTitle>
                    <CardDescription>Coming soon...</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="outline" className="w-full" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quiz */}
        <TabsContent value="quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                GYLF Knowledge Quiz
              </CardTitle>
              <CardDescription>
                Test your knowledge and earn badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showQuiz ? (
                <div className="text-center py-6">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Ready to Test Your Knowledge?</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete quizzes to earn certificates and badges. You need 70% to pass.
                  </p>
                  <Button onClick={() => setShowQuiz(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sampleQuizQuestions.map((q, index) => (
                    <div key={index} className="space-y-3">
                      <h4 className="font-medium">
                        {index + 1}. {q.question}
                      </h4>
                      <RadioGroup
                        value={quizAnswers[index] || ''}
                        onValueChange={(value) => setQuizAnswers({ ...quizAnswers, [index]: value })}
                      >
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${index}-${optIndex}`} />
                            <Label htmlFor={`q${index}-${optIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowQuiz(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleQuizSubmit}>Submit Answers</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <RewardsDisplay />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GYLFAcademy;