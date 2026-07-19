import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#09090B] hover:bg-[#1F1F23] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),_0_0_0_1px_rgba(9,9,11,0.05)] border border-[#09090B]",
        destructive:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#EF4444]",
        outline:
          "border border-[#E4E4E7] bg-white text-[#18181B] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#FAFAFA] hover:border-[#D4D4D8]",
        secondary:
          "bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] border border-transparent",
        ghost: "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]",
        link: "text-[#09090B] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[11px]",
        lg: "h-10 rounded-xl px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'default' | 'destructive' | 'link' | any;
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon' | any;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'default', size = 'default', loading = false, className = '', disabled, ...props }, ref) => {
    // Map new visual design variant names to standard classes
    let finalVariant = variant;
    if (variant === 'primary') finalVariant = 'default';
    if (variant === 'danger') finalVariant = 'destructive';

    let finalSize = size;
    if (size === 'md') finalSize = 'default';

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: finalVariant as any, size: finalSize as any, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin opacity-70" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
