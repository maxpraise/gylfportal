import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'announcement';
  target_audience: string;
  created_at: string;
  expires_at: string | null;
  is_read?: boolean;
}

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchReadStatus();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Cast to any since the table was just created and types haven't regenerated
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadStatus = async () => {
    if (!user) return;
    
    try {
      // Cast to any since the table was just created and types haven't regenerated
      const { data, error } = await (supabase as any)
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const readIds = new Set<string>(data?.map((r: { notification_id: string }) => r.notification_id) || []);
      setReadNotifications(readIds);
    } catch (error) {
      console.error('Error fetching read status:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user || readNotifications.has(notificationId)) return;

    try {
      // Cast to any since the table was just created and types haven't regenerated
      const { error } = await (supabase as any)
        .from('notification_reads')
        .insert({
          notification_id: notificationId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
      
      setReadNotifications(prev => new Set([...prev, notificationId]));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !readNotifications.has(n.id));
      
      // Cast to any since the table was just created and types haven't regenerated
      for (const notification of unreadNotifications) {
        await (supabase as any)
          .from('notification_reads')
          .insert({
            notification_id: notification.id,
            user_id: user.id,
          })
          .then(() => {});
      }
      
      const allIds = new Set(notifications.map(n => n.id));
      setReadNotifications(allIds);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>;
      case 'success':
        return <Badge variant="outline" className="border-green-500 text-green-600">Success</Badge>;
      case 'announcement':
        return <Badge variant="default">Announcement</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest announcements and messages
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Notifications</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              You're all caught up! New announcements and messages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const isRead = readNotifications.has(notification.id);
            
            return (
              <Card
                key={notification.id}
                className={`border-border transition-all cursor-pointer hover:shadow-md ${
                  !isRead ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          {getTypeBadge(notification.type)}
                          {!isRead && (
                            <span className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
