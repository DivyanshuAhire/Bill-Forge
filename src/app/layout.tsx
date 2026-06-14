import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bill Generator",
  description: "A simple and professional bill generator.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  let companyName = "Bill Generator";
  let isAuthenticated = false;

  if (userId) {
    try {
      await connectToDatabase();
      const user = await User.findById(userId);
      if (user) {
        isAuthenticated = true;
        if (user.companyName) {
          companyName = user.companyName;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {isAuthenticated ? (
          <div className="flex h-screen overflow-hidden">
            <div className="hidden md:block"><Sidebar companyName={companyName} /></div>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
              {children}
            </main>
          </div>
        ) : (
          <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
