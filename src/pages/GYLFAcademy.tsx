import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Play,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  CreditCard,
  Building2,
  Coins,
  Trophy,
  Star,
  ChevronRight,
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

interface Partnership {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  category: string;
  status: string;
  created_at: string;
}

const GYLFAcademy = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [partnershipAmount, setPartnershipAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [partnershipCategory, setPartnershipCategory] = useState('');
  const [isSubmittingPartnership, setIsSubmittingPartnership] = useState(false);

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

      // Fetch partnerships
      if (profile?.id) {
        const { data: partnershipsData } = await supabase
          .from('partnerships')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (partnershipsData) {
          setPartnerships(partnershipsData as Partnership[]);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [profile?.id]);

  const handlePartnershipSubmit = async () => {
    if (!profile?.id || !partnershipAmount || !paymentMethod || !partnershipCategory) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all partnership details.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingPartnership(true);

    try {
      const { error } = await supabase.from('partnerships').insert({
        amount: parseFloat(partnershipAmount),
        currency: 'USD',
        payment_method: paymentMethod,
        category: partnershipCategory as 'gylf_academy' | 'gylf_conferences' | 'gylf_missions_trips' | 'gylf_outreaches' | 'hslhs' | 'magazine' | 'offerings' | 'sponsor_gytv',
      });

      if (error) throw error;

      toast({
        title: 'Partnership Recorded!',
        description: 'Your partnership has been recorded. Thank you for your support!',
      });

      // Reset form
      setPartnershipAmount('');
      setPaymentMethod('');
      setPartnershipCategory('');

      // Refresh partnerships
      const { data } = await supabase
        .from('partnerships')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPartnerships(data as Partnership[]);
      }
    } catch (error) {
      console.error('Error submitting partnership:', error);
      toast({
        title: 'Error',
        description: 'Failed to record partnership. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPartnership(false);
    }
  };

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

  const totalPartnership = partnerships.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">GYLF Academy</h1>
        <p className="text-muted-foreground mt-1">
          Learn, grow, and contribute to the mission
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Quizzes Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Coins className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPartnership.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Partnership</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="courses">Training Videos</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="partnership">Partnership</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
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
                  <CardContent className="pt-0">
                    <Button variant="outline" className="w-full" onClick={() => setSelectedCourse(course)}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
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

        {/* Partnership */}
        <TabsContent value="partnership" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Give Partnership
                </CardTitle>
                <CardDescription>
                  Support the GYLF mission through your partnership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Partnership Category</Label>
                  <Select value={partnershipCategory} onValueChange={setPartnershipCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Partnership</SelectItem>
                      <SelectItem value="project">Project Support</SelectItem>
                      <SelectItem value="outreach">Outreach Sponsorship</SelectItem>
                      <SelectItem value="general">General Offering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={partnershipAmount}
                    onChange={(e) => setPartnershipAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={paymentMethod === 'espees' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setPaymentMethod('espees')}
                    >
                      <Coins className="h-5 w-5" />
                      <span className="text-xs">Espees</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs">Card</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs">Bank</span>
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handlePartnershipSubmit}
                  disabled={isSubmittingPartnership}
                >
                  {isSubmittingPartnership ? 'Processing...' : 'Submit Partnership'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Partnership Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Support Youth Leadership</p>
                      <p className="text-sm text-muted-foreground">Your giving helps train young leaders worldwide</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Fund Outreach Programs</p>
                      <p className="text-sm text-muted-foreground">Enable HEART initiatives in communities</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Expand Global Reach</p>
                      <p className="text-sm text-muted-foreground">Help establish GYLF in new regions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Receive Partner Updates</p>
                      <p className="text-sm text-muted-foreground">Get exclusive reports on your impact</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Partnership Performance
              </CardTitle>
              <CardDescription>
                Track your giving history and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partnerships.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Partnerships Yet</h3>
                  <p className="text-muted-foreground">Start your partnership journey today!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerships.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{p.category}</TableCell>
                        <TableCell className="capitalize">{p.payment_method}</TableCell>
                        <TableCell>${p.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GYLFAcademy;
