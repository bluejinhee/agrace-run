import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Layout } from '../components/Layout'
import { ErrorBoundary } from '../components/ErrorBoundary'

export const metadata: Metadata = {
  title: '큰은혜교회 러닝크루',
  description: '큰은혜교회 러닝크루 애플리케이션',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <Layout>
            {children}
          </Layout>
        </ErrorBoundary>
      </body>
    </html>
  )
}