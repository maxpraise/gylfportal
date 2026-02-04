import LiveStreamPlayer from '@/components/home/LiveStreamPlayer';
import VODCarousel from '@/components/gytv/VODCarousel';
import { Tv } from 'lucide-react';

const GYTV = () => {
  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2.5 rounded-xl">
          <Tv className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-headline-small font-bold text-foreground">GYTV</h1>
          <p className="text-body-medium text-muted-foreground">
            Live streaming and videos on demand
          </p>
        </div>
      </div>

      {/* Live Stream Section */}
      <section>
        <h2 className="text-title-large font-medium text-foreground mb-3">Live Now</h2>
        <LiveStreamPlayer />
      </section>

      {/* Videos on Demand Section */}
      <section>
        <VODCarousel />
      </section>
    </div>
  );
};

export default GYTV;
