import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        
        'file:text-foreground placeholder:text-muted-foreground/40 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'border border-gray-400 px-6 py-2 transition-colors',
        'focus-visible:border-gray-800 focus-visible:ring-black/5 dark:focus-visible:ring-white/5 focus-visible:ring-[2px]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }