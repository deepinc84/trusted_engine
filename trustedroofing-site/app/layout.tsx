import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Trusted Roofing & Exteriors",
  description: "Modern roofing and exterior services in Calgary, AB."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <header className="site-header">
            <Link href="/" className="brand">
              <Image
                src="/logo.svg"
                alt="Trusted Roofing & Exteriors"
                width={200}
                height={72}
                className="brand-logo"
                priority
              />
            </Link>
            <nav className="nav">
              <Link href="/services">Services</Link>
              <Link href="/projects">Projects</Link>
              <Link href="/quote" className="cta">
                Get a quote
              </Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div>
              <Image
                src="/logo-mark.svg"
                alt="Trusted Roofing & Exteriors"
                width={64}
                height={64}
              />
            </div>
            <p>
              Calgary, AB • Trusted Roofing & Exteriors • {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
