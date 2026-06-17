import Link from "next/link";
import QuoteArchiveHashHandler from "@/components/QuoteArchiveHashHandler";
import QuoteExplorerFilters from "@/components/QuoteExplorerFilters";
import QuoteCard from "@/components/QuoteCard";
import CtaBand from "@/components/ui/CtaBand";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import { buildMetadata, canonicalUrl } from "@/lib/seo";
import { getAllQuoteNeighborhoods, getQuoteArchiveByMaterial } from "@/lib/seo-engine";

export const metadata = buildMetadata({
  title: "Calgary Roofing Quotes & Exterior Estimate Examples",
  description: "Browse recent Calgary roofing, siding, Hardie siding, and eavestrough estimate examples, then start your own instant quote.",
  path: "/quotes"
});

export const dynamic = "force-dynamic";

function buildArchiveSchema(cards: Awaited<ReturnType<typeof getQuoteArchiveByMaterial>>[number]["cards"], neighborhoodGeoByKey: Record<string, { lat: number; lng: number }>) {
  const pricedCards = cards.filter((card) => typeof card.estimateLow === "number" || typeof card.estimateHigh === "number");
  const allLowPrices = pricedCards.flatMap((card) => typeof card.estimateLow === "number" ? [card.estimateLow] : []);
  const allHighPrices = pricedCards.flatMap((card) => typeof card.estimateHigh === "number" ? [card.estimateHigh] : []);
  const pageLowPrice = allLowPrices.length ? Math.min(...allLowPrices) : undefined;
  const pageHighPrice = allHighPrices.length ? Math.max(...allHighPrices) : undefined;

  const serviceTypeForMaterial = (material: string) => {
    switch (material) {
      case "Roofing":
        return "Roofing replacement";
      case "Vinyl siding":
        return "Vinyl siding installation";
      case "Hardie siding":
        return "Fiber cement siding installation";
      case "Eavestrough":
        return "Eavestrough replacement";
      default:
        return "Exterior renovation estimate";
    }
  };

  const buildAreaServed = (card: Awaited<ReturnType<typeof getQuoteArchiveByMaterial>>[number]["cards"][number]) => {
    const key = `${card.city}|${card.locality}`;
    const geo = card.locationKind === "neighborhood" ? neighborhoodGeoByKey[key] : undefined;
    return {
      "@type": card.locationKind === "city" ? "City" : "AdministrativeArea",
      name: card.locationKind === "city" ? card.city : card.locationLabel,
      ...(geo ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: Number(geo.lat.toFixed(3)),
          longitude: Number(geo.lng.toFixed(3))
        }
      } : {})
    };
  };

  const buildItemOffer = (card: Awaited<ReturnType<typeof getQuoteArchiveByMaterial>>[number]["cards"][number]) => {
    const lowPrice = typeof card.estimateLow === "number" ? card.estimateLow : undefined;
    const highPrice = typeof card.estimateHigh === "number" ? card.estimateHigh : undefined;

    if (typeof lowPrice === "number" && typeof highPrice === "number") {
      return {
        "@type": "AggregateOffer",
        lowPrice,
        highPrice,
        priceCurrency: "CAD",
        offerCount: 1,
        availability: "https://schema.org/InStock",
        description: card.description
      };
    }

    if (typeof lowPrice === "number" || typeof highPrice === "number") {
      return {
        "@type": "Offer",
        price: lowPrice ?? highPrice,
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
        description: card.description
      };
    }

    return {
      "@type": "Offer",
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      description: card.description
    };
  };

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Calgary Roofing Quotes & Exterior Estimate Examples",
    url: canonicalUrl("/quotes"),
    description:
      "Recent Calgary roofing, siding, James Hardie siding, and eavestrough estimate examples generated through the Trusted Roofing instant estimate system.",
    about: {
      "@type": "Service",
      name: "Calgary roofing and exterior estimate examples",
      serviceType: "Instant roofing, siding, and eavestrough estimate examples",
      areaServed: {
        "@type": "City",
        name: "Calgary"
      },
      offers: pageLowPrice !== undefined || pageHighPrice !== undefined
        ? {
          "@type": "AggregateOffer",
          lowPrice: pageLowPrice,
          highPrice: pageHighPrice,
          priceCurrency: "CAD",
          offerCount: pricedCards.length
        }
        : undefined
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Recent Calgary roofing and exterior estimate examples",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: cards.length,
      itemListElement: cards.slice(0, 100).map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          name: card.title,
          url: `${canonicalUrl("/quotes")}#${card.slug}`,
          description: card.description,
          serviceType: serviceTypeForMaterial(card.material),
          areaServed: buildAreaServed(card),
          offers: buildItemOffer(card)
        }
      }))
    }
  };
}

