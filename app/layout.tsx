import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cuatroporciento · Colaboración inmobiliaria",
  description: "Red de colaboración inmobiliaria: inventario, solicitudes y acuerdos entre asesores con ingreso validado.",
  icons: {
    icon: "/brand/isotipo-lima.png",
    shortcut: "/brand/isotipo-lima.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
