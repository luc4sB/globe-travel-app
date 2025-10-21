import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import { ThemeProvider } from "./themeProvider";
import Background from "./components/Background";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Background />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
