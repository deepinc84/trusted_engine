"use client";

import { useEffect } from "react";

function focusHashTarget(rawHash: string) {
  const hash = rawHash.replace(/^#/, "").trim();
  if (!hash) return;

  const target = document.getElementById(`quote-${hash}`) ?? document.getElementById(hash);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("quote-card--flash");
  window.setTimeout(() => target.classList.remove("quote-card--flash"), 1800);
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
