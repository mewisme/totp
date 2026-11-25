import type { ErrorCode } from './errors.ts'

export type Language = 'vi' | 'en'
export type Theme = 'system' | 'light' | 'dark'

export function detectLanguage(languages: readonly string[]): Language {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'vi' || base === 'en') return base
  }
  return 'vi'
}

const vi = {
  locale: 'vi-VN', pageTitle: 'totp · Mã xác thực',
  description: 'Dán secret, otpauth hoặc ảnh QR để lấy mã OTP trước, hiện tại và tiếp theo. Không lưu dữ liệu.',
  language: 'Ngôn ngữ', appearance: 'Giao diện', system: 'Theo hệ thống', light: 'Sáng', dark: 'Tối',
  skip: 'Đi đến nội dung', privacyBadge: 'Không lưu dữ liệu',
  title: 'Dán vào. Lấy mã. Xong.',
  subtitle: 'Secret, liên kết otpauth hay ảnh QR — một chỗ cho tất cả.',
  inputLabel: 'Secret hoặc otpauth://', placeholder: 'Dán secret hoặc otpauth://totp/... vào đây',
  clear: 'Xóa dữ liệu', hide: 'Ẩn nội dung', show: 'Hiện nội dung',
  inputHint: 'Tự nhận diện và tạo mã khi bạn nhập.', chooseQr: 'Chọn ảnh QR', qrFile: 'Tệp ảnh QR', readingQr: 'Đang đọc QR…',
  qrHint: 'Kéo thả ảnh hoặc dán QR bằng Ctrl / ⌘ + V', qrRead: 'Đã đọc mã QR',
  region: 'Mã OTP ở ba mốc thời gian', provider: 'Dịch vụ', unknownProvider: 'Chưa xác định dịch vụ',
  noProvider: 'Secret không chứa thông tin dịch vụ.',
  timeline: 'Ba mốc thời gian', spacing: 'Cách nhau 30 giây',
  titles: ['Mã trước', 'Mã hiện tại', 'Mã tiếp theo'],
  timeHints: ['Trước 30 giây', 'Ngay bây giờ', 'Sau 30 giây'],
  ready: 'Sẵn sàng', empty: 'Chờ dữ liệu', generating: 'Đang tạo mã…',
  emptyHint: 'Dán dữ liệu ở trên để lấy mã xác thực.', reset: 'Làm mới',
  copy: (title: string) => `Sao chép ${title.toLocaleLowerCase('vi')}`,
  copied: (title: string) => `Đã sao chép ${title.toLocaleLowerCase('vi')}.`,
  copiedButton: 'Đã chép', copyButton: 'Sao chép',
  copyFailed: 'Không thể sao chép. Hãy chọn mã và sao chép thủ công.',
  paste: 'Dán', pasting: 'Đang dán…',
  pasteFailed: 'Không thể đọc clipboard. Hãy cho phép quyền dán trong trình duyệt, hoặc dùng Ctrl / ⌘ + V.',
  clipboardEmpty: 'Clipboard chưa có văn bản hoặc ảnh để dán.',
  countdown: (seconds: number) => `Mã hiện tại đổi sau ${seconds} giây`,
  parameters: (digits: number, algorithm: string, period: number) => `${digits} số · ${algorithm} · Chu kỳ ${period}s`,
  local: 'Xử lý ngay trên thiết bị.', localDetails: 'Ảnh và secret không được gửi lên máy chủ.',
  google: 'Logo từ Google chỉ nhận domain dịch vụ.', clean: 'Không lưu lịch sử. Refresh là sạch.',
  help: 'Cách sử dụng & quyền riêng tư',
  helpUsage: 'Lấy và sao chép mã như thế nào?',
  helpTiming: 'Ba mốc thời gian hoạt động thế nào?',
  helpData: 'Dữ liệu của tôi có được lưu lại không?',
  helpSteps: 'Dán khóa Base32 hoặc otpauth, hoặc chọn một ảnh QR rõ nét (tối đa 10 MB). Bấm vào thẻ mã bạn cần để sao chép, hoặc dùng Tab rồi Enter / Space.',
  helpPeriods: 'Các mốc luôn cách nhau 30 giây. Nếu otpauth dùng chu kỳ khác, hai mốc có thể có cùng mã. Thời gian thiết bị cần chính xác.',
  helpPrivacy: 'Dữ liệu và lựa chọn giao diện chỉ nằm trong bộ nhớ của trang. Tải lại sẽ xóa chúng. Mã đã sao chép vẫn còn trong clipboard của thiết bị.',
  shortcuts: 'Ctrl / ⌘ + K: đi đến ô nhập · Esc: xóa dữ liệu',
  dropTitle: 'Thả ảnh QR vào đây', dropHint: 'Đọc trực tiếp trên thiết bị. Không tải lên máy chủ.',
  closeNotice: 'Đóng thông báo', seconds: 'giây',
  errors: {
    invalidSecret: 'Khóa Base32 không hợp lệ. Chỉ dùng chữ A–Z và số 2–7.',
    invalidSecretBits: 'Phần dữ liệu cuối của khóa Base32 không hợp lệ. Hãy kiểm tra lại khóa.',
    missingName: 'Liên kết cần có tên tài khoản hoặc email.', nameTooLong: 'Tên dịch vụ hoặc tài khoản quá dài.',
    unsupportedAlgorithm: 'Chỉ hỗ trợ thuật toán SHA-1, SHA-256 hoặc SHA-512.',
    unsupportedDigits: 'Chỉ hỗ trợ mã gồm 6 hoặc 8 chữ số.', invalidPeriod: 'Chu kỳ phải là số nguyên từ 1 đến 300 giây.',
    invalidUri: 'Liên kết otpauth không hợp lệ.', unsupportedUri: 'Chỉ hỗ trợ liên kết otpauth://totp/.',
    invalidLabel: 'Tên tài khoản trong liên kết không hợp lệ.', issuerMismatch: 'Tên dịch vụ trong nhãn không khớp với issuer của liên kết.',
    cryptoUnavailable: 'Cần dùng HTTPS hoặc localhost và trình duyệt hỗ trợ Web Crypto.',
    clockUnavailable: 'Không lấy được giờ từ internet. Hãy kiểm tra kết nối mạng.',
    imageRequired: 'Hãy chọn ảnh QR ở định dạng PNG, JPG hoặc WebP.', imageTooLarge: 'Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn 10 MB.',
    imageUnreadable: 'Không thể mở ảnh này. Hãy thử ảnh PNG hoặc JPG.', canvasUnavailable: 'Trình duyệt không hỗ trợ đọc ảnh. Hãy dán secret hoặc otpauth.',
    qrNotFound: 'Không tìm thấy mã QR. Hãy dùng ảnh rõ nét, có đủ viền quanh mã.', unexpected: 'Không thể xử lý dữ liệu này. Vui lòng thử lại.',
  } satisfies Record<ErrorCode, string>,
}

