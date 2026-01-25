import { useState } from 'react';
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
  Heart,
  Users,
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

  // Form state
  const [formData, setFormData] = useState({
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
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [soulsDataFile, setSoulsDataFile] = useState<File | null>(null);
  const [youthsDataFile, setYouthsDataFile] = useState<File | null>(null);

  // Fetch reports on mount
  useState(() => {
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
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSubmitting(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const fileName = `${profile.id}/${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('gylf-uploads')
          .upload(fileName, image);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('gylf-uploads')
            .getPublicUrl(fileName);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Upload CSV files if provided
      let soulsDataUrl = null;
      let youthsDataUrl = null;

      if (soulsDataFile) {
        const fileName = `${profile.id}/souls-${Date.now()}-${soulsDataFile.name}`;
        const { error } = await supabase.storage.from('gylf-uploads').upload(fileName, soulsDataFile);
        if (!error) {
          const { data } = supabase.storage.from('gylf-uploads').getPublicUrl(fileName);
          soulsDataUrl = data.publicUrl;
        }
      }

      if (youthsDataFile) {
        const fileName = `${profile.id}/youths-${Date.now()}-${youthsDataFile.name}`;
        const { error } = await supabase.storage.from('gylf-uploads').upload(fileName, youthsDataFile);
        if (!error) {
          const { data } = supabase.storage.from('gylf-uploads').getPublicUrl(fileName);
          youthsDataUrl = data.publicUrl;
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
        souls_won: parseInt(formData.souls_won) || 0,
        youths_incorporated: parseInt(formData.youths_incorporated) || 0,
        magazines_shared: parseInt(formData.magazines_shared) || 0,
        testimonies: formData.testimonies || null,
        summary: formData.summary || null,
        image_urls: imageUrls,
        souls_data_url: soulsDataUrl,
        youths_data_url: youthsDataUrl,
      });

      if (error) throw error;

      toast({
        title: 'Report Submitted!',
        description: 'Your HEART Initiative report has been submitted for review.',
      });

      // Reset form
      setFormData({
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
      });
      setSelectedImages([]);
      setSoulsDataFile(null);
      setYouthsDataFile(null);
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
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
                </div>

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="outreach_name">Outreach Name *</Label>
                    <Input
                      id="outreach_name"
                      placeholder="e.g., Community Food Drive"
                      value={formData.outreach_name}
                      onChange={(e) => handleInputChange('outreach_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date *</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location Details
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        placeholder="e.g., Nigeria"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Region</Label>
                      <Input
                        id="state"
                        placeholder="e.g., Lagos"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Ikeja"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_details">Venue/Address</Label>
                    <Input
                      id="location_details"
                      placeholder="Specific venue or address"
                      value={formData.location_details}
                      onChange={(e) => handleInputChange('location_details', e.target.value)}
                    />
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Impact Metrics
                  </div>
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="reach_impact">People Reached *</Label>
                      <Input
                        id="reach_impact"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.reach_impact}
                        onChange={(e) => handleInputChange('reach_impact', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="souls_won">Souls Won</Label>
                      <Input
                        id="souls_won"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.souls_won}
                        onChange={(e) => handleInputChange('souls_won', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youths_incorporated">Youths Incorporated</Label>
                      <Input
                        id="youths_incorporated"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.youths_incorporated}
                        onChange={(e) => handleInputChange('youths_incorporated', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="magazines_shared">Magazines Shared</Label>
                      <Input
                        id="magazines_shared"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.magazines_shared}
                        onChange={(e) => handleInputChange('magazines_shared', e.target.value)}
                      />
                    </div>
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
                        accept=".csv"
                        onChange={(e) => setSoulsDataFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youths_data">Youths Data (CSV)</Label>
                      <Input
                        id="youths_data"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setYouthsDataFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Testimonies & Summary */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testimonies">Testimonies</Label>
                    <Textarea
                      id="testimonies"
                      placeholder="Share any testimonies or remarkable moments..."
                      rows={3}
                      value={formData.testimonies}
                      onChange={(e) => handleInputChange('testimonies', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      placeholder="Brief summary of the outreach..."
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </form>
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
                            <MapPin className="h-3 w-3" />
                            {report.country}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{report.reach_impact} reached</div>
                          {report.souls_won > 0 && (
                            <div className="text-sm text-primary">{report.souls_won} souls won</div>
                          )}
                        </div>
                        <div>{getStatusBadge(report.status)}</div>
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
