import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toast } from '@/components/ui/Toast';
import { GlobalModals } from '@/components/providers/GlobalModals';
import { PwaRegistration } from '@/components/pwa/PwaRegistration';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Card Games By Madhav | Traditional Indian 52-Card Platform',
  description: 'A premium real-time multiplayer table game platform for traditional Indian 52-card games like Bluff Master & Dukki Bazaar. Play online with friends.',
  manifest: '/manifest.json',
  applicationName: 'Card Games By Madhav',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Card Games',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#080d0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Card Games" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#080d0a" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800;900&family=Press+Start+2P&display=swap" rel="stylesheet" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="antialiased selection:bg-gold-bright selection:text-black">
        <PwaRegistration />
        <Toast />
        <GlobalModals />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}

