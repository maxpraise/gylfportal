import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, Settings, LogOut } from 'lucide-react';

const DesktopHeader = () => {
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
    <header className="glass-navbar px-6 h-16 flex items-center justify-between">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
        <Input
          placeholder="Search..."
          className="pl-10 bg-white/10 border-white/20 rounded-full text-white placeholder:text-white/50 focus:bg-white/20"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-full touch-target text-white hover:bg-white/20">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-tertiary rounded-full ring-2 ring-primary" />
        </Button>

        {/* User Menu */}
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

export default DesktopHeader;
