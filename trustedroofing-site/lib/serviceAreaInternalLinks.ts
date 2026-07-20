export type ServiceAreaLinkArea = {
  slug: string;
  neighborhood: string;
  city: string;
};

type ServiceAreaCardDefinition = {
  title: string;
  href: string;
  body: (area: ServiceAreaLinkArea) => string;
  variants: string[];
  nonCalgaryVariants?: string[];
};

export type ServiceAreaInternalLinkCard = {
  title: string;
  href: string;
  body: string;
  anchor: string;
};

function stableHash(value: string) {
  return Array.from(value).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  );
}

export function formatAnchor(template: string, area: ServiceAreaLinkArea) {
  return template
    .replaceAll("{areaName}", area.neighborhood)
    .replaceAll("{city}", area.city);
}

export function pickAnchor(
  variants: string[],
  areaSlug: string,
  offset: number,
) {
  return variants[(stableHash(areaSlug) + offset) % variants.length];
}

const serviceAreaCards: ServiceAreaCardDefinition[] = [
  {
    title: "Calgary Roofing Company",
    href: "/",
    body: (area) =>
      `Review Trusted Roofing & Exteriors' roofing approach, exterior services, and local planning support for ${area.neighborhood} homes.`,
    variants: [
      "roofing companies Calgary",
      "Calgary roofing companies",
      "roofing company in Calgary",
      "Calgary roofing company",
      "roofing contractors Calgary",
      "roofing contractor Calgary",
      "roofing company serving {areaName}",
      "local roofing contractor",
      "Calgary roofers",
    ],
    nonCalgaryVariants: [
      "Calgary roofing company serving {city}",
      "roofing contractor serving {city}",
      "roofing company near {city}",
    ],
  },
  {
    title: "Roofing Services",
    href: "/services/roofing",
    body: (area) =>
      `Compare roofing service options, residential roofing scopes, and local roof planning details for ${area.neighborhood} homes.`,
    variants: [
      "roofing services in {areaName}",
      "residential roofing in {areaName}",
      "Calgary roofing services",
      "residential roofing Calgary",
      "Calgary roofing options",
      "roofing services for {areaName} homes",
    ],
    nonCalgaryVariants: [
      "roofing services serving {city}",
      "residential roofing near {city}",
      "Calgary roofing services serving {city}",
    ],
  },
  {
    title: "Instant Roof Quote",
    href: "/online-estimate",
    body: (area) =>
      `Start with address-based pricing guidance before scheduling a detailed roof or exterior review in ${area.neighborhood}.`,
    variants: [
      "instant roof quote in {areaName}",
      "online roof estimate for {areaName}",
      "start an instant roof quote",
      "instant Calgary roofing estimate",
      "instant exterior estimate",
    ],
  },
  {
    title: "Roof Replacement",
    href: "/services/roof-replacement",
    body: (area) =>
      `Compare replacement scope, shingle options, ventilation details, and planning steps for ${area.neighborhood} roofs.`,
    variants: [
      "roof replacement in {areaName}",
      "residential roof replacement options",
      "Calgary roof replacement service",
      "asphalt shingle replacement",
      "roof replacement estimate for {areaName}",
    ],
  },
  {
    title: "Roof Repair",
    href: "/services/roof-repair",
    body: (area) =>
      `Look at practical repair paths for leaks, missing shingles, wind damage, and localized roof issues in ${area.neighborhood}.`,
    variants: [
      "roof repair in {areaName}",
      "Calgary roof repair options",
      "targeted roof repair",
      "storm damage roof repair",
      "roof leak repair options",
    ],
  },
  {
    title: "Roof Inspection & Maintenance",
    href: "/services/roof-inspection-maintenance",
    body: (area) =>
      `Plan condition checks, seasonal maintenance, and hail or wind follow-up for homes around ${area.neighborhood}.`,
    variants: [
      "roof inspection in {areaName}",
      "roof maintenance in Calgary",
      "roof condition assessment",
      "hail damage roof inspection",
      "seasonal roof maintenance",
    ],
  },
  {
    title: "Siding Services",
    href: "/services/siding",
    body: (area) =>
      `Explore siding replacement, exterior envelope planning, and curb appeal upgrades suited to ${area.neighborhood} homes.`,
    variants: [
      "siding contractor in Calgary",
      "siding services in {areaName}",
      "exterior siding options",
      "siding replacement options",
      "Calgary siding contractor",
    ],
  },
  {
    title: "Vinyl Siding",
    href: "/services/vinyl-siding",
    body: (area) =>
      `Compare vinyl siding materials, trim details, and budget-friendly exterior refresh options for ${area.neighborhood}.`,
    variants: [
      "vinyl siding in {areaName}",
      "vinyl siding replacement options",
      "vinyl siding estimate for {areaName}",
      "Calgary vinyl siding service",
      "compare vinyl siding options",
    ],
  },
  {
    title: "James Hardie Siding",
    href: "/services/james-hardie-siding",
    body: (area) =>
      `Compare fiber cement siding, trim details, and exterior upgrade scope for homes in ${area.neighborhood}.`,
    variants: [
      "James Hardie siding in {areaName}",
      "James Hardie installer serving {areaName}",
      "fiber cement siding installation in {areaName}",
      "Hardie siding contractor serving {areaName}",
      "James Hardie siding options for {areaName} homes",
    ],
  },
  {
    title: "Eavestrough Replacement",
    href: "/services/eavestrough",
    body: (area) =>
      `Review gutter replacement, downspout placement, and drainage routing considerations for ${area.neighborhood} properties.`,
    variants: [
      "eavestrough replacement in {areaName}",
      "Calgary eavestrough service",
      "gutter replacement options",
      "downspout and drainage options",
      "exterior drainage upgrades",
    ],
  },
  {
    title: "Soffit & Fascia",
    href: "/services/soffit-fascia",
    body: (area) =>
      `Plan roofline finishing, ventilation support, and fascia replacement details for ${area.neighborhood} homes.`,
    variants: [
      "soffit and fascia in {areaName}",
      "Calgary soffit and fascia service",
      "fascia replacement options",
      "soffit replacement options",
      "roofline exterior upgrades",
    ],
  },
];

export function getServiceAreaInternalLinkCards(
  area: ServiceAreaLinkArea,
): ServiceAreaInternalLinkCard[] {
  return serviceAreaCards.map((card, index) => {
    const variants =
      area.city === "Calgary" || !card.nonCalgaryVariants
        ? card.variants
        : card.nonCalgaryVariants;

    return {
      title: card.title,
      href: card.href,
      body: card.body(area),
      anchor: formatAnchor(pickAnchor(variants, area.slug, index), area),
    };
  });
}
