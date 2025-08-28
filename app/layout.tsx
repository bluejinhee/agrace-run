import type { Metadata } from 'next'
import './globals.css'
import { Layout } from '../components/Layout'
import { ErrorBoundary } from '../components/ErrorBoundary'

export const metadata: Metadata = {
  title: '큰은혜교회 런닝크루',
  description: '큰은혜교회 런닝크루 애플리케이션',
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