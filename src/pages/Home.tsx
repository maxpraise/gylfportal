import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamPlayer from '@/components/home/LiveStreamPlayer';
import PromoBannersCarousel from '@/components/home/PromoBannersCarousel';
import AcademyCoursesCarousel from '@/components/home/AcademyCoursesCarousel';
import ImpactReportsList from '@/components/home/ImpactReportsList';
import gylfLogo from '@/assets/gylf-logo.png';
import { LayoutDashboard, Bell, Menu, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, role, signOut, isLoading } = useAuth();

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
    <div className="min-h-screen bg-background gradient-hero">
      {/* Glass Navbar with Purple Translucent Look */}
      <header className="glass-navbar">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={gylfLogo} 
                alt="GYLF Logo" 
                className="h-10 w-10 rounded-full ring-2 ring-white/30" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 accent-dot" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight">GYLF</span>
              <span className="text-[10px] text-white/70 -mt-1 tracking-wider uppercase">Global Youth Leaders</span>
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Portal Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
              className="glass-strong text-primary hover:bg-white/90 border-0 font-semibold"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Portal
            </Button>

            {/* Notifications */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white/20 relative"
                onClick={() => navigate('/dashboard/notifications')}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-tertiary rounded-full ring-2 ring-primary" />
              </Button>
            )}

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
                    <Avatar className="h-9 w-9 ring-2 ring-white/30">
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
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section for logged in users */}
        {user && profile && (
          <section className="glass-card p-6 gradient-glow">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-body-small text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Welcome back
                </p>
                <h2 className="text-headline-small font-bold text-foreground">
                  {profile.full_name?.split(' ')[0] || 'Leader'}!
                </h2>
                <p className="text-body-medium text-muted-foreground mt-1">
                  Ready to make an impact today?
                </p>
              </div>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="shimmer"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </section>
        )}

        {/* Live Stream Section */}
        <section className="glass-card overflow-hidden">
          <LiveStreamPlayer />
        </section>

        {/* Programs/Events Carousel */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Programs & Events</h2>
          </div>
          <div className="glass-card overflow-hidden">
            <PromoBannersCarousel />
          </div>
        </section>

        {/* From The Academy Section */}
        <section>
          <div className="section-header">
            <h2 className="section-title">From The Academy</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard/academy')}
              className="text-primary hover:bg-primary/10"
            >
              View All
            </Button>
          </div>
          <AcademyCoursesCarousel />
        </section>

        {/* Impact Reports Section */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Impact Reports</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard/heart')}
              className="text-primary hover:bg-primary/10"
            >
              View All
            </Button>
          </div>
          <ImpactReportsList />
        </section>

        {/* Portal CTA */}
        <section className="py-8">
          <div className="glass-card p-8 text-center gradient-glow">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-purple mb-6">
              <img src={gylfLogo} alt="GYLF" className="h-12 w-12 rounded-full" />
            </div>
            <h2 className="text-headline-small font-bold text-foreground mb-3">
              Join the Movement
            </h2>
            <p className="text-body-medium text-muted-foreground mb-6 max-w-md mx-auto">
              Access the GYLF Portal to track your growth, connect with members, and make an impact in your community.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="shimmer font-semibold px-8"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Enter Portal
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass border-t-0 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img src={gylfLogo} alt="GYLF" className="h-10 w-10 mx-auto mb-3 rounded-full ring-2 ring-primary/20" />
          <p className="text-body-medium font-medium text-foreground mb-1">
            Global Youth Leaders Forum
          </p>
          <p className="text-body-small text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
