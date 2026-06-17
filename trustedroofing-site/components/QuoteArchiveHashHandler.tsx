"use client";

import { useEffect } from "react";

function focusHashTarget(rawHash: string) {
  const hash = rawHash.replace(/^#/, "").trim();
  if (!hash || hash.startsWith("filter--")) return;

  const target = document.getElementById(hash) ?? document.getElementById(`quote-${hash}`);
  if (!target) return;

  const cardAnchor = target.classList.contains("quote-card-anchor")
    ? target
    : target.closest<HTMLElement>(".quote-card-anchor");
  cardAnchor?.classList.remove("quote-card-anchor--hidden");

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  const highlightTarget = target.classList.contains("quote-card")
    ? target
    : target.closest(".quote-card");
  highlightTarget?.classList.add("quote-card--highlighted");
  window.setTimeout(() => highlightTarget?.classList.remove("quote-card--highlighted"), 4000);
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
