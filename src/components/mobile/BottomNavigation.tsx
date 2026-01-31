import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Heart,
  Calendar,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Heart, label: 'HEART', path: '/dashboard/heart' },
  { icon: Calendar, label: 'Meetings', path: '/dashboard/meetings' },
  { icon: Users, label: 'Members', path: '/dashboard/members' },
  { icon: MoreHorizontal, label: 'More', path: '/dashboard/more' },
];

interface BottomNavigationProps {
  onMoreClick?: () => void;
}

const BottomNavigation = ({ onMoreClick }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (item: NavItem) => {
    if (item.path === '/dashboard/more' && onMoreClick) {
      onMoreClick();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = item.path === '/dashboard/more' ? false : isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => handleClick(item)}
            className={cn('bottom-nav-item', active && 'active')}
          >
            <div className="indicator">
              <item.icon className="h-6 w-6" />
            </div>
            <span className="text-label-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
