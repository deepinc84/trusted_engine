import type { Metadata } from "next";
import PageContainer from "@/components/ui/PageContainer";
import QuoteFlow from "@/components/QuoteFlow";

export const metadata: Metadata = {
  title: "Instant Quote Test Pipeline",
  description: "Internal test pipeline for instant estimate + PDF layout validation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

export const dynamic = "force-dynamic";

export default function QuoteTestPage() {
  return (
    <section className="ui-page-section ui-page-section--soft ui-page-section--quote">
      <PageContainer>
        <div className="quote-shell">
          <div className="quote-shell__form">
            <QuoteFlow testMode />
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
