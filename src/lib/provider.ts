const providerDomains: Record<string, string> = {
  google: 'google.com',
  github: 'github.com',
  gitlab: 'gitlab.com',
  cloudflare: 'cloudflare.com',
  microsoft: 'microsoft.com',
  'microsoft account': 'microsoft.com',
  azure: 'azure.microsoft.com',
  amazon: 'amazon.com',
  aws: 'aws.amazon.com',
  'amazon web services': 'aws.amazon.com',
  facebook: 'facebook.com',
  instagram: 'instagram.com',
  discord: 'discord.com',
  twitter: 'x.com',
  x: 'x.com',
  dropbox: 'dropbox.com',
  slack: 'slack.com',
  notion: 'notion.so',
  openai: 'openai.com',
  chatgpt: 'chatgpt.com',
  paypal: 'paypal.com',
  bitwarden: 'bitwarden.com',
  proton: 'proton.me',
  'proton mail': 'proton.me',
  twitch: 'twitch.tv',
  reddit: 'reddit.com',
  linear: 'linear.app',
  vercel: 'vercel.com',
  netlify: 'netlify.com',
}

export function getProviderDomain(issuer: string): string | null {
  const value = issuer.trim().toLowerCase()
  if (Object.hasOwn(providerDomains, value)) return providerDomains[value]!
  // Resolve only an explicit issuer domain or URL, never an account email or a guessed .com.
  if (!value || /\s/.test(value)) return null
  let url: URL
  try { url = new URL(value.includes('://') ? value : `https://${value}`) }
  catch { return null }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
  const host = url.hostname.replace(/\.$/, '')
  if (host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/.test(host)) return null
  if (/\.(?:local|localhost|internal|test|invalid|example)$/.test(host)) return null
  return host
}

export function getProviderLogoUrl(issuer: string): string | null {
  const domain = getProviderDomain(issuer)
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : null
}
