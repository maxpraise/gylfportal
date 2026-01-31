import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  validateImageFiles,
  validateCsvFiles,
  generateUploadPath,
} from '@/lib/fileValidation';
import { uploadFileWithSignedUrl } from '@/lib/signedUrls';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Heart,
  Palette,
  Globe,
  Cpu,
  Church,
  Upload,
  FileText,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';

const heartReportSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  outreach_name: z.string().min(1, 'Outreach name is required').max(100, 'Name must be less than 100 characters'),
  event_date: z.string().min(1, 'Event date is required'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must be less than 100 characters'),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  location_details: z.string().max(255, 'Location details must be less than 255 characters').optional(),
  reach_impact: z.string().min(1, 'People reached is required').refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    'Must be a valid number'
  ),
  souls_won: z.string().optional(),
  youths_incorporated: z.string().optional(),
  magazines_shared: z.string().optional(),
  testimonies: z.string().max(2000, 'Testimonies must be less than 2000 characters').optional(),
  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),
});

type HeartReportFormData = z.infer<typeof heartReportSchema>;

const categories = [
  { value: 'humanitarian', label: 'Humanitarian', icon: Heart, description: 'Charity, welfare, community support' },
  { value: 'evangelism', label: 'Evangelism & Ministry', icon: Church, description: 'Gospel outreach and soul winning' },
  { value: 'arts', label: 'Arts & Films', icon: Palette, description: 'Creative expressions and productions' },
  { value: 'representation', label: 'Representation', icon: Globe, description: 'Advocacy and public representation' },
  { value: 'technology', label: 'Technology & Ministry', icon: Cpu, description: 'Tech-driven ministry initiatives' },
];

interface HeartReport {
  id: string;
  outreach_name: string;
  category: string;
  event_date: string;
  country: string;
  reach_impact: number;
  souls_won: number;
  status: string;
  created_at: string;
}

