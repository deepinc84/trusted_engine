import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CtaBand from "@/components/ui/CtaBand";
import FaqAccordion from "@/components/FaqAccordion";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ServiceGeoPosts from "@/components/ServiceGeoPosts";
import { listGeoPosts } from "@/lib/db";
import { buildMetadata, canonicalUrl } from "@/lib/seo";
import { ORGANIZATION_ID } from "@/lib/organization";

export const metadata = buildMetadata({
  title: "James Hardie Installer Calgary | Fiber Cement Siding",
  description:
    "James Hardie siding installation in Calgary for homeowners comparing fiber cement siding, vinyl siding, exterior upgrades, and instant online estimates.",
  path: "/services/james-hardie-siding"
});

const serviceAreas = ["Calgary", "Airdrie", "Chestermere", "Cochrane", "Okotoks", "Rocky View County"] as const;

const hardieFaqItems = [
  {
    question: "Is James Hardie siding the same as fiber cement siding?",
    answer:
      "James Hardie is a well-known brand of fiber cement siding. Homeowners often use the names together when comparing Hardie siding options with vinyl siding."
  },
  {
    question: "Is James Hardie siding good for Calgary weather?",
    answer:
      "It can be a strong option for Calgary homes when the wall assembly, fastening, clearances, trim, and flashing details are planned correctly for hail exposure, wind, and freeze-thaw cycles."
  },
  {
    question: "Is James Hardie more expensive than vinyl siding?",
    answer:
      "Usually, yes. Fiber cement siding typically costs more than vinyl because the material is heavier and the installation details take more labour."
  },
  {
    question: "What affects James Hardie siding installation cost?",
    answer:
      "Wall area, stories, access, old siding removal, substrate condition, trim details, window and door transitions, flashing, disposal, and material profile all affect the estimate."
  },
  {
    question: "Can I compare James Hardie and vinyl siding before booking a site visit?",
    answer:
      "Yes. You can start an instant exterior estimate and compare James Hardie siding installation with vinyl siding before deciding whether to request a detailed site visit."
  },
  {
    question: "Do soffit, fascia, and eavestrough details matter during siding replacement?",
    answer:
      "Yes. Siding transitions near soffit, fascia, eavestrough, rooflines, windows, doors, and wall penetrations can affect drainage, trim planning, and final scope."
  },
  {
    question: "Can damaged James Hardie siding be repaired instead of replaced?",
    answer:
      "Sometimes. A localized repair depends on the condition behind the damaged area, access, the availability of a compatible profile and colour, and whether the flashing and clearances can be restored without disturbing a much larger section. Widespread damage or recurring moisture issues may make replacement the sounder scope."
  },
  {
    question: "What should I review in the James Hardie warranty information?",
    answer:
      "Review the current written warranty for the exact product, finish, and Canadian market. Confirm registration or documentation requirements, exclusions, maintenance responsibilities, and whether the proposed installation details follow the current manufacturer instructions. Product and finish coverage are not the same as an installer workmanship commitment."
  }
] as const;

function buildHardieSchema() {
  const serviceUrl = canonicalUrl("/services/james-hardie-siding");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${serviceUrl}#service`,
        name: "James Hardie Siding Installer Calgary",
        serviceType: "James Hardie siding installation and fiber cement siding installation",
        provider: { "@id": ORGANIZATION_ID },
        areaServed: serviceAreas.map((name) => ({ "@type": "Place", name })),
        url: serviceUrl
      },
      {
        "@type": "FAQPage",
        mainEntity: hardieFaqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      }
    ]
  };
}

