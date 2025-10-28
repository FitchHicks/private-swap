export const metadata = {
  title: "Private Swap - Secure & Encrypted Trading",
  description: "Experience private and secure token swaps with FHEVM encryption",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1429 100%)',
        minHeight: '100vh',
        color: '#ffffff',
      }}>
        {children}
      </body>
    </html>
  );
}


