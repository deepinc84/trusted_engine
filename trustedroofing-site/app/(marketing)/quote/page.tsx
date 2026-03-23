import QuoteApplicationSchema from "@/components/QuoteApplicationSchema";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import QuoteFlow from "@/components/QuoteFlow";
import { buildMetadata } from "@/lib/seo";

const faqs = [
  { question: "How accurate is the instant roofing estimate?", answer: "It is meant to be a realistic budget range, not a fake teaser number. The system uses real completed projects and quote data, then adjusts for roof size, pitch, complexity, and location within Calgary. Final pricing still depends on the site review." },
  { question: "Does the quote tool work for siding and eavestrough too?", answer: "Yes. The tool supports roofing, vinyl siding, Hardie-style siding, and eavestrough scopes. Each uses different pricing logic, so the range reflects the service you actually need." },
  { question: "How long does it take to get a price range?", answer: "Most homeowners can get through the estimate flow in under a minute once the address is selected. The system is built to give a useful range quickly, then let the team confirm details afterward." },
  { question: "Why does location matter in the quote?", answer: "Pricing shifts with real project conditions. Access, neighbourhood patterns, home style, and local demand all influence the range. That is why the tool uses location-aware pricing rather than pretending every Calgary job costs the same." },
  { question: "Do I need an inspection after using the quote tool?", answer: "Yes, if you want a final proposal. The quote is for planning and budget clarity. Inspection confirms measurements, material choice, ventilation issues, hidden repairs, and the final written scope." },
  { question: "Will this replace talking to a real person?", answer: "No. It shortens the early research stage so you can make better decisions faster. If the range makes sense, the next step is still a proper conversation about scope, timing, and materials." }
];

export const metadata = buildMetadata({
  title: "Instant quote",
  description: "A Calgary-specific instant quote tool for roofing, siding, and eavestrough work, built from real project data rather than generic estimator logic.",
  path: "/quote"
});

export default function QuotePage() {
  return (
    <>
      {/* Schema note: keep SoftwareApplication schema as the primary schema on this page. LocalBusiness schema should remain site-wide, not duplicated here. */}
      <QuoteApplicationSchema />
      <PageHero
        eyebrow="Instant quote"
        title="A real estimate tool, not a generic calculator"
        description="Get a practical price range for roofing, siding, or eavestrough work in under a minute, then use that range to decide what happens next."
      />
      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Why this quote tool is different</h2>
              <p>Most online roofing calculators are little more than a form wrapped around a weak average. They ask for a postal code, ignore roof complexity, and spit back a number that feels precise but does not help a homeowner make a real decision. That is not what this tool is for.</p>
              <p>This estimate flow was built around real completed projects and real quote history. It looks at property size, roof pitch, complexity, and location context before it gives a range. In practical terms, that means a steeper roof in one part of Calgary should not be treated the same way as a simple low-complexity home in another area. The tool is designed to reflect that.</p>
              <p>It also helps homeowners compare scope before an inspection. You can look at roofing on its own, price out siding options, or see what eavestrough work does to the range. That makes the next conversation more useful because you are no longer guessing from scratch. You have a number grounded in real work, not a generic marketing funnel.</p>
              <p>The result is a realistic planning range in under 60 seconds. It is still a starting point. Site review matters. Material choice matters. Ventilation issues, access, tear-off conditions, and hidden repairs still need to be confirmed. But if you want an honest first step, this tool gets you there much faster than waiting days for basic budget guidance.</p>
            </article>
            <div className="quote-shell"><div className="quote-shell__form"><QuoteFlow /></div></div>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section"><PageContainer><div className="ui-detail-grid"><article className="ui-card"><h2>What the estimate considers</h2><ul><li>Address and location context across Calgary, Airdrie, Chestermere, and Cochrane.</li><li>Roof size, pitch, and complexity rather than flat-rate guesswork.</li><li>Different scope logic for roofing, siding, and eavestrough work.</li><li>Real project and quote data used to shape realistic price ranges before inspection.</li></ul></article><article className="ui-card"><h2>Why Calgary context matters</h2><p>Hail exposure, freeze-thaw movement, wind-driven rain, and attic ventilation problems all affect roofing and exterior work here. A realistic estimate has to account for those local conditions. That is why this tool is location-aware and why the final review still matters.</p><p>If you are comparing products before requesting a final scope, start with <a href="https://www.gaf.ca/residential-roofing/shingles/timberline-hd" target="_blank" rel="noreferrer">GAF Timberline HD</a> or <a href="https://www.euroshieldroofing.com/" target="_blank" rel="noreferrer">Euroshield</a> for roofing, then use the quote range to understand where those choices sit inside the budget.</p></article></div></PageContainer></section>
      <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>Frequently asked questions</h2>{/* Schema note: apply FAQ schema to this section only. Do not duplicate FAQ markup inside the form component. */}<div className="ui-list-links" style={{ display: "grid", gap: 20 }}>{faqs.map((item) => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div></article></PageContainer></section>
      <CtaBand title="Need to talk through the range you received?" body="Send the quote through and we can help you sort the right scope, material tier, and next step." />
    </>
  );
}
