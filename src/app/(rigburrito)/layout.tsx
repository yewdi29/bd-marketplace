import { DM_Mono } from 'next/font/google'
import './rigburrito.css'

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export default function RigburritoRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={dmMono.variable} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      {children}
    </div>
  )
}
