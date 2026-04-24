import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'SeoroBook',
  description: 'SeoroBook — 픽셀 서재 & 오프라인 모임',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#0f1613] text-[#e9f2ed] antialiased">
        {children}
      </body>
    </html>
  );
}
