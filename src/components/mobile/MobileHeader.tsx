import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Bell, Settings, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  onMenuClick: () => void;
}

const MobileHeader = ({ title, onMenuClick }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="glass-navbar">
      {/* Leading navigation icon */}
      <Button
        variant="ghost"
        size="icon"
        className="touch-target rounded-full text-white hover:bg-white/20"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Title */}
      <h1 className="flex-1 text-title-large truncate text-white">
        {title || 'GYLF Portal'}
      </h1>

      {/* Trailing actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="touch-target rounded-full relative text-white hover:bg-white/20"
          onClick={() => navigate('/dashboard/notifications')}
        >
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-tertiary rounded-full ring-2 ring-primary" />
        </Button>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
              <Avatar className="h-10 w-10 ring-2 ring-white/30">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-strong" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-title-medium">{profile?.full_name || 'User'}</p>
                <p className="text-body-small text-muted-foreground">{user?.email}</p>
                <p className="text-label-small text-primary capitalize font-medium">{role || 'Ambassador'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default MobileHeader;
