import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import CartDrawer from "@/components/CartDrawer";
import LanguageSelector from "@/components/LanguageSelector";

export const metadata: Metadata = {
  title: "SØMNUS | The Golden 30 Minutes",
  description: "Master the art of the evening wind-down.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <LanguageSelector />
              <Navbar />
              <CartDrawer />
              {children}
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
