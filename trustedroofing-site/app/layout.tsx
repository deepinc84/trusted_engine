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
                src="/logo-mark.svg"
                alt="Trusted Roofing & Exteriors"
                width={40}
                height={40}
                priority
              />
              <div className="brand-text">
                <span>Trusted</span>
                <span>Roofing & Exteriors</span>
              </div>
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
                src="/logo.svg"
                alt="Trusted Roofing & Exteriors"
                width={160}
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
