// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
// Uncomment this import
import MobileRedirect from "@/components/MobileRedirect";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ShiftBid Calculator",
  description: "Filter and compare shift schedules based on your preferences",
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
            {/* Add MobileRedirect wrapper back */}
            <MobileRedirect>
              {children}
            </MobileRedirect>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}