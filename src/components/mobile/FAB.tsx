import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
}

const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ icon, label, variant = 'primary', size = 'medium', extended = false, className, ...props }, ref) => {
    const baseClasses = cn(
      'fixed z-50 flex items-center justify-center',
      'rounded-2xl shadow-elevation-3 hover:shadow-elevation-4',
      'transition-all duration-200 active:scale-95',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    );

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary-container text-secondary-container-foreground',
      tertiary: 'bg-tertiary text-tertiary-foreground',
      surface: 'bg-surface-container-high text-primary',
    };

    const sizeClasses = {
      small: extended ? 'h-10 px-3 gap-2' : 'h-10 w-10',
      medium: extended ? 'h-14 px-4 gap-3' : 'h-14 w-14',
      large: extended ? 'h-24 px-6 gap-4 rounded-3xl' : 'h-24 w-24 rounded-3xl',
    };

    const iconSizeClasses = {
      small: '[&>svg]:h-5 [&>svg]:w-5',
      medium: '[&>svg]:h-6 [&>svg]:w-6',
      large: '[&>svg]:h-9 [&>svg]:w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          iconSizeClasses[size],
          'bottom-24 right-4', // Position above bottom nav
          className
        )}
        {...props}
      >
        {icon}
        {extended && label && (
          <span className={cn(
            'font-medium',
            size === 'small' && 'text-label-medium',
            size === 'medium' && 'text-label-large',
            size === 'large' && 'text-title-medium'
          )}>
            {label}
          </span>
        )}
      </button>
    );
  }
);

FAB.displayName = 'FAB';

export default FAB;
