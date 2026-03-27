import "./globals.css";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import Script from "next/script";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Montserrat:wght@500;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="page">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-D895RE5E8H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D895RE5E8H');
          `}
        </Script>
      </body>
    </html>
  );
}
