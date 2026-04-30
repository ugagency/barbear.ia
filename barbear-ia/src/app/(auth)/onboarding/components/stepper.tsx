import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  current: number // 0-based index
  steps: { label: string }[]
}

export function Stepper({ current, steps }: StepperProps) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, idx) => {
        const isDone = idx < current
        const isActive = idx === current
        return (
          <li key={step.label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border transition-colors',
                  isDone && 'bg-brand text-white border-brand',
                  isActive && 'bg-brand-50 text-brand border-brand',
                  !isDone && !isActive && 'bg-white text-slate-400 border-brand-100',
                )}
              >
                {isDone ? <Check className="size-3.5" /> : idx + 1}
              </span>
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-medium',
                  isActive ? 'text-brand' : 'text-slate-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <span
                className={cn(
                  'h-px w-8 sm:w-12',
                  idx < current ? 'bg-brand' : 'bg-brand-100',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
