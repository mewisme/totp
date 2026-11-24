import { AppError } from './errors.ts'

export async function readQrImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new AppError('imageRequired')
  if (file.size > 10 * 1024 * 1024) throw new AppError('imageTooLarge')
  const url = URL.createObjectURL(file)
  const image = new Image()
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new AppError('imageUnreadable'))
      image.src = url
    })
    const jsQR = (await import('jsqr')).default
    // Bound pixel work for large screenshots; also try the native resolution for small QR codes.
    const scales = [...new Set([Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight)), Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight))])]
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new AppError('canvasUnavailable')
    for (const scale of scales) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
      if (result?.data) return result.data
    }
    throw new AppError('qrNotFound')
  } finally {
    URL.revokeObjectURL(url)
    image.src = ''
  }
}
