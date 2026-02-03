import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFiles, generateUploadPath } from "@/lib/fileValidation";
import { Calendar, Users, MapPin, Clock, Video, Globe, Plus, FileText, DollarSign, UserPlus } from "lucide-react";

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_type: string;
  meeting_date: string;
  attendees_count: number;
  first_timers: number;
  offering_amount: number | null;
  currency: string;
  summary: string | null;
  created_at: string;
}

const GYLFMeetings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    meeting_title: "",
    meeting_type: "online",
    meeting_date: "",
    attendees_count: "",
    first_timers: "",
    offering_amount: "",
    currency: "USD",
    summary: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, [profile?.id]);

  const fetchMeetings = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from("connect_meetings")
      .select("*")
      .eq("profile_id", profile.id)
      .order("meeting_date", { ascending: false });

    if (data) setMeetings(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSubmitting(true);

    try {
      // Upload images with file validation (bucket is now private)
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        const storagePath = generateUploadPath(profile.id, image.name, 'meetings');
        const { error: uploadError } = await supabase.storage
          .from("gylf-uploads")
          .upload(storagePath, image);

        if (!uploadError) {
          // Store the path (not public URL since bucket is now private)
          imageUrls.push(storagePath);
        }
      }

      const { error } = await supabase.from("connect_meetings").insert({
        profile_id: profile.id,
        meeting_title: formData.meeting_title,
        meeting_type: formData.meeting_type,
        meeting_date: formData.meeting_date,
        attendees_count: parseInt(formData.attendees_count) || 0,
        first_timers: parseInt(formData.first_timers) || 0,
        offering_amount: formData.offering_amount ? parseFloat(formData.offering_amount) : null,
        currency: formData.currency,
        summary: formData.summary || null,
        image_urls: imageUrls,
      });

      if (error) throw error;

      toast({
        title: "Meeting Report Submitted!",
        description: "Your GYLF Connect meeting has been recorded.",
      });

      setFormData({
        meeting_title: "",
        meeting_type: "online",
        meeting_date: "",
        attendees_count: "",
        first_timers: "",
        offering_amount: "",
        currency: "USD",
        summary: "",
      });
      setSelectedImages([]);
      setShowForm(false);
      fetchMeetings();
    } catch (error) {
      console.error("Error submitting meeting:", error);
      toast({
        title: "Error",
        description: "Failed to submit meeting report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAttendees = meetings.reduce((sum, m) => sum + m.attendees_count, 0);
  const totalFirstTimers = meetings.reduce((sum, m) => sum + m.first_timers, 0);
  const totalOffering = meetings.reduce((sum, m) => sum + (m.offering_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">GYLF Meetings</h1>
          <p className="text-muted-foreground mt-1">Track and report your GYLF Connect meetings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Report Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meetings.length}</p>
                <p className="text-xs text-muted-foreground">Meetings Held</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAttendees}</p>
                <p className="text-xs text-muted-foreground">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFirstTimers}</p>
                <p className="text-xs text-muted-foreground">First Timers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalOffering.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Offering</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Meeting
            </CardTitle>
            <CardDescription>Submit your GYLF Connect meeting report</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meeting_title">Meeting Title *</Label>
                  <Input
                    id="meeting_title"
                    placeholder="e.g., Weekly GYLF Connect"
                    value={formData.meeting_title}
                    onChange={(e) => setFormData({ ...formData, meeting_title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_date">Date *</Label>
                  <Input
                    id="meeting_date"
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={formData.meeting_type === "online" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, meeting_type: "online" })}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Online
                  </Button>
                  <Button
                    type="button"
                    variant={formData.meeting_type === "physical" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, meeting_type: "physical" })}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Physical
                  </Button>
                  <Button
                    type="button"
                    variant={formData.meeting_type === "hybrid" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, meeting_type: "hybrid" })}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Hybrid
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="attendees">Attendees *</Label>
                  <Input
                    id="attendees"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.attendees_count}
                    onChange={(e) => setFormData({ ...formData, attendees_count: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_timers">First Timers</Label>
                  <Input
                    id="first_timers"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.first_timers}
                    onChange={(e) => setFormData({ ...formData, first_timers: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offering">Offering</Label>
                  <Input
                    id="offering"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.offering_amount}
                    onChange={(e) => setFormData({ ...formData, offering_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESP">Espees</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief summary of the meeting..."
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Photos</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 5);
                    const result = validateImageFiles(files);
                    if (!result.valid) {
                      toast({
                        title: "Invalid Files",
                        description: result.error,
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    setSelectedImages(result.files);
                  }}
                  className="cursor-pointer"
                />
                {selectedImages.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedImages.length} file(s) selected</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Meeting History
          </CardTitle>
          <CardDescription>Your GYLF Connect meeting reports</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Meetings Yet</h3>
              <p className="text-muted-foreground">Report your first GYLF Connect meeting</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="bg-primary/10 p-3 rounded-lg">
                    {meeting.meeting_type === "online" ? (
                      <Video className="h-6 w-6 text-primary" />
                    ) : meeting.meeting_type === "physical" ? (
                      <MapPin className="h-6 w-6 text-primary" />
                    ) : (
                      <Globe className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{meeting.meeting_title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {meeting.meeting_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <Users className="h-4 w-4" />
                      {meeting.attendees_count}
                    </div>
                    {meeting.first_timers > 0 && (
                      <div className="text-sm text-primary">+{meeting.first_timers} new</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GYLFMeetings;
