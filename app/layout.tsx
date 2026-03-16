import localFont from 'next/font/local'
import "./globals.css";
import Layout from '@/components/Layout/Layout'

const nanumGothic = localFont({
  src: [
    { path: '../public/fonts/NanumGothicLight.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/NanumGothic.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/NanumGothicBold.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/NanumGothicExtraBold.ttf', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-nanum-gothic',
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Gather",
  description: "This is a Gather clone.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={nanumGothic.className}>
      <body>
        <Layout>
            {children}
        </Layout>
      </body>
    </html>
  );
}
