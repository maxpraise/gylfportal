import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from '@/components/mobile/MobileHeader';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import NavigationDrawer from '@/components/mobile/NavigationDrawer';
import DesktopSidebar from './DesktopSidebar';
import DesktopHeader from './DesktopHeader';

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/dashboard/members': 'My Members',
      '/dashboard/invite': 'Invite Members',
      '/dashboard/growth': 'Growth Path',
      '/dashboard/resources': 'Resources',
      '/dashboard/heart': 'HEART Initiative',
      '/dashboard/academy': 'GYLF Academy',
      '/dashboard/meetings': 'Connect Meetings',
      '/dashboard/prayer': 'Prayer Cloud',
      '/dashboard/testimony': 'Share Testimony',
      '/dashboard/faq': 'Help & FAQ',
      '/dashboard/partnership': 'Partnership',
      '/dashboard/settings': 'Settings',
      '/dashboard/admin/users': 'Manage Users',
      '/dashboard/admin/reports': 'Reports',
    };
    return titles[path] || 'GYLF Portal';
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background gradient-hero flex flex-col">
        {/* Mobile Header */}
        <MobileHeader
          title={getPageTitle()}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {/* Navigation Drawer */}
        <NavigationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* Page Content - with padding for bottom nav */}
        <main className="flex-1 overflow-auto pb-safe-nav">
          <div className="p-4">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation onMoreClick={() => setDrawerOpen(true)} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background gradient-hero flex">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <DesktopHeader />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
