import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#18181B] text-white dark:bg-[#4F8CFF] dark:text-[#F5F5F5]",
        secondary:
          "border-transparent bg-[#F4F4F5] text-[#18181B] dark:bg-[#32353A] dark:text-[#F5F5F5]",
        destructive:
          "border-[#FEE2E2] bg-[#FEF2F2] text-[#EF4444] dark:border-[#EF5350]/40 dark:bg-[#EF5350]/15 dark:text-[#FF7774]",
        outline: "border-[#E4E4E7] text-[#71717A] bg-transparent dark:border-[#3B3E45] dark:text-[#C7C7C7]",
        success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A] dark:border-[#4CAF50]/40 dark:bg-[#4CAF50]/15 dark:text-[#6BCB70]",
        warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706] dark:border-[#FFB74D]/40 dark:bg-[#FFB74D]/15 dark:text-[#FFB74D]",
        danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#EF4444] dark:border-[#EF5350]/40 dark:bg-[#EF5350]/15 dark:text-[#FF7774]",
        info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#3B82F6] dark:border-[#4F8CFF]/40 dark:bg-[#4F8CFF]/15 dark:text-[#76A7FF]",
        neutral: "border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A] dark:border-[#3B3E45] dark:bg-[#32353A] dark:text-[#C7C7C7]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const currentVariant = variant || 'neutral';
  return (
    <div className={cn(badgeVariants({ variant: currentVariant as any }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export default Badge;