const en: typeof vi = {
  locale: 'en-US', pageTitle: 'totp · Authenticator',
  description: 'Paste a secret, otpauth link or QR image to get previous, current and next OTP codes. Nothing is saved.',
  language: 'Language', appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark',
  skip: 'Skip to content', privacyBadge: 'Nothing saved',
  title: 'Paste it. Get your code. Done.', subtitle: 'A secret, an otpauth link or a QR image — one place for all three.',
  inputLabel: 'Secret or otpauth://', placeholder: 'Paste your secret or otpauth://totp/... here',
  clear: 'Clear input', hide: 'Hide input', show: 'Show input', inputHint: 'Automatically detected as you type.',
  chooseQr: 'Choose QR image', qrFile: 'QR image file', readingQr: 'Reading QR…', qrHint: 'Drop an image or paste a QR with Ctrl / ⌘ + V', qrRead: 'QR code read',
  region: 'OTP codes at three points in time', provider: 'Provider', unknownProvider: 'Unknown provider', noProvider: 'A secret alone does not identify its provider.',
  timeline: 'Three moments', spacing: '30 seconds apart', titles: ['Previous code', 'Current code', 'Next code'], timeHints: ['30 seconds ago', 'Right now', 'In 30 seconds'],
  ready: 'Ready', empty: 'Waiting for input', generating: 'Generating codes…', emptyHint: 'Paste your input above to get your codes.', reset: 'Reset',
  copy: (title: string) => `Copy ${title.toLowerCase()}`, copied: (title: string) => `Copied ${title.toLowerCase()}.`,
  copiedButton: 'Copied', copyButton: 'Copy', copyFailed: 'Could not copy. Select the code and copy it manually.',
  paste: 'Paste', pasting: 'Pasting…',
  pasteFailed: 'Could not read the clipboard. Allow clipboard access in your browser, or use Ctrl / ⌘ + V.',
  clipboardEmpty: 'There is no text or image in the clipboard to paste.',
  countdown: (seconds: number) => `Current code refreshes in ${seconds}s`,
  parameters: (digits: number, algorithm: string, period: number) => `${digits} digits · ${algorithm} · ${period}s period`,
  local: 'Processed on your device.', localDetails: 'Your images and secrets never leave this page.',
  google: 'Google receives only the provider domain for its logo.', clean: 'No history. Refresh to start clean.',
  help: 'How it works & privacy',
  helpUsage: 'How do I get and copy a code?',
  helpTiming: 'How do the three timestamps work?',
  helpData: 'Is my data saved anywhere?',
  helpSteps: 'Paste a Base32 key or otpauth link, or choose a clear QR image (up to 10 MB). Click anywhere on a code card to copy, or use Tab then Enter / Space.',
  helpPeriods: 'The three timestamps are always 30 seconds apart. A custom otpauth period can produce the same code at two timestamps. Your device clock must be accurate.',
  helpPrivacy: 'Your input and appearance choices stay only in page memory. Reloading clears them. A copied code remains in your device clipboard.',
  shortcuts: 'Ctrl / ⌘ + K: focus input · Esc: clear input',
  dropTitle: 'Drop your QR image here', dropHint: 'Read on your device. Nothing is uploaded.',
  closeNotice: 'Dismiss notification', seconds: 'seconds',
  errors: {
    invalidSecret: 'Invalid Base32 key. Use only letters A–Z and digits 2–7.', invalidSecretBits: 'The Base32 key has invalid trailing data. Please check the key.',
    missingName: 'The link must include an account name or email.', nameTooLong: 'The provider or account name is too long.',
    unsupportedAlgorithm: 'Only SHA-1, SHA-256 and SHA-512 are supported.', unsupportedDigits: 'Only 6-digit and 8-digit codes are supported.',
    invalidPeriod: 'The period must be a whole number from 1 to 300 seconds.', invalidUri: 'Invalid otpauth link.', unsupportedUri: 'Only otpauth://totp/ links are supported.',
    invalidLabel: 'The account label in the link is invalid.', issuerMismatch: 'The provider in the label does not match the issuer parameter.',
    cryptoUnavailable: 'Use HTTPS or localhost with a browser that supports Web Crypto.',
    clockUnavailable: 'Could not get the time from the internet. Check your network connection.',
    imageRequired: 'Choose a QR image in PNG, JPG or WebP format.', imageTooLarge: 'The image is too large. Choose a file smaller than 10 MB.',
    imageUnreadable: 'Could not open this image. Try a PNG or JPG file.', canvasUnavailable: 'Your browser cannot read images. Paste the secret or otpauth link instead.',
    qrNotFound: 'No QR code found. Use a clear image with a border around the code.', unexpected: 'Could not process this input. Please try again.',
  },
}

export const messages = { vi, en }
