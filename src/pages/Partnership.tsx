import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Coins,
  CreditCard,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const partnershipSchema = z.object({
  category: z.string().min(1, 'Please select a partnership category'),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a valid amount greater than 0'),
  payment_method: z.string().min(1, 'Please select a payment method'),
});

type PartnershipFormData = z.infer<typeof partnershipSchema>;

interface Partnership {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  category: string;
  status: string;
  created_at: string;
}

const Partnership = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnershipFormData>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      category: '',
      amount: '',
      payment_method: '',
    },
  });

  useEffect(() => {
    const fetchPartnerships = async () => {
      if (!profile?.id) return;

      const { data } = await supabase
        .from('partnerships')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPartnerships(data as Partnership[]);
      }

      setIsLoading(false);
    };

    fetchPartnerships();
  }, [profile?.id]);

  const onSubmit = async (data: PartnershipFormData) => {
    if (!profile?.id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('partnerships').insert({
        profile_id: profile.id,
        amount: parseFloat(data.amount),
        currency: 'USD',
        payment_method: data.payment_method,
        category: data.category as 'gylf_academy' | 'gylf_conferences' | 'gylf_missions_trips' | 'gylf_outreaches' | 'hslhs' | 'magazine' | 'offerings' | 'sponsor_gytv',
      });

      if (error) throw error;

      toast({
        title: 'Partnership Recorded!',
        description: 'Your partnership has been recorded. Thank you for your support!',
      });

      form.reset();

      // Refresh partnerships
      const { data: refreshedData } = await supabase
        .from('partnerships')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (refreshedData) {
        setPartnerships(refreshedData as Partnership[]);
      }
    } catch (error) {
      console.error('Error submitting partnership:', error);
      toast({
        title: 'Error',
        description: 'Failed to record partnership. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPartnership = partnerships.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0);
  const pendingPartnership = partnerships.reduce((sum, p) => p.status === 'pending' ? sum + p.amount : sum, 0);
  const completedCount = partnerships.filter(p => p.status === 'completed').length;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      hslhs: 'HSLHS',
      magazine: 'Magazine',
      gylf_missions_trips: 'GYLF Missions Trips',
      offerings: 'Offerings',
      gylf_conferences: 'GYLF Conferences',
      sponsor_gytv: 'Sponsor a GYTV Program',
      gylf_outreaches: 'GYLF Outreaches',
      gylf_academy: 'GYLF Academy',
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      espees: 'Espees',
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
    };
    return labels[method] || method;
  };

  const selectedPaymentMethod = form.watch('payment_method');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading partnerships...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Partnership</h1>
        <p className="text-muted-foreground mt-1">
          Support the GYLF mission through your partnership giving
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Given
            </CardTitle>
            <DollarSign className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalPartnership.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed partnerships</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${pendingPartnership.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contributions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful partnerships</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Year
            </CardTitle>
            <Calendar className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${partnerships
                .filter(p => new Date(p.created_at).getFullYear() === new Date().getFullYear() && p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Year to date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Partnership Form */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Give Partnership
            </CardTitle>
            <CardDescription>
              Support the GYLF mission through your partnership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partnership Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hslhs">HSLHS</SelectItem>
                          <SelectItem value="magazine">Magazine</SelectItem>
                          <SelectItem value="gylf_missions_trips">GYLF Missions Trips</SelectItem>
                          <SelectItem value="offerings">Offerings</SelectItem>
                          <SelectItem value="gylf_conferences">GYLF Conferences</SelectItem>
                          <SelectItem value="sponsor_gytv">Sponsor a GYTV Program</SelectItem>
                          <SelectItem value="gylf_outreaches">GYLF Outreaches</SelectItem>
                          <SelectItem value="gylf_academy">GYLF Academy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            className="pl-9" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="espees">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4" />
                              Espees
                            </div>
                          </SelectItem>
                          <SelectItem value="credit_card">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Credit Card
                            </div>
                          </SelectItem>
                          <SelectItem value="bank_transfer">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Bank Transfer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPaymentMethod === 'bank_transfer' && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-sm">
                      <p className="font-medium mb-2">Bank Transfer Details:</p>
                      <p className="text-muted-foreground">
                        Bank: Example Bank<br />
                        Account: 1234567890<br />
                        Routing: 987654321
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit Partnership'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Partnership Categories Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Partnership Categories</CardTitle>
            <CardDescription>
              Ways you can support the GYLF mission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {[
                { name: 'HSLHS', desc: 'Healing School Live Healing Services' },
                { name: 'Magazine', desc: 'Youth ministry publications' },
                { name: 'GYLF Missions Trips', desc: 'Support global outreach missions' },
                { name: 'Offerings', desc: 'General ministry support' },
                { name: 'GYLF Conferences', desc: 'Youth conferences worldwide' },
                { name: 'Sponsor GYTV', desc: 'Global Youth TV programming' },
                { name: 'GYLF Outreaches', desc: 'Local community outreaches' },
                { name: 'GYLF Academy', desc: 'Leadership training programs' },
              ].map((cat) => (
                <div key={cat.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partnership History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Partnership History</CardTitle>
          <CardDescription>
            Your partnership contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerships.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No partnerships yet</h3>
              <p className="text-muted-foreground">
                Make your first partnership contribution above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerships.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getCategoryLabel(p.category)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(p.payment_method)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>
                          {p.status}
                        </Badge>
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

export default Partnership;