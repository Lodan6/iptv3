import './globals.css'

export const metadata = {
  title: '🎬 IPTV Ultra Vision - Cinema Edition',
  description: 'Sua plataforma IPTV premium',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
