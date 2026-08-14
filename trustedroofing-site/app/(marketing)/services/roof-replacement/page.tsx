import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import FaqAccordion from "@/components/FaqAccordion";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceSchema from "@/components/ServiceSchema";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import QuoteCard from "@/components/QuoteCard";
import { listGeoPosts } from "@/lib/db";
import { getAllQuoteCards } from "@/lib/seo-engine";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roof Replacement Calgary | Residential Reroofing",
  description: "Plan a Calgary residential roof replacement, compare asphalt and Euroshield systems, understand complete reroofing scope, and get an instant estimate.",
  path: "/services/roof-replacement"
});

const roofReplacementFaq = [
  {
    question: "How much does it cost to replace a roof in Calgary?",
    answer: "The price depends on the measured roof area, pitch, roof shape, valleys and edges, access, existing layers, tear-off, material system, ventilation, flashing, disposal and any deck repairs found after removal. Trusted's Instant Roof Estimate uses the property and measured roof to provide useful starting context before the final scope is confirmed."
  },
  {
    question: "Is $30,000 too much for a roof?",
    answer: "$30,000 cannot be judged without the roof and written scope. A large, steep or complex roof, multiple existing layers, difficult access, premium material, deck repairs, ventilation changes or extensive flashing can cost considerably more than a small, simple asphalt roof. Compare the same measured area, material system and included work, then use a property-specific estimate for context."
  },
  {
    question: "Who is the best roofing contractor in Calgary?",
    answer: "There is no contractor who is automatically best for every home. Compare the written scope, insurance and licensing requirements that apply, roofing system, workmanship coverage, documentation, communication, references and reviews, cleanup, and quote transparency. Trusted organizes estimates around the measured roof, selected system and documented scope so homeowners can compare what is actually included."
  },
  {
    question: "What is the cheapest time of year to get a new roof?",
    answer: "There is no dependable cheapest season. Material, labour, roof complexity, project scope and current market conditions usually matter more than the month. Ask about current scheduling, but do not assume a seasonal saving until it appears in a written quote."
  },
  {
    question: "How long does a roof replacement take?",
    answer: "Timing depends on roof size, pitch, complexity, access, material, weather and whether deck or flashing work is uncovered during tear-off. The schedule should be confirmed for the property after measurement and scope review rather than promised from a generic timeline."
  },
  {
    question: "When should asphalt shingles be replaced?",
    answer: "Condition matters more than a calendar age. Widespread curling, cracking or granule loss, recurring leaks, extensive hail damage, failing details, brittle shingles or compromised decking can point toward replacement. A localized defect on an otherwise serviceable roof may still be repairable."
  },
  {
    question: "Are Class 4 shingles worth considering in Calgary?",
    answer: "Class 4 impact-resistant options are worth comparing on homes with meaningful hail exposure, but they are not hail proof. Compare the product specification, complete installed system, added cost, appearance and how long you expect to own the home before choosing one."
  },
  {
    question: "Is Euroshield worth the extra cost compared with asphalt shingles?",
    answer: "It can be for an owner who values a recycled rubber system, impact performance and a longer ownership horizon enough to accept a higher initial installed cost. Architectural asphalt remains a practical, lower-entry-cost choice. The right comparison uses the same measured roof and confirmed scope, not a generic percentage markup."
  },
  {
    question: "Do you remove and dispose of the old roof?",
    answer: "A full replacement scope can include tear-off and disposal of the existing roofing, followed by a deck review before the new system is installed. Existing layers, unusual materials and site access must be confirmed because they affect the final scope and price."
  },
  {
    question: "Can I get a Calgary roof replacement estimate online?",
    answer: "Yes. Trusted's Instant Roof Estimate provides address-based starting pricing from the measured roof. Measurements, layers, access, material selection and site conditions still need confirmation before the replacement scope is finalized."
  }
] as const;

const completeScope = [
  "Removal and disposal of the existing roofing included in the written tear-off scope",
  "Inspection of the exposed roof deck and separately documented replacement where required",
  "Underlayment and ice protection selected for the assembly and applicable roof areas",
  "Valley, wall flashing, plumbing boot and other penetration details included in the confirmed scope",
  "Drip edge, rake edge, ventilation and other accessories where the roof design requires them",
  "Selected field roofing, starter, ridge cap and compatible system components",
  "Site cleanup and a final review of the completed roof system"
] as const;

