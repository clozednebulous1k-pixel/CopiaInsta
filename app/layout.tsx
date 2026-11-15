import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Instagram Downloader & Explorer',
  description: 'Visualize perfis públicos e baixe Reels, Fotos e Carrosséis em alta definição.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen selection:bg-pink-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

