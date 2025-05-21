import { cn } from '@/lib/utils'

interface ChartSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ChartSkeleton({ className, ...props }: ChartSkeletonProps) {
  return (
    <div
      data-testid="chart-skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export default ChartSkeleton
