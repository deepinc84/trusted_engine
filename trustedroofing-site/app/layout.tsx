import "./globals.css";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import OrganizationSchema from "@/components/OrganizationSchema";
import Script from "next/script";
import { buildMetadata } from "@/lib/seo";
import AttributionTracker from "@/components/AttributionTracker";
import AnalyticsManager from "@/components/AnalyticsManager";

export const metadata = buildMetadata({
  title: "Trusted Roofing & Exteriors | Calgary Roofing Company",
  description: "Trusted Calgary roofing and exterior contractors for roof replacement, repairs, siding, eavestroughs and fast online estimates.",
  path: "/"
});

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
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Montserrat:wght@600;800&display=swap"
          />
        </noscript>
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <OrganizationSchema />
        <ChunkLoadRecovery />
        <AttributionTracker />
        <AnalyticsManager />
        <div className="page">
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </div>

        <Script id="font-loader" strategy="lazyOnload">
          {`
            (function() {
              if (document.getElementById('google-fonts-main')) return;
              var link = document.createElement('link');
              link.id = 'google-fonts-main';
              link.rel = 'stylesheet';
              link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Montserrat:wght@600;800&display=swap';
              document.head.appendChild(link);
            })();
          `}
        </Script>

        <Script id="google-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});try{var c=JSON.parse(localStorage.getItem('trusted_consent_v1')||'null');if(c)gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.ads?'granted':'denied',ad_user_data:c.ads?'granted':'denied',ad_personalization:c.ads?'granted':'denied'})}catch(e){}`}
        </Script>
        {/* Direct GA4; route page views are emitted once by AnalyticsManager. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-D895RE5E8H"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            const initAnalytics = () => {
              gtag('js', new Date());
              gtag('config', 'G-D895RE5E8H', { send_page_view: false });
            };
            if ('requestIdleCallback' in window) {
              requestIdleCallback(initAnalytics, { timeout: 3500 });
            } else {
              setTimeout(initAnalytics, 2000);
            }
          `}
        </Script>
      </body>
    </html>
  );
}