export default async function JamesHardieSidingPage() {
  const geoPosts = await listGeoPosts(null, {
    serviceSlugs: ["siding", "james-hardie-siding", "hardie-board-siding"],
    includeKeywords: ["hardie", "fiber cement", "fibre cement"]
  });

  const heroImage = geoPosts.find((post) => post.primary_image_url)?.primary_image_url;
  const schema = buildHardieSchema();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "" },
          { name: "Services", path: "/services" },
          { name: "James Hardie Siding", path: "/services/james-hardie-siding" }
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        eyebrow="James Hardie installer Calgary"
        title="James Hardie Siding Installer in Calgary"
        description="Trusted Roofing & Exteriors helps Calgary homeowners compare James Hardie siding, fiber cement siding, vinyl siding, and exterior upgrade scopes before starting an instant online estimate."
        actions={
          <>
            <Link href="/online-estimate" className="button">Get instant exterior estimate</Link>
            <Link href="/services/siding" className="button button--ghost">Compare siding options</Link>
          </>
        }
        image={
          heroImage
            ? { src: heroImage, alt: "James Hardie siding installation project in Calgary", priority: true }
            : undefined
        }
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Why homeowners compare James Hardie siding in Calgary</h2>
              <p>Calgary homeowners often compare James Hardie siding because fiber cement siding can support a sharper exterior durability plan, stronger curb appeal, and lower-maintenance exterior planning compared with older siding options.</p>
              <p>Calgary hail exposure, wind exposure, freeze-thaw cycles, sun, and wind-driven moisture all make wall details important. Hardie siding is not damage-proof, but many homeowners compare it against <Link href="/services/vinyl-siding">vinyl siding</Link> when they want a heavier look and a different long-term exterior finish.</p>
            </article>

            <article className="ui-card">
              <h2>Choosing a James Hardie siding installer</h2>
              <p>A James Hardie installer should plan more than a simple cladding swap. Fiber cement siding requires proper planning, detailing, fastening, clearances, trim transitions, flashing coordination, and exterior moisture management.</p>
              <p>That makes a fiber cement siding installer different from a crew completing a basic vinyl siding swap. Homeowners should compare scope, wall details, trim, penetrations, transitions, and quote assumptions before choosing a siding contractor for fiber cement projects.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <article className="ui-card">
            <h2>James Hardie siding vs vinyl siding</h2>
            <p>Use this quick comparison with our broader <Link href="/services/siding">siding services</Link> page when deciding whether fiber cement or vinyl fits your home.</p>
            <div className="ui-grid ui-grid--services">
              <article className="ui-card">
                <h3>James Hardie / fiber cement</h3>
                <ul>
                  <li>Material type: heavier fiber cement cladding.</li>
                  <li>Appearance: stronger shadow lines and a more architectural finish.</li>
                  <li>Weather considerations: detail-sensitive around impact exposure, wind, moisture, and freeze-thaw movement.</li>
                  <li>Maintenance expectations: lower-maintenance planning than many older systems, but not maintenance-free.</li>
                  <li>Cost expectations: typically higher material and labour cost.</li>
                  <li>May make sense when appearance, trim depth, and exterior redesign value justify the added scope.</li>
                </ul>
              </article>
              <article className="ui-card">
                <h3>Vinyl siding</h3>
                <ul>
                  <li>Material type: lightweight vinyl cladding with multiple profiles.</li>
                  <li>Appearance: clean, practical finish with standard and premium options.</li>
                  <li>Weather considerations: movement, fastening, trim, and flashing details still matter.</li>
                  <li>Maintenance expectations: practical upkeep for many homes, with repairs depending on age and matching material.</li>
                  <li>Cost expectations: often the more budget-controlled path.</li>
                  <li>Vinyl makes sense when the goal is a clean exterior upgrade without the heavier fiber cement scope.</li>
                </ul>
              </article>
            </div>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>How a fiber cement siding project is planned</h2>
            <p>A useful scope starts elevation by elevation rather than treating the house as one wall-area number. The review should identify the existing cladding, wall penetrations, windows and doors, inside and outside corners, roof-to-wall areas, deck attachments, utility equipment, and the soffit line. Those details determine where work can be staged and which connected components need to be removed or protected.</p>
            <ol>
              <li><strong>Inspect and measure.</strong> Confirm wall areas, access, existing layers, visible substrate concerns, trim widths, and every transition that affects the cladding layout.</li>
              <li><strong>Define the assembly.</strong> Select the siding profile and trim approach, then document removal, water-resistive layer, flashing, ventilation openings, penetrations, and disposal in the scope.</li>
              <li><strong>Prepare the walls.</strong> Remove the agreed materials and assess exposed conditions before covering them. Damaged sheathing or an unresolved water path changes the work and should be addressed first.</li>
              <li><strong>Install and coordinate.</strong> Lay out courses and joints, use the specified fasteners, maintain the clearances required for the selected product, and integrate flashings and trim as the work progresses.</li>
              <li><strong>Review the finished exterior.</strong> Check transitions, penetrations, caulked locations, drainage exits, cleanup, and the areas where siding meets roofing, soffit, fascia, decks, or grade.</li>
            </ol>
            <p>Exact fastening, joint treatment, flashing, and clearance requirements depend on the selected James Hardie product and the current Canadian installation instructions. They should be confirmed for the project rather than copied from an older detail or a different product zone.</p>
          </article>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Repair, partial replacement, or full recladding?</h2>
              <p>A small impact area may be repairable when the surrounding courses are sound and a compatible replacement can be integrated correctly. A partial elevation can make sense when damage is contained and the termination can be detailed cleanly. Full recladding becomes more practical when failures are widespread, the existing material cannot be matched, multiple elevations need wall repairs, or a homeowner wants to change the complete trim and water-management approach.</p>
              <p>Before deciding, inspect what caused the visible problem. Replacing a cracked board does not correct missing flashing, poor clearance, a leaking penetration, or deteriorated sheathing behind it.</p>
            </article>
            <article className="ui-card">
              <h2>Failure points worth resolving before new siding</h2>
              <ul>
                <li>Window, door, deck, and roof-to-wall transitions that do not direct water back to the drainage plane</li>
                <li>Courses installed too close to roofing, grade, flatwork, or other surfaces where moisture and debris collect</li>
                <li>Fasteners, joints, or cut edges handled differently from the selected system requirements</li>
                <li>Uneven or damaged substrate hidden behind the old cladding</li>
                <li>Penetrations and fixtures treated as caulking-only details instead of planned transitions</li>
                <li>New siding sequenced without coordinating soffit, fascia, eavestrough, roofing, or attached structures</li>
              </ul>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>Maintenance and warranty planning</h2>
              <p>Fiber cement is a durable cladding choice, but the exterior still needs periodic observation. Watch for physical damage, open joints, failed sealant where sealant is specified, blocked drainage locations, and changes around penetrations or connected rooflines. Keep eavestrough and downspout discharge from repeatedly wetting the wall, and deal with a leak source before refinishing the visible surface.</p>
              <p>Warranty terms vary by product and finish and can change. Use the current written manufacturer documents for the selected material, keep the final scope and product records, and separate manufacturer product coverage from any installer workmanship terms presented in the proposal.</p>
            </article>
            <article className="ui-card">
              <h2>Two ways to start</h2>
              <p>If you are comparing broad budget ranges, use the <Link href="/online-estimate">instant exterior estimate</Link>. If you have damage, unusual wall transitions, or do not know whether repair or replacement fits, request a conversation by phone so the next step can be matched to the condition.</p>
              <p>
                <Link href="/online-estimate" className="button">Estimate siding options</Link>{" "}
                <a href="tel:5872883351" className="button button--ghost">Call 587-288-3351</a>
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>What affects a James Hardie siding estimate in Calgary?</h2>
              <p>James Hardie siding installation pricing depends on the actual wall system, access, and finish package. An instant estimate helps organize the starting scope before a detailed review.</p>
              <ul>
                <li>Wall square footage and number of elevations</li>
                <li>Stories, access, disposal, and site access</li>
                <li>Removal of existing siding and substrate condition</li>
                <li>Trim and batten details, including board-and-batten style where appropriate</li>
                <li>Window and door transitions, penetrations, and vents</li>
                <li>Flashing and drainage details</li>
                <li>Soffit, fascia, and eavestrough tie-ins</li>
                <li>Material, colour, and profile choice</li>
              </ul>
              <Link href="/online-estimate" className="button">Start instant exterior estimate</Link>
            </article>

            <article className="ui-card">
              <h2>Exterior details to review with fiber cement siding</h2>
              <p>Hardie siding options should be reviewed with trim details, batten or board-and-batten style, window and door transitions, wall penetrations, flashing details, and roofline exterior tie-ins.</p>
              <p>It is also smart to coordinate <Link href="/services/eavestrough">eavestrough</Link>, <Link href="/services/soffit-fascia">soffit and fascia</Link>, and combined <Link href="/services/eavestrough-soffit-fascia">eavestrough, soffit, and fascia</Link> work when those details connect to the siding replacement area.</p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section ui-page-section--soft">
        <PageContainer>
          <div className="ui-detail-grid">
            <article className="ui-card">
              <h2>James Hardie siding for Calgary-area homes</h2>
              <p>Trusted Roofing & Exteriors helps homeowners compare James Hardie siding and fiber cement siding scopes across Calgary and surrounding communities.</p>
              <p>We support exterior planning for Calgary, Airdrie, Chestermere, Cochrane, Okotoks, and Rocky View County homes. You can also review broader <Link href="/service-areas">service areas</Link> before starting your estimate.</p>
            </article>

            <article className="ui-card">
              <h2>Recent siding activity</h2>
              <p>Review real siding project updates where available, then use the instant exterior estimate to compare your own scope without inventing a final price before details are reviewed.</p>
              <p>
                <Link href="/projects?service_slug=siding#remaining-projects" className="button button--ghost">View siding projects</Link>{" "}
                <Link href="/online-estimate" className="button">Start your exterior estimate</Link>
              </p>
            </article>
          </div>
        </PageContainer>
      </section>

      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <h2>Frequently asked questions</h2>
            <FaqAccordion items={hardieFaqItems} />
          </article>
        </PageContainer>
      </section>

      <CtaBand
        title="Compare James Hardie and vinyl siding pricing"
        body="Start with an instant siding estimate, then compare whether James Hardie siding installation, fiber cement siding, or vinyl siding makes more sense for the project."
        primaryLabel="Get instant exterior estimate"
      />
      <ServiceGeoPosts geoPosts={geoPosts} heading="Recent James Hardie siding projects in Calgary" />
    </>
  );
}
