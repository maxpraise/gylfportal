import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamPlayer from '@/components/home/LiveStreamPlayer';
import PromoBannersCarousel from '@/components/home/PromoBannersCarousel';
import AcademyCoursesCarousel from '@/components/home/AcademyCoursesCarousel';
import ImpactReportsList from '@/components/home/ImpactReportsList';
import gylfLogo from '@/assets/gylf-logo.png';
import { LayoutDashboard } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-container/95 backdrop-blur-sm border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={gylfLogo} alt="GYLF Logo" className="h-10 w-10 rounded-full" />
            <span className="font-bold text-title-medium text-foreground">GYLF</span>
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Portal
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Live Stream Section */}
        <section>
          <LiveStreamPlayer />
        </section>

        {/* Programs/Events Carousel */}
        <section>
          <PromoBannersCarousel />
        </section>

        {/* From The Academy Section */}
        <section>
          <AcademyCoursesCarousel />
        </section>

        {/* Impact Reports Section */}
        <section>
          <ImpactReportsList />
        </section>

        {/* Portal CTA */}
        <section className="py-8">
          <div className="bg-primary/10 rounded-2xl p-6 text-center">
            <img src={gylfLogo} alt="GYLF" className="h-16 w-16 mx-auto mb-4 rounded-full" />
            <h2 className="text-headline-small font-bold text-foreground mb-2">
              Join the Movement
            </h2>
            <p className="text-body-medium text-muted-foreground mb-4 max-w-md mx-auto">
              Access the GYLF Portal to track your growth, connect with members, and make an impact.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Go to Portal
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-outline-variant py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img src={gylfLogo} alt="GYLF" className="h-8 w-8 mx-auto mb-2 rounded-full" />
          <p className="text-body-small text-muted-foreground">
            © {new Date().getFullYear()} Global Youth Leaders Forum. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
