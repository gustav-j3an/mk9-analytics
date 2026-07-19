import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#09090B] text-white",
        secondary:
          "border-transparent bg-[#F4F4F5] text-[#18181B]",
        destructive:
          "border-[#FEE2E2] bg-[#FEF2F2] text-[#EF4444]",
        outline: "border-[#E4E4E7] text-[#71717A] bg-transparent",
        success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]",
        warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
        danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#EF4444]",
        info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#3B82F6]",
        neutral: "border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A]",
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