const HeartInitiative = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState<HeartReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [soulsDataFile, setSoulsDataFile] = useState<File | null>(null);
  const [youthsDataFile, setYouthsDataFile] = useState<File | null>(null);

  const form = useForm<HeartReportFormData>({
    resolver: zodResolver(heartReportSchema),
    defaultValues: {
      category: '',
      outreach_name: '',
      event_date: '',
      country: '',
      state: '',
      city: '',
      location_details: '',
      reach_impact: '',
      souls_won: '',
      youths_incorporated: '',
      magazines_shared: '',
      testimonies: '',
      summary: '',
    },
  });

  // Fetch reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('heart_reports')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReports(data as HeartReport[]);
      }
      setIsLoading(false);
    };

    fetchReports();
  }, [profile?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      const result = validateImageFiles(files);
      
      if (!result.valid) {
        toast({
          title: 'Invalid Files',
          description: result.error,
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      setSelectedImages(result.files);
    }
  };

  const handleCsvChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const result = validateCsvFiles([e.target.files[0]]);
      
      if (!result.valid) {
        toast({
          title: 'Invalid File',
          description: result.error,
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      setter(result.files[0]);
    } else {
      setter(null);
    }
  };

  const onSubmit = async (formData: HeartReportFormData) => {
    if (!profile?.id) return;

    setIsSubmitting(true);

    try {
      // Upload images with signed URLs (bucket is now private)
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const storagePath = generateUploadPath(profile.id, image.name);
        const result = await uploadFileWithSignedUrl(image, storagePath);
        if (result) {
          // Store the path, not the signed URL (paths are permanent, signed URLs expire)
          imageUrls.push(result.path);
        }
      }

      // Upload CSV files if provided (store paths, not URLs)
      let soulsDataPath = null;
      let youthsDataPath = null;

      if (soulsDataFile) {
        const storagePath = generateUploadPath(profile.id, soulsDataFile.name, 'souls');
        const { error } = await supabase.storage.from('gylf-uploads').upload(storagePath, soulsDataFile);
        if (!error) {
          soulsDataPath = storagePath;
        }
      }

      if (youthsDataFile) {
        const storagePath = generateUploadPath(profile.id, youthsDataFile.name, 'youths');
        const { error } = await supabase.storage.from('gylf-uploads').upload(storagePath, youthsDataFile);
        if (!error) {
          youthsDataPath = storagePath;
        }
      }

      // Insert report
      const { error } = await supabase.from('heart_reports').insert({
        profile_id: profile.id,
        category: formData.category as 'arts' | 'evangelism' | 'humanitarian' | 'representation' | 'technology',
        outreach_name: formData.outreach_name,
        event_date: formData.event_date,
        country: formData.country,
        state: formData.state || null,
        city: formData.city || null,
        location_details: formData.location_details || null,
        reach_impact: parseInt(formData.reach_impact) || 0,
        souls_won: parseInt(formData.souls_won || '0') || 0,
        youths_incorporated: parseInt(formData.youths_incorporated || '0') || 0,
        magazines_shared: parseInt(formData.magazines_shared || '0') || 0,
        testimonies: formData.testimonies || null,
        summary: formData.summary || null,
        image_urls: imageUrls,
        souls_data_url: soulsDataPath,
        youths_data_url: youthsDataPath,
      });

      if (error) throw error;

      toast({
        title: 'Report Submitted!',
        description: 'Your HEART Initiative report has been submitted for review.',
      });

      // Reset form
      form.reset();
      setSelectedImages([]);
      setSoulsDataFile(null);
      setYouthsDataFile(null);

      // Refresh reports
      const { data: refreshedData } = await supabase
        .from('heart_reports')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (refreshedData) {
        setReports(refreshedData as HeartReport[]);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.icon || Heart;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">The HEART Initiative</h1>
        <p className="text-muted-foreground mt-1">
          Report your outreach activities and track your impact
        </p>
      </div>

      {/* Categories Overview */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.value} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-3">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{category.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submit">Submit Report</TabsTrigger>
          <TabsTrigger value="history">My Reports</TabsTrigger>
        </TabsList>

        {/* Submit Report Form */}
        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Submit HEART Report
              </CardTitle>
              <CardDescription>
                Document your outreach activity and impact metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Category Selection */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                <div className="flex items-center gap-2">
                                  <cat.icon className="h-4 w-4" />
                                  {cat.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Basic Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="outreach_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outreach Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Community Food Drive" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="event_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      Location Details
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Nigeria" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Region</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Lagos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Ikeja" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="location_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue/Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Specific venue or address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Impact Metrics */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Impact Metrics
                    </div>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="reach_impact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>People Reached *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="souls_won"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Souls Won</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="youths_incorporated"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Youths Incorporated</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="magazines_shared"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Magazines Shared</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Upload className="h-4 w-4 text-primary" />
                      Uploads
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="images">Images (max 5)</Label>
                        <Input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                        {selectedImages.length > 0 && (
                          <p className="text-xs text-muted-foreground">{selectedImages.length} file(s) selected</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="souls_data">Souls Data (CSV)</Label>
                        <Input
                          id="souls_data"
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => handleCsvChange(e, setSoulsDataFile)}
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youths_data">Youths Data (CSV)</Label>
                        <Input
                          id="youths_data"
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => handleCsvChange(e, setYouthsDataFile)}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonies & Summary */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="testimonies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Testimonies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share any testimonies or remarkable moments..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief summary of the outreach..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                My Reports
              </CardTitle>
              <CardDescription>
                View your submitted HEART Initiative reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No reports yet</h3>
                  <p className="text-muted-foreground">Submit your first HEART report to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const Icon = getCategoryIcon(report.category);
                    return (
                      <div key={report.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{report.outreach_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.event_date).toLocaleDateString()}
                            <span>•</span>
                            {report.country}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {report.reach_impact.toLocaleString()} reached
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeartInitiative;
