import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";
import RoofRejuvenationComparisons from "@/components/RoofRejuvenationComparisons";
import ServiceSchema from "@/components/ServiceSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Roof Rejuvenation Calgary | Instant Fixed Quote", description: "Get an instant fixed roof rejuvenation quote for qualifying asphalt shingles in Calgary and compare the treatment price with full roof replacement.", path: "/services/roof-rejuvenation" });
const quoteUrl = "/online-estimate?intent=roof-rejuvenation";
const faq = [
  { question: "Is the treatment price final?", answer: "Yes. The treatment price is fixed from the measured roof area and pitch. A condition review can approve or disqualify the roof, but it does not increase that treatment price. Required repairs, cleaning and unmeasured structures are separate." },
  { question: "Does every asphalt roof qualify?", answer: "No. Shingles and the roof deck must remain serviceable. Severe curling, cracking, granule loss, storm damage or decking concerns can disqualify a roof." },
  { question: "Does rejuvenation repair active leaks?", answer: "No. Active leakage, flashing failures, missing shingles, damaged decking and ventilation defects must be assessed and corrected separately." },
  { question: "Is roof rejuvenation a roof coating?", answer: "No. It is a treatment applied to qualifying asphalt shingles, not a coating installed over a failed roof system." },
  { question: "Does it make shingles Class 4?", answer: "No. Roof rejuvenation does not change the shingle impact rating or create a Class 4 roof system." },
  { question: "Can I price replacement at the same time?", answer: "Yes. The instant quote shows the existing roof replacement estimate and the exact rejuvenation treatment price together." },
  { question: "What does the $1,595 minimum cover?", answer: "It is the minimum treatment charge for the measured and selected roof structure. Repairs, required cleaning, detached garages, sheds and other unmeasured structures are separate." }
] as const;

export default function RoofRejuvenationPage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <>
    <ServiceSchema serviceName="Roof Rejuvenation" serviceSlug="roof-rejuvenation" serviceType="Roof preservation service" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <PageHero eyebrow="New roof preservation option" title="Roof Rejuvenation in Calgary With Instant Fixed Pricing" description="Not every aging asphalt roof requires immediate replacement. Shingles that remain structurally serviceable may qualify for treatment designed to delay premature replacement for up to five years." actions={<><Link className="button" href={quoteUrl}>Get My Fixed Rejuvenation Quote</Link><Link className="button button--ghost" href="/services/roof-replacement">Compare With Roof Replacement</Link></>} />
    <section className="ui-page-section"><PageContainer><div className="ui-detail-grid"><article className="ui-card"><h2>What roof rejuvenation is</h2><p>Roof rejuvenation is a treatment for qualifying aging asphalt shingles that are still flat, secured and structurally serviceable. It is designed to help restore flexibility, improve granule retention, reduce continued brittleness, delay premature replacement and preserve a serviceable roof. It does not make worn shingles new again.</p></article><article className="ui-card"><h2>Exact pricing by roof pitch</h2><p><strong>Starting at $1,595</strong></p><ul><li>Up to 6/12: $1.00 per sq. ft.</li><li>7/12: $1.15 per sq. ft.</li><li>8/12: $1.20 per sq. ft.</li><li>9/12: $1.25 per sq. ft.</li><li>10/12 and steeper: $1.40 per sq. ft.</li></ul><p>The website provides one fixed treatment quote based only on measured roof area and pitch.</p></article></div></PageContainer></section>
    <section className="ui-page-section ui-page-section--soft"><PageContainer><h2>Condition review before treatment</h2><div className="ui-detail-grid"><article className="ui-card"><h3>Possible qualifying conditions</h3><ul><li>Asphalt shingles remain generally flat and secured</li><li>No widespread exposed fiberglass</li><li>The roof deck remains sound</li><li>Isolated repairs can be completed</li><li>The roof has not reached complete failure</li></ul></article><article className="ui-card"><h3>Likely disqualifying conditions</h3><ul><li>Widespread severe curling or extensive cracking</li><li>Exposed fiberglass or severe granule loss</li><li>Compromised decking or widespread storm damage</li><li>Active leakage that cannot be corrected</li><li>A roof at the end of its serviceable life</li></ul></article></div></PageContainer></section>
    <section className="ui-page-section"><PageContainer><article className="ui-card"><p className="homev3-eyebrow">Five-year cost comparison</p><h2>Preserve a serviceable roof before replacement is necessary</h2><p>Designed to help preserve qualifying asphalt shingles and delay replacement for up to five years. Actual service life depends on existing condition, exposure and maintenance, so this is not a guarantee of five additional years.</p></article></PageContainer></section>
    <RoofRejuvenationComparisons />
    <section className="ui-page-section ui-page-section--soft"><PageContainer><h2>Repair, rejuvenate or replace</h2><div className="ui-grid ui-grid--services"><article className="ui-card"><h3>Repair</h3><p>Correct isolated defects such as missing shingles or flashing issues.</p></article><article className="ui-card"><h3>Rejuvenate</h3><p>Treat aging but serviceable asphalt shingles after required repairs.</p></article><article className="ui-card"><h3>Replace</h3><p>Install a complete system when deterioration or failure is widespread.</p></article></div></PageContainer></section>
    <section className="ui-page-section"><PageContainer><h2>How the process works</h2><ol className="ui-card"><li>Enter the property address.</li><li>Receive the fixed treatment price.</li><li>Review the roof condition.</li><li>Complete required repairs separately.</li><li>Apply the treatment.</li><li>Receive service documentation.</li></ol></PageContainer></section>
    <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>Roof rejuvenation questions</h2><FaqAccordion items={faq} /></article></PageContainer></section>
    <CtaBand title="Compare preservation with replacement" body="Enter your address for one fixed roof rejuvenation price and the current replacement estimate." primaryLabel="Get My Fixed Rejuvenation Quote" primaryHref={quoteUrl} />
  </>;
}
