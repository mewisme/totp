import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { getProviderLogoUrl } from '@/lib/provider'

export function ProviderLogo({ issuer }: { issuer: string }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const url = getProviderLogoUrl(issuer)

  return (
    <span aria-hidden="true" className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
      {!loaded && (issuer ? Array.from(issuer).slice(0, 2).join('').toLocaleUpperCase('vi') : <KeyRound className="size-4 text-muted-foreground" />)}
      {url && !failed && <img src={url} alt="" width={24} height={24} referrerPolicy="no-referrer" className={`absolute size-6 object-contain ${loaded ? '' : 'invisible'}`} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(false) }} />}
    </span>
  )
}
