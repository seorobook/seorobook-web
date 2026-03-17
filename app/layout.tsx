import "./globals.css";
import Layout from '@/components/Layout/Layout'

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
    <html lang="ko">
      <body>
        <Layout>
            {children}
        </Layout>
      </body>
    </html>
  );
}
