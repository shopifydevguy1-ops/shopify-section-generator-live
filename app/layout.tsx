import type { Metadata } from "next"
import { JetBrains_Mono, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
})

export const metadata: Metadata = {
  title: "Shopify Section Generator",
  description: "Generate beautiful Shopify sections from pre-built templates",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/logo.svg" />
          <Script
            id="theme-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const theme = localStorage.getItem('theme');
                    if (!theme) {
                      localStorage.setItem('theme', 'dark');
                      document.documentElement.classList.add('dark');
                    } else if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}

