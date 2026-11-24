export async function readClipboardInput(): Promise<string | File | null> {
  if (typeof navigator.clipboard?.read === 'function') {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const imageType = item.types.find(type => type.startsWith('image/'))
      if (imageType) return new File([await item.getType(imageType)], 'clipboard-qr', { type: imageType })
    }
    for (const item of items) {
      if (item.types.includes('text/plain')) {
        const text = await (await item.getType('text/plain')).text()
        if (text.trim()) return text
      }
    }
    return null
  }
  const text = await navigator.clipboard.readText()
  return text.trim() ? text : null
}
