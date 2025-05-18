import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-end space-x-1', className)} data-testid="typing-indicator">
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-bounce" />
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-bounce [animation-delay:0.2s]" />
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-bounce [animation-delay:0.4s]" />
    </div>
  )
}

export default TypingIndicator
