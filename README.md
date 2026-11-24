# Vite + React + shadcn/ui + Cloudflare

Tiện ích lấy mã TOTP dùng ngay với React + TypeScript, Vite, Tailwind CSS v4 và shadcn/ui.

## Tính năng

- Một ô nhập tự nhận diện secret Base32 hoặc liên kết `otpauth://totp/`, không cần khai báo tài khoản.
- Chỉ hiển thị thẻ provider khi có issuer (kể cả lấy từ nhãn otpauth).
- Hiển thị dịch vụ từ `issuer` hoặc phần tên dịch vụ trước dấu `:` trong nhãn otpauth, kèm tên tài khoản. Áp dụng cả QR chứa otpauth. Secret thuần không thể xác định dịch vụ.
- Đọc ảnh QR bằng cách chọn ảnh, kéo thả hoặc dán ảnh từ clipboard. Ảnh được đọc tại trình duyệt bằng jsQR, giới hạn 10 MB.
- Logo từ Google Favicon theo domain của issuer hoặc ánh xạ tên dịch vụ phổ biến. Nếu không xác định được domain hoặc tải ảnh thất bại, dùng chữ viết tắt. Chỉ domain được gửi tới Google; không gửi secret, tên tài khoản hay toàn bộ liên kết.
- Hiển thị ba mã tại thời điểm hiện tại trừ 30 giây, hiện tại và hiện tại cộng 30 giây; bấm bất kỳ đâu trên thẻ để sao chép, hoặc dùng Tab rồi Enter/Space.
- Tính sẵn mã cho chu kỳ kế tiếp để chuyển mã liền mạch, không quay về dấu chấm khi đổi chu kỳ.
- Đếm ngược chuyển cam khi còn dưới 5 giây; thẻ có hover, phản hồi nhấn và viền xác nhận sao chép. Dấu đã sao chép gắn với đúng mã và mất khi mã thay đổi.
- Dùng được trên điện thoại và tôn trọng cài đặt giảm chuyển động.
- Theme Sáng / Tối / Theo hệ thống, tự theo dõi thay đổi giao diện của thiết bị. Áp dụng màu trước khi trang hiển thị để tránh nháy sáng.
- Việt / Anh: tự chọn theo ngôn ngữ trình duyệt và chuyển thủ công; bao gồm thông báo lỗi, sao chép, hướng dẫn, nhãn hỗ trợ đọc màn hình, tiêu đề trang và định dạng giờ.
- Ẩn/hiện nội dung đầu vào, dán ảnh hoặc văn bản ở bất cứ đâu trên trang, phím `Ctrl / ⌘ + K` đi đến ô nhập và `Esc` xóa dữ liệu.
- Hỗ trợ bàn phím, liên kết bỏ qua điều hướng, thông báo sao chép và giảm chuyển động theo cài đặt thiết bị.
- Chỉ giữ dữ liệu trong bộ nhớ của trang. Refresh hoặc nút Xóa/Làm mới sẽ xóa dữ liệu đang nhập và kết quả, không lưu localStorage/sessionStorage hay URL.

Theme và ngôn ngữ cũng chỉ giữ trong bộ nhớ. Refresh sẽ chọn lại theo hệ thống/trình duyệt. Nút ẩn nội dung chỉ che văn bản trên màn hình, không mã hóa dữ liệu.

Secret thuần mặc định SHA-1, 6 số, chu kỳ 30 giây. Liên kết hỗ trợ SHA-1/256/512, 6 hoặc 8 số, chu kỳ 1–300 giây. Nếu liên kết dùng chu kỳ khác 30 giây, vẫn giữ đúng chu kỳ đó khi tính mã ở ba mốc cách nhau 30 giây (hai mốc có thể có cùng mã).

Ảnh và secret không được gửi lên máy chủ. Khóa localStorage của giao diện quản lý tài khoản cũ được dọn khi mở trang mới. Xóa/refresh trang không xóa mã đã được bạn sao chép vào clipboard. Cần HTTPS (hoặc localhost) cho Web Crypto và clipboard; thời gian thiết bị phải chính xác.

## Chạy local

Yêu cầu Node.js 22.18+ và pnpm 12.23.0.

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

## Kiểm tra

```sh
pnpm run check
```

Chạy 32 kiểm thử (gồm RFC 6238, Base32, thông tin dịch vụ, ba mốc thời gian, tự nhận diện ngôn ngữ và bản dịch lỗi), lint, TypeScript, build production và kiểm tra đóng gói Workers bằng `wrangler deploy --dry-run`. Lệnh này không triển khai lên Cloudflare.

```sh
pnpm run preview          # Xem bản build sau pnpm run build
pnpm run preview:workers  # Build và chạy trong môi trường Workers local
```

## Triển khai Cloudflare Workers

Đăng nhập lần đầu, sau đó triển khai:

```sh
pnpm exec wrangler login
pnpm run deploy
```

Cấu hình ở `wrangler.jsonc`: tên Worker `totp`, static assets từ `dist`, hỗ trợ SPA fallback. Đây là frontend tĩnh trên Workers, chưa có API backend.

## Triển khai Cloudflare Pages

Tạo Pages project tên `totp` trong tài khoản Cloudflare nếu chưa có, sau đó:

```sh
pnpm exec wrangler login
pnpm run deploy:pages
```

Cấu hình Pages riêng ở `wrangler.pages.jsonc`. Nếu kết nối Git qua Cloudflare Pages dashboard:

- Build command: `pnpm run build`
- Build output directory: `dist`
- Root directory: thư mục dự án

Workers và Pages là hai lựa chọn triển khai, chỉ cần chọn một. Đổi tên `totp` trong cấu hình tương ứng khi cần.

## Thêm component shadcn/ui

```sh
pnpm dlx shadcn@latest add input dialog dropdown-menu
```

- `src/App.tsx`: giao diện nhập dữ liệu và hiển thị ba mã OTP.
- `src/lib/totp.ts`: xử lý Base32, liên kết và tạo mã bằng Web Crypto.
- `src/lib/qr.ts`: đọc ảnh QR cục bộ.
- `src/lib/i18n.ts`: bộ dịch Việt/Anh; thêm chuỗi và ngôn ngữ mới tại đây.
- `src/lib/errors.ts`: mã lỗi độc lập với ngôn ngữ.
- `src/hooks/use-preferences.ts`: theme, ngôn ngữ và metadata.
- `src/components/otp-card.tsx`: thẻ mã dùng chung.
- `src/lib/totp.test.ts`: kiểm thử TOTP.
- `src/components/ui/`: các component shadcn/ui.
- `src/index.css`: Tailwind và biến giao diện.
- `components.json`: cấu hình shadcn/ui.
- Alias `@/` trỏ tới `src/`.

## Tài liệu

- https://ui.shadcn.com/docs/installation/vite
- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
- https://www.rfc-editor.org/rfc/rfc6238
- https://github.com/google/google-authenticator/wiki/Key-Uri-Format
