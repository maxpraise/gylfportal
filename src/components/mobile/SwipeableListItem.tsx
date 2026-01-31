import { useState, useRef, ReactNode } from 'react';
import { Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  label: string;
  icon: React.ElementType;
  color: 'destructive' | 'primary';
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  threshold?: number;
}

const SwipeableListItem = ({
  children,
  leftAction,
  rightAction,
  className,
  threshold = 80,
}: SwipeableListItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Limit swipe distance
    const maxSwipe = threshold * 1.5;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    // Only allow swipe in directions where actions exist
    if (diff > 0 && !leftAction) return;
    if (diff < 0 && !rightAction) return;

    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    const diff = currentX.current - startX.current;

    if (diff > threshold && leftAction) {
      leftAction.onAction();
    } else if (diff < -threshold && rightAction) {
      rightAction.onAction();
    }

    setTranslateX(0);
  };

  const leftProgress = Math.min(Math.max(translateX / threshold, 0), 1);
  const rightProgress = Math.min(Math.max(-translateX / threshold, 0), 1);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && (
        <div
          className={cn(
            'swipe-action-bg left-0',
            leftAction.color === 'destructive' ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ opacity: leftProgress }}
        >
          <leftAction.icon className="h-6 w-6" />
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className={cn(
            'swipe-action-bg right-0',
            rightAction.color === 'destructive' ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ opacity: rightProgress }}
        >
          <rightAction.icon className="h-6 w-6" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative bg-card transition-transform',
          !isSwiping && 'duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableListItem;

// Preset action creators
export const deleteAction = (onDelete: () => void): SwipeAction => ({
  label: 'Delete',
  icon: Trash2,
  color: 'destructive',
  onAction: onDelete,
});

export const archiveAction = (onArchive: () => void): SwipeAction => ({
  label: 'Archive',
  icon: Archive,
  color: 'primary',
  onAction: onArchive,
});
