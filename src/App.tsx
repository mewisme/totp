import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Check, ChevronDown, ClipboardPaste, Eye, EyeOff, Fingerprint, Globe2, Heart, ImagePlus, KeyRound, LoaderCircle, LockKeyhole, Monitor, Moon, QrCode, RotateCcw, ShieldCheck, Sun, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { OtpCard } from '@/components/otp-card'
import { ProviderLogo } from '@/components/provider-logo'
import { usePreferences } from '@/hooks/use-preferences'
import { getErrorCode, type ErrorCode } from '@/lib/errors'
import { generateTimeWindow, prepareTimeWindow, readTimeWindow, parseTotpInput, type AccountInput, type TotpCodeCache } from '@/lib/totp'
import { readQrImage } from '@/lib/qr'
import { readClipboardInput } from '@/lib/clipboard'
import type { Language, Theme } from '@/lib/i18n'

type Result = { source: string; cache: TotpCodeCache; codes: string[] }
type Notice = { kind: 'copied'; index: number } | { kind: 'copyFailed' | 'pasteFailed' | 'clipboardEmpty' } | null
const offsets = [-30, 0, 30]
const themes = [{ value: 'light', Icon: Sun }, { value: 'dark', Icon: Moon }, { value: 'system', Icon: Monitor }] as const
const windowSignature = (account: AccountInput, now: number) => offsets.map(offset => Math.floor((now / 1000 + offset) / account.period)).join(':')

