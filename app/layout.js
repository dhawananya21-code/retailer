import "./globals.css";

export const metadata = {
  title: "Farmer Video Finder",
  description: "Find farmer testimonial videos by district and product.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
