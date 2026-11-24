import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  index: number
  title: string
  code?: string
  time: string
  copyLabel: string
  copyText: string
  copied: boolean
  remaining: number
  period: number
  secondsLabel: string
  onCopy: () => void
}

export function OtpCard({ index, title, code, time, copyLabel, copyText, copied, remaining, period, secondsLabel, onCopy }: Props) {
  const current = index === 1
  const urgent = current && !!code && remaining < 5
  const surface = urgent ? 'border-warning/50 bg-warning-soft ring-1 ring-warning/15' : current ? 'border-success/40 bg-success-soft ring-1 ring-success/15' : 'border-border/80 bg-card'
  const Icon = index === 0 ? ArrowLeft : index === 2 ? ArrowRight : Check
  const offset = (index - 1) * 30
  const formatted = code ? `${code.slice(0, code.length / 2)} ${code.slice(code.length / 2)}` : '••• •••'

  return (
    <Card
      role="button"
      tabIndex={code ? 0 : -1}
      aria-label={copyLabel}
      aria-disabled={!code}
      data-copied={copied || undefined}
      data-urgent={urgent || undefined}
      title={code ? copyLabel : undefined}
      onClick={() => { if (code) onCopy() }}
      onKeyDown={event => {
        if (code && !event.repeat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onCopy()
        }
      }}
      className={`group relative select-none gap-0 overflow-hidden py-0 shadow-none outline-none transition-[border-color,background-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:transform-none ${code ? `cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] ${urgent ? 'hover:border-warning' : 'hover:border-success/60'}` : 'cursor-default'} ${copied ? 'border-success bg-success-soft ring-2 ring-success/30' : surface}`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`flex items-center gap-1.5 text-xs font-medium ${urgent ? 'text-warning-foreground' : current ? 'text-success-foreground' : 'text-muted-foreground'}`}><Icon className="size-3.5 shrink-0" aria-hidden="true" />{title}</h3>
          <span className="font-mono text-xs text-muted-foreground" aria-label={`${offset > 0 ? '+' : ''}${offset} ${secondsLabel}`}>{offset > 0 ? '+' : ''}{offset}s</span>
        </div>
        <div className="mt-4 flex min-h-10 items-center justify-center text-center sm:mt-6">
          <span aria-label={title} className={`${code ? 'select-all' : 'select-none'} whitespace-nowrap font-mono font-semibold tabular-nums ${code?.length === 8 ? 'text-2xl tracking-wider' : 'text-3xl tracking-widest'} ${!code ? 'text-muted-foreground/40' : ''}`}>{formatted}</span>
        </div>
        <div className="mt-3 flex min-h-7 items-center justify-between gap-2 sm:mt-5">
          <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
          <span aria-hidden="true" className={`flex items-center gap-1.5 text-xs transition-colors ${copied ? 'text-success-foreground' : 'text-muted-foreground group-hover:text-foreground'} ${!code ? 'opacity-40' : ''}`}>{copied ? <Check className="size-3" /> : <Copy className="size-3" />}<span className={copied ? 'inline' : 'hidden sm:inline'}>{copyText}</span></span>
        </div>
      </CardContent>
      {current && <div className={`absolute inset-x-0 bottom-0 h-1 ${urgent ? 'bg-warning/10' : 'bg-success/10'}`} aria-hidden="true"><div className={`h-full ${urgent ? 'bg-warning' : 'bg-success'}`} style={{ width: code ? `${remaining / period * 100}%` : '0%' }} /></div>}
    </Card>
  )
}
