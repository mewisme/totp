// Time comes only from internet time servers. The device wall clock (Date.now) is never read:
// after a sync, elapsed time is measured with the monotonic performance.now().
let anchor: { server: number; mono: number } | null = null

/** Internet time in epoch ms, or null until the first successful sync. */
export function now(): number | null {
  return anchor && anchor.server + (performance.now() - anchor.mono)
}

type Source = { url: string; read: (response: Response) => Promise<number> }

const sources: Source[] = [
  {
    // JSON with millisecond precision, CORS enabled.
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    read: async response => {
      const { dateTime } = await response.json() as { dateTime: string }
      return Date.parse(dateTime.replace(/(\.\d{3})\d*$/, '$1') + 'Z')
    },
  },
  {
    // `ts=<epoch seconds>` is truncated to the second: the real time is within [ts, ts + 1).
    url: 'https://cloudflare.com/cdn-cgi/trace',
    read: async response => {
      const match = /^ts=(\d+(?:\.\d+)?)$/m.exec(await response.text())
      if (!match) return NaN
      const seconds = Number(match[1])
      return Number.isInteger(seconds) ? seconds * 1000 + 500 : seconds * 1000
    },
  },
]

async function query({ url, read }: Source): Promise<{ server: number; mono: number }> {
  const sent = performance.now()
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`time source ${response.status}`)
  const server = await read(response)
  const received = performance.now()
  if (!Number.isFinite(server)) throw new Error('time source returned no time')
  // The server stamped the time about half a round trip before we received it.
  return { server: server + (received - sent) / 2, mono: received }
}

/** Syncs with the first reachable time source; rejects if none answers. */
export async function syncClock(): Promise<void> {
  let failure: unknown
  for (const source of sources) {
    try { anchor = await query(source); return } catch (cause) { failure = cause }
  }
  throw failure
}
