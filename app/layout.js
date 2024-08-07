import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'
import * as gtag from '../lib/gtag'
import logo from '../images/logoImg.png';
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://pantrymate.vercel.app'), 
  title: 'PantryMate',
  description: 'PantryMate helps you effortlessly manage your pantry inventory. Keep track of your food items and quantities.',
  keywords: 'pantry management, inventory tracking, food organization',
  openGraph: {
    title: 'PantryMate',
    description: 'PantryMate helps you effortlessly manage your pantry inventory. Keep track of your food items and quantities',
    url: '/', 
    siteName: 'PantryMate',
    images: [
      {
        url: '/logoImg.png',
        width: 1200,
        height: 1200,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PantryMate',
    description: 'PantryMate helps you effortlessly manage your pantry inventory. Keep track of your food items and quantities.',
    images: ['/logoImg.png'], 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: logo.src,
    apple: logo.src,
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logoImg.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gtag.GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}