function App() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences()
  const [input, setInput] = useState('')
  const [concealed, setConcealed] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [reading, setReading] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [qrRead, setQrRead] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [copied, setCopied] = useState<{ index: number; code: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const textInput = useRef<HTMLTextAreaElement>(null)
  const qrRequest = useRef(0)
  const dragDepth = useRef(0)
  const value = input.trim()
  const parsed = useMemo((): { account: AccountInput | null; error: ErrorCode | null } => {
    if (!value) return { account: null, error: null }
    try { return { account: parseTotpInput(value), error: null } }
    catch (cause) { return { account: null, error: getErrorCode(cause) } }
  }, [value])
  const account = parsed.account
  const signature = account ? windowSignature(account, now) : ''
  const codes = !error && account && result?.source === value ? readTimeWindow(result.cache, account, now) ?? result.codes : null
  const remaining = account ? account.period - Math.floor(now / 1000) % account.period : 30
  const clock = useMemo(() => new Intl.DateTimeFormat(t.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), [t.locale])

  const changeInput = useCallback((next: string) => {
    qrRequest.current++
    setReading(false)
    setPasting(false)
    setInput(next)
    setError(null)
    setQrRead(false)
    setCopied(null)
    setNotice(null)
  }, [])

  const clear = useCallback(() => {
    changeInput('')
    setResult(null)
    setConcealed(false)
    if (fileInput.current) fileInput.current.value = ''
  }, [changeInput])

  const acceptImage = useCallback(async (file: File) => {
    const request = ++qrRequest.current
    setPasting(false)
    setReading(true)
    setInput('')
    setResult(null)
    setError(null)
    setQrRead(false)
    setCopied(null)
    setNotice(null)
    try {
      const decoded = await readQrImage(file)
      parseTotpInput(decoded)
      if (request === qrRequest.current) { setInput(decoded); setQrRead(true) }
    } catch (cause) { if (request === qrRequest.current) setError(getErrorCode(cause)) }
    finally { if (request === qrRequest.current) setReading(false) }
  }, [])

  async function pasteFromClipboard() {
    const request = ++qrRequest.current
    setPasting(true)
    setNotice(null)
    try {
      const content = await readClipboardInput()
      if (request !== qrRequest.current) return
      if (content instanceof File) await acceptImage(content)
      else if (content) { changeInput(content); textInput.current?.focus() }
      else setNotice({ kind: 'clipboardEmpty' })
    } catch { if (request === qrRequest.current) setNotice({ kind: 'pasteFailed' }) }
    finally { if (request === qrRequest.current) setPasting(false) }
  }

  useEffect(() => {
    try { localStorage.removeItem('totp.accounts.v1') } catch { /* Storage is optional and never used for input. */ }
    const timer = setInterval(() => setNow(Date.now()), 250)
    const refresh = () => setNow(Date.now())
    const cancelQr = () => { qrRequest.current++ }
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); cancelQr() }
  }, [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      if (!account) {
        if (active) { setResult(null); if (value) setError(parsed.error) }
        return
      }
      try {
        const timestamp = Date.now()
        const cache = await prepareTimeWindow(account, timestamp)
        const next = readTimeWindow(cache, account, timestamp)!
        if (active) { setResult({ source: value, cache, codes: next }); setError(null) }
      } catch (cause) { if (active) { setResult(null); setError(getErrorCode(cause)) } }
    }, 200)
    return () => { active = false; clearTimeout(timer) }
  }, [account, value, signature, parsed.error])

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return
      const file = Array.from(event.clipboardData.items).find(item => item.type.startsWith('image/'))?.getAsFile()
      if (file) { event.preventDefault(); void acceptImage(file) }
      else if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement)) {
        const text = event.clipboardData.getData('text/plain')
        if (text) { event.preventDefault(); changeInput(text) }
      }
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || (event.target instanceof Element && event.target.closest('[role="menu"]'))) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); textInput.current?.focus() }
      if (event.key === 'Escape') { event.preventDefault(); clear() }
    }
    document.addEventListener('paste', paste)
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('paste', paste); document.removeEventListener('keydown', keydown) }
  }, [acceptImage, changeInput, clear])

  useEffect(() => {
    if (!notice && copied === null) return
    const timer = setTimeout(() => { setNotice(null); setCopied(null) }, 3000)
    return () => clearTimeout(timer)
  }, [notice, copied])

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    dragDepth.current = 0
    const file = event.dataTransfer.files[0]
    if (file) void acceptImage(file)
    else {
      const text = event.dataTransfer.getData('text/plain')
      if (text) changeInput(text)
    }
  }

  async function copyCode(index: number) {
    if (!account) return
    const request = qrRequest.current
    try {
      let timestamp = Date.now()
      let fresh = await generateTimeWindow(account, timestamp)
      if (Math.floor((timestamp / 1000 + offsets[index]!) / account.period) !== Math.floor((Date.now() / 1000 + offsets[index]!) / account.period)) {
        timestamp = Date.now()
        fresh = await generateTimeWindow(account, timestamp)
      }
      if (request !== qrRequest.current) return
      await navigator.clipboard.writeText(fresh[index]!)
      if (request === qrRequest.current) { setCopied({ index, code: fresh[index]! }); setNotice({ kind: 'copied', index }) }
    } catch { if (request === qrRequest.current) setNotice({ kind: 'copyFailed' }) }
  }

  return (
    <div className="app-shell min-h-svh text-foreground" onDragEnter={event => { if (!event.dataTransfer.types.includes('Files')) return; event.preventDefault(); dragDepth.current++; setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { event.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false) } }} onDrop={drop}>
      <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">{t.skip}</a>
      <header className="mx-auto flex min-h-20 max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <a href="/" aria-label="totp" className="flex items-center gap-2.5 rounded-lg text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Fingerprint className="size-5" /></span><span>totp<span className="text-success">.</span></span></a>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-9 gap-2 bg-card text-xs" aria-label={t.language} />}>
              <Globe2 className="size-3.5 text-muted-foreground" aria-hidden="true" />{language.toUpperCase()}<ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup value={language} onValueChange={next => setLanguage(next as Language)} aria-label={t.language}>
                <DropdownMenuRadioItem value="vi" lang="vi">Tiếng Việt</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en" lang="en">English</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-0.5 rounded-lg border bg-card p-0.5" role="group" aria-label={t.appearance}>{themes.map(({ value: choice, Icon }) => <Button key={choice} variant={theme === choice ? 'secondary' : 'ghost'} size="icon-sm" className="size-8 rounded-md" aria-label={t[choice]} title={t[choice]} aria-pressed={theme === choice} onClick={() => setTheme(choice as Theme)}><Icon className="size-3.5" /></Button>)}</div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-5 pt-6 pb-10 outline-none sm:px-8 sm:pt-10">
        <div className="mb-7 text-center sm:mb-9"><Badge variant="outline" className="mb-4 gap-1.5 border-border/80 bg-card/70 font-normal text-muted-foreground"><LockKeyhole className="size-3" />{t.privacyBadge}</Badge><h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{t.title}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">{t.subtitle}</p></div>

        <Card className={`gap-0 overflow-hidden py-0 shadow-sm ${dragging ? 'ring-2 ring-success' : ''}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2"><Label htmlFor="otp-input" className="flex items-center gap-2 text-sm"><KeyRound className="size-4 shrink-0 text-muted-foreground" />{t.inputLabel}</Label><div className="flex items-center gap-1">{input && <Button variant="ghost" size="icon-sm" aria-pressed={concealed} aria-label={concealed ? t.show : t.hide} title={concealed ? t.show : t.hide} onClick={() => setConcealed(!concealed)}>{concealed ? <EyeOff /> : <Eye />}</Button>}{(input || error || reading) && <Button variant="ghost" size="icon-sm" onClick={clear} aria-label={t.clear} title={t.clear}><X /></Button>}</div></div>
            <div className="relative"><Textarea ref={textInput} id="otp-input" name="otp-input" value={input} onChange={event => changeInput(event.target.value)} placeholder={t.placeholder} className={`min-h-28 resize-none bg-muted/35 font-mono text-sm leading-relaxed field-sizing-fixed ${concealed && input ? 'text-transparent caret-transparent selection:bg-transparent selection:text-transparent' : ''}`} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={4096} aria-invalid={!!error} aria-describedby={error ? 'input-error' : 'input-hint'} />{concealed && input && <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 font-mono tracking-widest text-muted-foreground">••••••••••••••••</span>}</div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p id="input-hint" className="text-xs text-muted-foreground">{t.inputHint}</p><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => void pasteFromClipboard()} disabled={pasting || reading}>{pasting ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <ClipboardPaste />}{pasting ? t.pasting : t.paste}</Button><Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={reading}>{reading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <ImagePlus />}{reading ? t.readingQr : t.chooseQr}</Button></div></div>
            <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={t.qrFile} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void acceptImage(file) }} />
            {error && <p id="input-error" role="alert" className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">{t.errors[error]}</p>}
            <div role="status" aria-live="polite">{qrRead && !error && <p className="mt-3 flex items-center gap-1.5 text-xs text-success-foreground"><Check className="size-3.5" />{t.qrRead}</p>}</div>
          </CardContent>
          <div className="flex items-start justify-center gap-2 border-t bg-muted/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground"><QrCode className="mt-0.5 size-3.5 shrink-0" /><span>{t.qrHint}</span></div>
        </Card>

        <section className="mt-7 sm:mt-8" aria-label={t.region}>
          {account?.issuer && !error && <div className="mb-5 flex items-center gap-3 rounded-xl border bg-card px-4 py-3" aria-label={t.provider}><ProviderLogo key={account.issuer} issuer={account.issuer} /><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{t.provider}</p><p className="truncate text-sm font-semibold" title={account.issuer || undefined}>{account.issuer || t.unknownProvider}</p><p className="truncate text-xs text-muted-foreground" title={/^otpauth:/i.test(value) ? account.name : undefined}>{/^otpauth:/i.test(value) ? account.name : t.noProvider}</p></div><Badge variant="secondary" className="ml-auto hidden shrink-0 gap-1 sm:flex"><Check className="size-3" />TOTP</Badge></div>}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-medium text-muted-foreground">{t.timeline}<span className="mx-2 text-border" aria-hidden="true">/</span>{t.spacing}</h2>{account && !error && <span className="text-[11px] text-muted-foreground">{t.parameters(account.digits, account.algorithm, account.period)}</span>}</div>
          <div className="grid gap-3 sm:grid-cols-3">{offsets.map((offset, index) => <OtpCard key={offset} index={index} title={t.titles[index]!} code={codes?.[index]} time={account && !error ? clock.format(now + offset * 1000) : t.timeHints[index]!} copyLabel={t.copy(t.titles[index]!)} copyText={copied?.index === index && copied.code === codes?.[index] ? t.copiedButton : t.copyButton} copied={copied?.index === index && copied.code === codes?.[index]} remaining={remaining} period={account?.period || 30} secondsLabel={t.seconds} onCopy={() => void copyCode(index)} />)}</div>
          <div className="mt-4 flex min-h-7 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><div className="flex items-center gap-2"><span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${codes ? remaining < 5 ? 'bg-warning' : 'bg-success' : 'bg-muted-foreground/40'}`} /><span role="timer" aria-live="off" className={codes && remaining < 5 ? 'text-warning-foreground' : undefined}>{codes ? t.countdown(remaining) : account && !error ? t.generating : t.emptyHint}</span></div>{input && <Button variant="ghost" size="xs" onClick={clear}><RotateCcw />{t.reset}</Button>}</div>
        </section>

        <footer className="mt-8 border-t pt-5 sm:mt-10">
          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-foreground" /><div><p><span className="font-medium text-foreground">{t.local}</span> {t.localDetails}</p><p className="mt-1">{t.google} {t.clean}</p></div></div>
          <Accordion className="mt-4" aria-label={t.help}>
            <AccordionItem value="usage">
              <AccordionTrigger>{t.helpUsage}</AccordionTrigger>
              <AccordionContent><p>{t.helpSteps}</p><p className="mt-3 text-xs font-medium">{t.shortcuts}</p></AccordionContent>
            </AccordionItem>
            <AccordionItem value="timing">
              <AccordionTrigger>{t.helpTiming}</AccordionTrigger>
              <AccordionContent>{t.helpPeriods}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>{t.helpData}</AccordionTrigger>
              <AccordionContent><p>{t.helpPrivacy}</p><p className="mt-3">{t.localDetails} {t.google}</p></AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="font-semibold tracking-tight text-foreground">totp<span className="text-success">.</span></span><span aria-hidden="true">·</span><span>Authenticator</span></span>
            <p lang="en" className="flex items-center gap-1.5">Made by <span className="font-medium text-foreground">Mew</span><Heart aria-hidden="true" className="size-3 fill-success/15 text-success" /></p>
          </div>
        </footer>
      </main>

      <div role="status" aria-live="polite" aria-atomic="true" className={notice ? 'fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg' : 'sr-only'}>{notice && <><span className="flex-1">{notice.kind === 'copied' ? t.copied(t.titles[notice.index]!) : t[notice.kind]}</span><Button variant="ghost" size="icon-sm" onClick={() => setNotice(null)} aria-label={t.closeNotice}><X /></Button></>}</div>
      {dragging && <div className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-success bg-background/95 p-5 backdrop-blur-sm"><div className="text-center"><ImagePlus className="mx-auto mb-4 size-10 text-success-foreground" /><p className="text-lg font-medium">{t.dropTitle}</p><p className="mt-2 text-sm text-muted-foreground">{t.dropHint}</p></div></div>}
    </div>
  )
}

export default App
