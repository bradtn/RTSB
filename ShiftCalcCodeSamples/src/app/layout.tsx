// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ShiftCalc",
  description: "Filter and compare shift schedules based on your preferences",
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/images/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/images/favicon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/images/apple-icon.png', sizes: '180x180' },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}