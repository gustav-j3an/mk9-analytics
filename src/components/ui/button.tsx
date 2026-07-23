import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1E1F22] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#18181B] hover:bg-[#29292D] text-white shadow-sm border border-[#18181B] dark:bg-[#4F8CFF] dark:hover:bg-[#669BFF] dark:border-[#4F8CFF] dark:text-[#1E1F22] dark:shadow-[0_4px_12px_rgba(79,140,255,0.18)]",
        destructive:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm border border-[#EF4444] dark:bg-[#EF5350] dark:hover:bg-[#F26966] dark:border-[#EF5350]",
        outline:
          "border border-[#E4E4E7] bg-white text-[#18181B] shadow-sm hover:bg-[#FAFAFA] hover:border-[#D4D4D8] dark:border-[#3B3E45] dark:bg-[#2A2D31] dark:text-[#F5F5F5] dark:hover:bg-[#32353A] dark:hover:border-[#525660]",
        secondary:
          "bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] border border-transparent dark:bg-[#32353A] dark:hover:bg-[#3B3E45] dark:text-[#F5F5F5]",
        ghost: "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] dark:text-[#C7C7C7] dark:hover:bg-[#32353A] dark:hover:text-[#F5F5F5]",
        link: "text-[#09090B] underline-offset-4 hover:underline dark:text-[#76A7FF]",
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
