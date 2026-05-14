"use client";

import { useEffect } from "react";

type QuoteAggregateFilter = {
  materialSlug: string;
  type: "city" | "city-quadrant" | "neighborhood";
  key: string;
};

const FILTER_PREFIX = "filter--";

function parseAggregateFilter(rawHash: string): QuoteAggregateFilter | null {
  const hash = rawHash.replace(/^#/, "").trim();
  if (!hash.startsWith(FILTER_PREFIX)) return null;

  const [, encodedMaterialSlug, type, encodedKey] = hash.split("--");
  if (!encodedMaterialSlug || !encodedKey) return null;
  if (type !== "city" && type !== "city-quadrant" && type !== "neighborhood") return null;

  try {
    return {
      materialSlug: decodeURIComponent(encodedMaterialSlug),
      type,
      key: decodeURIComponent(encodedKey),
    };
  } catch {
    return null;
  }
}

function getFilterLabel(hash: string, fallback: string) {
  const filterLink = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-quote-filter-hash]")).find(
    (link) => link.dataset.quoteFilterHash === hash,
  );

  return filterLink?.dataset.quoteFilterLabel ?? fallback;
}

function clearAggregateFilters() {
  document.querySelectorAll<HTMLElement>(".quote-card-anchor[data-quote-material]").forEach((card) => {
    card.classList.remove("quote-card-anchor--hidden");
  });

  document.querySelectorAll<HTMLElement>("[data-quote-filter-status]").forEach((status) => {
    status.hidden = true;
    status.textContent = "";
  });
}

function cardMatchesFilter(card: HTMLElement, filter: QuoteAggregateFilter) {
  if (card.dataset.quoteMaterial !== filter.materialSlug) return false;

  switch (filter.type) {
    case "city":
      return card.dataset.quoteCity === filter.key;
    case "city-quadrant":
      return `${card.dataset.quoteCity}|${card.dataset.quoteQuadrant}` === filter.key;
    case "neighborhood":
      return card.dataset.quoteNeighborhoodKey === filter.key;
  }
}

function applyAggregateFilter(rawHash: string, filter: QuoteAggregateFilter) {
  const normalizedHash = rawHash.replace(/^#/, "").trim();
  const label = getFilterLabel(normalizedHash, filter.key.replace("|", " "));
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".quote-card-anchor[data-quote-material]"));
  const matchingCards: HTMLElement[] = [];

  for (const card of cards) {
    const isMatch = cardMatchesFilter(card, filter);
    card.classList.toggle("quote-card-anchor--hidden", !isMatch);
    if (isMatch) matchingCards.push(card);
  }

  document.querySelectorAll<HTMLElement>("[data-quote-filter-status]").forEach((status) => {
    const isCurrentMaterial = status.dataset.quoteFilterStatus === filter.materialSlug;
    status.hidden = !isCurrentMaterial;
    status.textContent = isCurrentMaterial
      ? `Showing ${matchingCards.length.toLocaleString()} ${label} published quote card${matchingCards.length === 1 ? "" : "s"}. Choose another summary card to change the filter.`
      : "";
  });

  const sectionTarget = document.getElementById(`material-${filter.materialSlug}-cards`);
  sectionTarget?.scrollIntoView({ behavior: "smooth", block: "start" });

  const firstVisibleCard = matchingCards[0]?.querySelector<HTMLElement>(".quote-card");
  firstVisibleCard?.classList.add("quote-card--flash");
  window.setTimeout(() => firstVisibleCard?.classList.remove("quote-card--flash"), 1800);
}

function focusHashTarget(rawHash: string) {
  const hash = rawHash.replace(/^#/, "").trim();
  if (!hash) {
    clearAggregateFilters();
    return;
  }

  const aggregateFilter = parseAggregateFilter(rawHash);
  if (aggregateFilter) {
    applyAggregateFilter(rawHash, aggregateFilter);
    return;
  }

  clearAggregateFilters();

  const target = document.getElementById(`quote-${hash}`) ?? document.getElementById(hash);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  const flashTarget = target.classList.contains("quote-card")
    ? target
    : target.closest(".quote-card");
  flashTarget?.classList.add("quote-card--flash");
  window.setTimeout(() => flashTarget?.classList.remove("quote-card--flash"), 1800);
}

export default function QuoteArchiveHashHandler() {
  useEffect(() => {
    focusHashTarget(window.location.hash);
    const handle = () => focusHashTarget(window.location.hash);
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  return null;
}
