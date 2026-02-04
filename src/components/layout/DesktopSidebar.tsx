import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Bell,
  Megaphone,
  Tv,
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
      { icon: Tv, label: 'GYTV', path: '/dashboard/gytv' },
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
      { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
      { icon: Shield, label: 'Manage Users', path: '/dashboard/admin/users', roles: ['admin'] },
      { icon: FileText, label: 'Reports', path: '/dashboard/admin/reports', roles: ['admin', 'regional_leader'] },
      { icon: Megaphone, label: 'Send Notification', path: '/dashboard/admin/notifications', roles: ['admin'] },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ],
  },
];

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const filteredNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles) return true;
        return role && item.roles.includes(role);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="hidden lg:flex w-72 bg-surface border-r border-outline-variant flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl">
            <Globe className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-title-medium text-foreground">Global Youth Leaders&apos; Forum</h1>
            <p className="text-body-small text-muted-foreground">Raising Leaders, building the future...</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {filteredNavigation.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="text-label-medium text-on-surface-variant uppercase tracking-wider mb-2 px-4">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-full text-body-large transition-all duration-200',
                        isActive
                          ? 'bg-secondary-container text-secondary-container-foreground font-medium'
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

      {/* Footer */}
      <div className="p-4 border-t border-outline-variant">
        <p className="text-label-small text-muted-foreground text-center">
          GYLF Communications<br />
          © 2025 All Rights Reserved
        </p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
