import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type WizardStep = { id: string; title: string; content: ReactNode };

interface WizardNavProps {
  steps: { id: string; title: string }[];
  current: number;
  onSelect: (index: number) => void;
}

export function WizardNav({ steps, current, onSelect }: WizardNavProps) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ol className="flex min-w-max items-center gap-1 px-1">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : done
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                    active ? 'bg-primary-foreground/20' : done ? 'bg-primary/20' : 'bg-border/70'
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="whitespace-nowrap">{step.title}</span>
              </button>
              {index < steps.length - 1 && <span className="h-px w-3 bg-border" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SectionGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}
