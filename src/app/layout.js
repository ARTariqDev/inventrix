import "./globals.css";

export const metadata = {
  title: "TwinStar",
  description: "Your all-in-one inventory management system to keep everything organized, simple, and scalable.",
  keywords: ["inventory", "management", "system", "organization", "business"],
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
