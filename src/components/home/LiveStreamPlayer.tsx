import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_STREAM_URL = 'https://pvqybrzodz24-hls-live.5centscdn.com/HSOP/955ad3298db330b5ee880c2c9e6f23a0.sdp/playlist.m3u8';

interface StreamConfig {
  stream_url: string;
  is_live: boolean;
  title: string | null;
}

const LiveStreamPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamConfig = async () => {
      const { data, error } = await supabase
        .from('live_stream_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setStreamConfig(data);
      } else {
        setStreamConfig({
          stream_url: DEFAULT_STREAM_URL,
          is_live: false,
          title: 'GYLF Live Stream',
        });
      }
    };

    fetchStreamConfig();
  }, []);

  useEffect(() => {
    if (!streamConfig || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = streamConfig.stream_url || DEFAULT_STREAM_URL;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setError(null);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Unable to load stream');
          setIsLoading(false);
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari native HLS support
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
      });
    }
  }, [streamConfig]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <Card className="overflow-hidden bg-surface-container">
      <div className="relative aspect-video bg-surface-container-highest">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-highest text-center p-4">
            <Play className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Stream will be available when live</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Live Badge */}
        {streamConfig?.is_live && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">
                {streamConfig?.title || 'GYLF Live'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LiveStreamPlayer;
