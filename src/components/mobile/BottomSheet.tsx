import { ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

const BottomSheet = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  className,
}: BottomSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn('max-h-[90vh]', className)}>
        {/* Drag handle */}
        <div className="mx-auto w-12 h-1 flex-shrink-0 rounded-full bg-muted my-4" />

        {(title || showCloseButton) && (
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                {title && <DrawerTitle className="text-headline-small">{title}</DrawerTitle>}
                {description && (
                  <DrawerDescription className="text-body-medium mt-1">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-full touch-target">
                    <X className="h-6 w-6" />
                  </Button>
                </DrawerClose>
              )}
            </div>
          </DrawerHeader>
        )}

        <div className="px-4 pb-4 overflow-y-auto">{children}</div>

        {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
};

export default BottomSheet;