function serviceParamForMaterialSlug(materialSlug: string) {
  switch (materialSlug) {
    case "roofing":
      return "roofing";
    case "hardie-siding":
      return "james-hardie";
    case "eavestrough":
      return "eavestrough";
    case "vinyl-siding":
      return "siding";
    default:
      return materialSlug;
  }
}

function slugifyFilterValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildAggregateFilterHref(materialSlug: string, type: "city" | "city-quadrant" | "neighborhood", key: string) {
  const params = new URLSearchParams({ service: serviceParamForMaterialSlug(materialSlug) });

  if (type === "city") {
    params.set("city", slugifyFilterValue(key));
  } else if (type === "city-quadrant") {
    const [city, quadrant] = key.split("|");
    if (city) params.set("city", slugifyFilterValue(city));
    if (quadrant) params.set("quadrant", slugifyFilterValue(quadrant));
  } else {
    const [, locality] = key.split("|");
    params.set("area", slugifyFilterValue(locality || key));
  }

  return `/quotes?${params.toString()}`;
}

function renderAggregateSection(
  title: string,
  type: "city" | "city-quadrant" | "neighborhood",
  materialSlug: string,
  items: Array<{ key: string; title: string; quoteCount: number; averageLow: number | null; averageHigh: number | null }>
) {
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 22 }} id={`${materialSlug}-${type}`}>
      <h3 className="homev3-title" style={{ fontSize: "1.5rem" }}>{title}</h3>
      <div className="quote-card-grid" style={{ marginTop: 16 }}>
        {items.map((item) => {
          const filterHref = buildAggregateFilterHref(materialSlug, type, item.key);

          return (
            <article key={item.key} className="ui-card quote-aggregate-card">
              <h4>{item.title}</h4>
              <p className="homev3-copy">
                {item.quoteCount.toLocaleString()} quote example{item.quoteCount === 1 ? "" : "s"} · recent modeled range
              </p>
              <p className="quote-aggregate-card__range">
                {item.averageLow ? `$${item.averageLow.toLocaleString()}` : "N/A"} - {item.averageHigh ? `$${item.averageHigh.toLocaleString()}` : "N/A"}
              </p>
              <Link
                href={filterHref}
                className="quote-aggregate-card__jump"
              >
                View matching quote examples
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default async function QuotesArchivePage() {
  const sections = await getQuoteArchiveByMaterial();
  const cards = sections.flatMap((section) => section.cards);
  const cityCount = new Set(cards.map((card) => card.city)).size;
  const areaOptions = Array.from(new Map(cards.map((card) => [card.locality.toLowerCase().replace(/[^a-z0-9]+/g, "-"), card.locationLabel])).entries()).sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));

  const neighborhoods = await getAllQuoteNeighborhoods();
  const neighborhoodGeoByKey = neighborhoods.reduce<Record<string, { lat: number; lng: number }>>((acc, item) => {
    if (typeof item.centroidLat !== "number" || typeof item.centroidLng !== "number") return acc;
    acc[`${item.city}|${item.neighborhood}`] = { lat: item.centroidLat, lng: item.centroidLng };
    return acc;
  }, {});

  const schema = buildArchiveSchema(cards, neighborhoodGeoByKey);
  const lastUpdated = cards[0]?.queriedAt
    ? new Date(cards[0].queriedAt).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    : null;

  const quickNavItems = sections.map((section) => ({
    label: section.material,
    anchor: `material-${section.material.toLowerCase().replace(/\s+/g, "-")}`
  }));

  return (
    <>
      <QuoteArchiveHashHandler />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHero
        eyebrow="Calgary roofing quote examples"
        title="Calgary Roofing Quotes & Exterior Estimate Examples"
        description="Browse recent roofing, siding, Hardie siding, and eavestrough estimate examples from Calgary-area homes, then start your own instant online quote when you are ready."
        actions={<>
          <Link className="ui-button ui-button--primary" href="/online-estimate">Start your instant quote</Link>
          <Link className="ui-button ui-button--secondary" href="/services/roofing">View roofing services</Link>
        </>}
      />

      <section className="ui-page-section">
        <PageContainer>
          <div className="quote-card-grid">
            <article className="ui-card">
              <h2>Total quote examples</h2>
              <p className="homev3-copy">{cards.length.toLocaleString()} recent address-level modeled estimate examples are available on this page.</p>
            </article>
            <article className="ui-card">
              <h2>Estimate types</h2>
              <p className="homev3-copy">{sections.length.toLocaleString()} estimate categories are separated on this page so roofing, vinyl, Hardie, and eavestrough pricing are not blended together.</p>
            </article>
            <article className="ui-card">
              <h2>Cities covered</h2>
              <p className="homev3-copy">{cityCount.toLocaleString()} live city-level groupings are currently represented in these estimate examples.</p>
            </article>
            <article className="ui-card">
              <h2>Latest update</h2>
              <p className="homev3-copy">{lastUpdated ?? "Live updates appear here as new quotes are generated."}</p>
            </article>
          </div>

          <QuoteExplorerFilters areas={areaOptions} totalCount={cards.length} />

          <h2 className="homev3-title quote-results-title">Recent Calgary estimate examples</h2>

          <section className="quote-quick-nav" aria-label="Quote examples quick navigation">
            <h2 className="homev3-title" style={{ fontSize: "1.6rem" }}>Jump to the quote section you need</h2>
            <p className="homev3-copy">Use these links to skip directly to material groups and summary blocks instead of long scrolling.</p>
            <div className="quote-quick-nav__chips">
              {quickNavItems.map((item) => (
                <Link key={item.anchor} href={`/quotes#${item.anchor}`} className="quote-quick-nav__chip">#{item.label}</Link>
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section
              key={section.material}
              style={{ marginTop: 32 }}
              id={`material-${section.material.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <h2 className="homev3-title" style={{ fontSize: "2rem" }}>{section.material} estimate examples</h2>
              <p className="homev3-copy" style={{ marginTop: 10 }}>
                {section.cards.length.toLocaleString()} published {section.material.toLowerCase()} quote example{section.cards.length === 1 ? "" : "s"} are included in this section.
              </p>
              <div className="quote-quick-nav__chips" style={{ marginTop: 14 }}>
                <Link href={`/quotes#material-${section.material.toLowerCase().replace(/\s+/g, "-")}-city`} className="quote-quick-nav__chip">#city-level</Link>
                <Link href={`/quotes#material-${section.material.toLowerCase().replace(/\s+/g, "-")}-city-quadrant`} className="quote-quick-nav__chip">#city-quadrant</Link>
                <Link href={`/quotes#material-${section.material.toLowerCase().replace(/\s+/g, "-")}-neighborhood`} className="quote-quick-nav__chip">#neighborhood</Link>
              </div>

              {renderAggregateSection("City level", "city", section.material.toLowerCase().replace(/\s+/g, "-"), section.aggregates.cities.slice(0, 12))}
              {renderAggregateSection("City + quadrant level", "city-quadrant", section.material.toLowerCase().replace(/\s+/g, "-"), section.aggregates.cityQuadrants.slice(0, 12))}
              {renderAggregateSection("Neighborhood level", "neighborhood", section.material.toLowerCase().replace(/\s+/g, "-"), section.aggregates.neighborhoods)}

              <div style={{ marginTop: 24 }} id={`material-${section.material.toLowerCase().replace(/\s+/g, "-")}-cards`}>
                <h3 className="homev3-title" style={{ fontSize: "1.5rem" }}>Published {section.material.toLowerCase()} quote examples</h3>
                <p className="quote-filter-status" data-quote-filter-status={section.material.toLowerCase().replace(/\s+/g, "-")} hidden />
                <div className="quote-card-grid" style={{ marginTop: 16 }}>
                  {section.cards.map((card) => (
                    <div
                      key={card.slug}
                      id={card.slug}
                      className="quote-card-anchor"
                      data-quote-material={section.material.toLowerCase().replace(/\s+/g, "-")}
                      data-quote-service={section.material === "Roofing" ? "roofing" : section.material === "Hardie siding" ? "james-hardie" : section.material === "Eavestrough" ? "eavestrough" : "siding"}
                      data-quote-area={card.locality.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      data-quote-search={`${card.title} ${card.description} ${card.material} ${card.city} ${card.locality} ${card.locationLabel}`.toLowerCase()}
                      data-quote-city={card.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      data-quote-quadrant={(card.quadrant ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      data-quote-neighborhood-key={`${card.city}|${card.locality}`}
                    >
                      <span id={`quote-${card.id}`} />
                      <QuoteCard quote={card} href={null} variant="full" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          <div style={{ marginTop: 28 }}>
            <p className="homev3-copy">
              These quote examples keep recent Calgary estimate activity in one crawlable location while the instant estimator continues to live at <Link href="/online-estimate">/online-estimate</Link>.
            </p>
          </div>
        </PageContainer>
      </section>

      <CtaBand
        title="Need your own instant price range?"
        body="Use the anonymous estimator to generate a new local quote, then browse recent quote activity to compare nearby examples."
      />
    </>
  );
}
