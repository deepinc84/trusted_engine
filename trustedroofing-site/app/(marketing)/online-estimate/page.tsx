import QuoteApplicationSchema, { quoteFaqItems } from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import QuoteFlow from "@/components/QuoteFlow";
import QuoteActivitySummary from "@/components/QuoteActivitySummary";
import { buildMetadata } from "@/lib/seo";
import dynamicImport from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const FaqAccordion = dynamicImport(() => import("@/components/FaqAccordion"), {
  ssr: false,
  loading: () => <p className="homev3-copy">Loading FAQ…</p>
});

const quoteBenefits = [
  {
    title: "Free instant estimate before contact details",
    body: "Start with a free instant estimate before sharing contact details, then choose whether you want a detailed follow-up."
  },
  {
    title: "Address-level roof and exterior pricing",
    body: "Review planning ranges built around address-level roof data, local pricing bands, and Calgary exterior project context."
  },
  {
    title: "Download a PDF proposal when ready",
    body: "Use the estimate to compare roofing, siding, and eavestrough scopes, then download a PDF proposal when you are ready."
  }
] as const;

export const metadata = buildMetadata({
  title: "Instant Roof Quote Calgary | Free Online Estimate",
  description: "Get an instant roof quote for Calgary homes using address-level roof data. Compare roofing, siding, and eavestrough estimates before booking a site visit.",
  path: "/online-estimate",
  imagePath: "/Instant_estimate_hero.png"
});

export const dynamic = "force-dynamic";

const quoteFlowSteps = [
  {
    title: "Enter your address",
    description: "Start with your Calgary address so the estimator can build a planning range around the home."
  },
  {
    title: "Choose roofing or exterior scope",
    description: "Compare roofing, siding, eavestrough, or bundled exterior work without leaving the quote flow."
  },
  {
    title: "Review your estimate range",
    description: "See a practical planning range before deciding whether you want a detailed follow-up."
  },
  {
    title: "Download your proposal or request follow-up",
    description: "Save a PDF proposal when ready or ask the team to review details for next steps."
  }
];

export default function QuotePage() {
  return (
    <>
      <QuoteApplicationSchema />
      <section className="online-estimate-hero">
        <Image
          className="online-estimate-hero__background"
          src="/Instant_estimate_hero.png"
          alt="Roof measurement diagram used for Calgary instant roofing estimates"
          fill
          sizes="100vw"
          priority
        />
        <div className="online-estimate-hero__overlay" />
        <PageContainer>
          <div className="online-estimate-hero__layout">
            <div className="online-estimate-hero__content">
              <p className="homev3-eyebrow">Instant roof quote</p>
              <h1>Instant Roof Quote for Calgary Homes</h1>
              <p className="online-estimate-hero__description">
                Enter your address to get an instant roof quote for your Calgary home, then compare roofing, siding, and eavestrough estimate options before deciding whether you want a detailed follow-up.
              </p>
              <ul className="online-estimate-hero__trust-list">
                {quoteBenefits.map((benefit) => (
                  <li key={benefit.title}>
                    <strong>{benefit.title}</strong>
                    <span>{benefit.body}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="online-estimate-hero__form">
              <QuoteFlow
                mode="start"
                resultTargetId="online-estimate-result"
                nearbyActivityTargetId="online-estimate-activity"
              />
            </div>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section ui-page-section--soft ui-page-section--quote">
        <PageContainer>
          <div className="quote-page-stack">
            <section className="quote-flow-overview" aria-labelledby="quote-flow-overview-title">
              <div className="quote-flow-overview__header">
                <h2 id="quote-flow-overview-title">How an instant roof quote works in Calgary</h2>
                <p>An instant roof quote uses your address to estimate roof size, slope, complexity, and project scope before a site visit. It gives Calgary homeowners a fast planning range for roofing, siding, or eavestrough work so they can compare options before requesting a detailed quote.</p>
              </div>
              <div className="quote-flow-overview__grid">
                {quoteFlowSteps.map((step) => (
                  <article key={step.title} className="ui-card quote-flow-step">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <div id="online-estimate-result" className="quote-page-result" aria-live="polite" />

            <div id="online-estimate-activity" className="quote-page-activity" />

            <div className="quote-support-stack">
              <article className="ui-card quote-support-card">
                <p className="ui-page-hero__eyebrow">Estimate factors</p>
                <h2>What affects your instant roof estimate?</h2>
                <p>
                  Your planning range can change with roof size, roof pitch, roof complexity, the number of existing layers, access and disposal needs, shingle or material choice, ventilation, flashing, and other roof details. If you select siding or eavestrough work, the exterior scope also affects the estimate.
                </p>
                <p>
                  Use this tool to compare <Link href="/services/roofing">roofing</Link>, <Link href="/services/roof-replacement">roof replacement</Link>, <Link href="/services/roof-repair">roof repair</Link>, <Link href="/services/siding">siding</Link>, and <Link href="/services/eavestrough">eavestrough</Link> options, or review <Link href="/quotes">recent Calgary quote examples</Link> before you decide on next steps.
                </p>
                <p>
                  <Link href="/online-estimate">Start instant roof quote</Link>
                </p>
              </article>

              <article className="ui-card quote-support-card">
                <p className="ui-page-hero__eyebrow">Planning tool</p>
                <h2>More than a basic roof calculator</h2>
                <p>
                  This is not just a generic roofing calculator. It starts from address-level roof and exterior information, then gives a practical planning range for Calgary homeowners before they decide whether to request detailed follow-up.
                </p>
                <p>
                  The estimate experience supports PDF proposal downloads, scope comparison, roofing, siding, and eavestrough options, and Calgary-area pricing context so you can keep planning without moving away from the quote tool.
                </p>
                <p>
                  <Link href="/online-estimate">Get instant roof quote</Link>
                </p>
              </article>
              <QuoteActivitySummary />

              <article className="ui-card quote-support-card">
                <p className="ui-page-hero__eyebrow">FAQ</p>
                <h2>Instant roof quote questions</h2>
                <FaqAccordion items={quoteFaqItems} />
              </article>
            </div>
          </div>
        </PageContainer>
      </section>
      <CtaBand
        title="Need to talk through options?"
        body="Submit your quote and we can refine material choices and timing with you."
      />
    </>
  );
}
