import { DM_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { requireRigburritoAccess } from '@/lib/rigburrito/auth'
import './rigburrito.css'

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

function isLoginPath(pathname: string): boolean {
  return pathname === '/rigburrito/login'
}

export default async function RigburritoRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-rigburrito-pathname') ?? ''

  if (!isLoginPath(pathname)) {
    await requireRigburritoAccess()
  }

  return (
    <div className={dmMono.variable} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      {children}
    </div>
  )
}
