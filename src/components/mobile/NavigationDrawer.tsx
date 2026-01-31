import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe,
  LayoutDashboard,
  Users,
  TrendingUp,
  BookOpen,
  Settings,
  UserPlus,
  FileText,
  Heart,
  Cloud,
  MessageSquare,
  HelpCircle,
  Calendar,
  Coins,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    title: 'Membership',
    items: [
      { icon: Users, label: 'My Members', path: '/dashboard/members' },
      { icon: UserPlus, label: 'Invite Members', path: '/dashboard/invite' },
      { icon: TrendingUp, label: 'Growth Path', path: '/dashboard/growth' },
    ],
  },
  {
    title: 'Programs',
    items: [
      { icon: Globe, label: 'Resource Center', path: '/dashboard/resources' },
      { icon: Heart, label: 'HEART Initiative', path: '/dashboard/heart' },
      { icon: BookOpen, label: 'GYLF Academy', path: '/dashboard/academy' },
      { icon: Calendar, label: 'Connect Meetings', path: '/dashboard/meetings' },
      { icon: Coins, label: 'Partnership', path: '/dashboard/partnership' },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: Cloud, label: 'Prayer Cloud', path: '/dashboard/prayer' },
      { icon: MessageSquare, label: 'Share Testimony', path: '/dashboard/testimony' },
      { icon: HelpCircle, label: 'Help & FAQ', path: '/dashboard/faq' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { icon: Shield, label: 'Manage Users', path: '/dashboard/admin/users', roles: ['admin'] },
      { icon: FileText, label: 'Reports', path: '/dashboard/admin/reports', roles: ['admin', 'regional_leader'] },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ],
  },
];

interface NavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NavigationDrawer = ({ open, onOpenChange }: NavigationDrawerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, role } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles) return true;
        return role && item.roles.includes(role);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 bg-surface">
        {/* Header with profile */}
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-high">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-title-medium truncate">{profile?.full_name || 'User'}</p>
              <Badge variant="secondary" className="mt-1 text-label-small">
                {role || 'Ambassador'}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-2" />

        {/* Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <nav className="px-2 py-2">
            {filteredNavigation.map((group, groupIndex) => (
              <div key={group.title} className={cn(groupIndex > 0 && 'mt-4')}>
                <p className="text-label-medium text-on-surface-variant px-4 py-2 uppercase tracking-wider">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-full text-body-large transition-colors',
                            isActive
                              ? 'bg-secondary-container text-secondary-container-foreground'
                              : 'text-foreground hover:bg-surface-variant active:bg-surface-variant'
                          )}
                        >
                          <item.icon className="h-6 w-6" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive && <ChevronRight className="h-5 w-5" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant">
          <div className="flex items-center gap-2 justify-center">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-label-small text-muted-foreground">GYLF © 2025</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationDrawer;
