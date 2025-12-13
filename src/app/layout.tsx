import "./globals.css";

export const metadata = {
  title: "Saathi.ai — Your Legal Practice Partner",
  description: "Private AI assistant for Supreme Court practice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
