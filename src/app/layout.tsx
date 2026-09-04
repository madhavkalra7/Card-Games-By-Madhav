import type { Metadata } from 'next';
import './globals.css';
import { Toast } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Card Games By Madhav | Traditional Indian 52-Card Platform',
  description: 'A premium real-time multiplayer table game platform for traditional Indian 52-card games like Dukki Bazaar. Create private rooms and play with friends online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♠</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-gold-bright selection:text-black">
        <Toast />
        {children}
      </body>
    </html>
  );
}