function isRoofReplacementQuote(quote: Awaited<ReturnType<typeof getAllQuoteCards>>[number]) {
  const haystack = `${quote.material} ${quote.serviceType ?? ""} ${(quote.requestedScopes ?? []).join(" ")}`.toLowerCase();
  return (haystack.includes("roof") || haystack.includes("shingle")) && !haystack.includes("repair");
}

export default async function RoofReplacementPage() {
  const [geoPosts, quoteCards] = await Promise.all([
    listGeoPosts(null, {
      serviceSlugs: ["roofing", "roof-replacement", "shingles"],
      includeKeywords: ["replacement", "reroof", "re-roof", "shingle installation", "tear-off"]
    }),
    getAllQuoteCards()
  ]);
  const roofQuotes = quoteCards.filter(isRoofReplacementQuote).slice(0, 3);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: roofReplacementFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <>
      <ServiceSchema serviceName="Roof Replacement" serviceSlug="roof-replacement" serviceType="Residential roof replacement" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageHero
        eyebrow="Residential roof replacement Calgary"
        title="Calgary Roof Replacement for Aging Shingles, Hail and Full Reroofing"
        description="Compare complete roof replacement scope, asphalt and rubber roofing options, cost drivers and real local project work before confirming the right system for your home."
        actions={
          <>
            <Link href="/online-estimate" className="button">Get Instant Roof Estimate</Link>
            <Link href="#roofing-options" className="button button--ghost">Compare roofing options</Link>
          </>
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>When should a Calgary roof be replaced?</h2>
              <p>A roof should be replaced because its condition and overall economics support replacement, not simply because it has reached a generic age. Widespread curling, cracking or granule loss, recurring leaks, brittle shingles, significant hail damage, repeated repairs, broad flashing failures or compromised decking can make another patch poor value.</p>
              <p>An isolated defect on an otherwise serviceable roof may still be a good <Link href="/services/roof-repair">roof repair</Link> candidate. When deterioration affects several slopes or the underlying assembly, a complete replacement gives the contractor access to the deck and all connected roof details.</p>
            </article>
            <article className="ui-card">
              <h2>What is included in a complete roof replacement?</h2>
              <p>A complete reroof is a coordinated assembly, not only a shingle delivery. The final written scope depends on the existing roof, measurements and property conditions.</p>
              <ul>{completeScope.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft" id="roofing-options">
        <PageContainer>
          <article className="ui-card">
            <h2>Asphalt shingle roof replacement</h2>
            <p>Architectural asphalt shingles remain a practical residential choice because they balance initial cost, familiar appearance and broad product selection. Trusted's current estimating and roofing-system data supports GAF Timberline HDZ, Malarkey Vista and Malarkey Legacy starting systems, with other configured products reviewed when the project calls for them.</p>
            <p>Material selection should account for the roof pitch and shape, wind and hail exposure, colour and profile, budget and expected ownership horizon. Impact-resistant options, including products with Class 4 ratings where specified, can be compared for Calgary hail exposure. An impact rating is not a promise that a roof cannot be damaged.</p>
          </article>

          <article className="ui-card" style={{ marginTop: 18 }}>
            <h2>Architectural asphalt versus Euroshield rubber roofing</h2>
            <p>Trusted's product catalogue and estimating engine include Euroshield Beaumont, Ranchlands, Rundle and Vermont families. That allows Euroshield to be scoped as an offered roof system, but it should still be compared against asphalt on the same measured roof and confirmed details.</p>
            <div className="ui-detail-grid">
              <article className="ui-card">
                <h3>Architectural asphalt</h3>
                <ul>
                  <li>Usually the lower initial installed-cost path.</li>
                  <li>Available in standard and impact-resistant product options.</li>
                  <li>Familiar shingle appearance with several colour and system choices.</li>
                  <li>A practical fit when budget and near-term ownership value carry more weight.</li>
                  <li>Requires normal inspection and maintenance of shingles, flashings and penetrations.</li>
                </ul>
              </article>
              <article className="ui-card">
                <h3>Euroshield recycled rubber</h3>
                <ul>
                  <li>Higher material and product-specific installation cost in the current pricing engine.</li>
                  <li>Rubber profiles and impact-performance options suited to homeowners comparing hail resilience.</li>
                  <li>A different texture and appearance from architectural asphalt.</li>
                  <li>May fit a longer ownership horizon where added initial cost supports the owner's priorities.</li>
                  <li>Requires its specified components and installation details rather than an asphalt-only material swap.</li>
                </ul>
              </article>
            </div>
            <p><strong>Cost comparison:</strong> catalogue prices alone are not an installed-roof comparison. The engine includes different coverage, accessories and a product-specific Euroshield installation rider. For that reason, this page does not publish an invented percentage or sample price. Start with the <Link href="/online-estimate">same measured property</Link>, then have both complete systems confirmed for a useful apples-to-apples decision.</p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Roof replacement cost in Calgary</h2>
              <p>Measured area is the starting point, not the whole price. Trusted's estimator and production pricing account for roof squares, pitch, hips, ridges, valleys, eaves and rakes, wall flashing, penetrations, tear-off and additional layers, disposal, delivery and product-specific labour. Access, deck condition, ventilation and final site requirements are confirmed as the scope develops.</p>
              <p>Use the <Link href="/online-estimate">Instant Roof Estimate</Link> for property-specific starting context. For deeper cost research and examples, read the <Link href="/blog/how-much-does-a-roof-replacement-cost-in-calgary-2026">Calgary roof replacement cost guide</Link>. The guide explains pricing; this service page is where you compare and plan the replacement itself.</p>
            </article>
            <article className="ui-card">
              <h2>Is $30,000 too much for a roof?</h2>
              <p>Not enough information is contained in the number alone. A large, steep, cut-up roof with several layers, difficult access, premium material, ventilation changes, flashing work or damaged decking cannot be compared fairly with a small, simple asphalt roof.</p>
              <p>Ask each contractor to price the same measurements, material system and written inclusions. The estimator can provide address-based context before site conditions and the final scope are confirmed.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <h2>Repair, rejuvenation or replacement?</h2>
          <div className="ui-grid ui-grid--services">
            <article className="ui-card"><h3>Repair</h3><p>Repair makes sense when damage is isolated, surrounding shingles remain serviceable and the deck and connected details do not show broader failure. Review <Link href="/services/roof-repair">targeted roof repair options</Link>.</p></article>
            <article className="ui-card"><h3>Rejuvenate</h3><p>Rejuvenation may preserve qualifying asphalt shingles that remain flat, secured and structurally serviceable. It does not correct active leaks, failed flashing, missing shingles or damaged decking. See the approved <Link href="/services/roof-rejuvenation">roof rejuvenation qualification criteria</Link>.</p></article>
            <article className="ui-card"><h3>Replace</h3><p>Replacement makes more sense when deterioration or storm damage is widespread, repairs keep recurring, shingles are no longer serviceable or the deck and system details require broad access and correction.</p></article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Roof systems for Calgary exposure</h2>
              <p>Hail can damage the field shingles and roof accessories. Wind loads edges, ridges and exposed slopes. Strong UV and attic heat affect aging, while freeze-thaw and snow or ice test eaves, valleys and drainage details. Material rating matters, but so do fastening, underlayment, flashing and balanced attic ventilation.</p>
              <p>Impact-resistant shingles and Euroshield are options to compare, not damage-proof guarantees. The useful decision weighs impact performance, the full installed system, initial cost, appearance and how long the homeowner expects to keep the property.</p>
            </article>
            <article className="ui-card">
              <h2>Our roof replacement process</h2>
              <ol>
                <li>Start with an online estimate or property review.</li>
                <li>Confirm roof measurements, pitch, layers, access and detailed scope.</li>
                <li>Compare the roofing material and complete system components.</li>
                <li>Finalize the written scope, then schedule tear-off and installation.</li>
                <li>Complete cleanup and review the finished roof system and project documentation.</li>
              </ol>
            </article>
          </div>
        </PageContainer>
      </section>

      {roofQuotes.length > 0 ? (
        <section className="ui-page-section ui-page-section--soft">
          <PageContainer>
            <article className="ui-card">
              <h2>Recent roof replacement quote examples</h2>
              <p>These published quote cards provide scope context. Use your own measured property for a current estimate.</p>
              <div className="ui-grid ui-grid--services">
                {roofQuotes.map((quote) => <QuoteCard key={quote.id} quote={quote} variant="compact" />)}
              </div>
            </article>
          </PageContainer>
        </section>
      ) : null}

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Calgary roof replacement questions</h2>
            <FaqAccordion items={roofReplacementFaq} />
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>See completed roof replacement work</h2>
            <p>Review the location-backed project updates below for real photos and documented local scope, or browse the complete <Link href="/projects?service_slug=roof-replacement#remaining-projects">roof replacement project collection</Link>.</p>
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Ready to price a roof replacement?"
        body="Get an address-based starting estimate, then confirm measurements, layers, materials, ventilation, access and the complete written scope."
        primaryLabel="Get Instant Roof Estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Completed roof replacement projects in Calgary" />
    </>
  );
}
