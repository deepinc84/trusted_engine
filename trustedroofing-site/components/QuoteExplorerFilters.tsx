"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const services = [
  ["", "All"], ["roofing", "Roofing"], ["roof-repair", "Roof repair"], ["siding", "Siding"],
  ["james-hardie", "James Hardie"], ["eavestrough", "Eavestrough"]
] as const;

export default function QuoteExplorerFilters({ areas }: { areas: Array<{ value: string; label: string }> }) {
  const [service, setService] = useState("");
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [linkedOutsideFilters, setLinkedOutsideFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setService(params.get("service") ?? "");
    setArea(params.get("area") ?? "");
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".quote-card-anchor[data-quote-service]"));
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    let outside = false;
    let visible = 0;
    const query = search.trim().toLowerCase();

    cards.forEach((card) => {
      const matches = (!service || card.dataset.quoteService === service)
        && (!area || card.dataset.quoteArea === area)
        && (!query || card.dataset.quoteSearch?.includes(query));
      const isTarget = !!target && (card === target || card.contains(target));
      card.classList.toggle("quote-card-anchor--hidden", !matches && !isTarget);
      if (matches || isTarget) visible += 1;
      if (isTarget && !matches) outside = true;
    });
    setCount(visible);
    setLinkedOutsideFilters(outside);

    const params = new URLSearchParams(window.location.search);
    service ? params.set("service", service) : params.delete("service");
    area ? params.set("area", area) : params.delete("area");
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }, [service, area, search]);

  const reset = () => { setService(""); setArea(""); setSearch(""); };

  return <section className="quote-explorer" aria-labelledby="quote-explorer-title">
    <div className="quote-explorer__heading">
      <div><h2 id="quote-explorer-title" className="homev3-title">Find quote examples like your project</h2>
      <p className="homev3-copy">Filter recent estimate examples by project type, area, or keyword, then start your own address-based quote when you are ready.</p></div>
      <div className="quote-explorer__cta"><strong>Want a price range for your own home?</strong><Link href="/online-estimate">Get an instant roof quote →</Link></div>
    </div>
    <fieldset><legend>Project type</legend><div className="quote-quick-nav__chips">{services.map(([value, label]) => <button key={label} type="button" className={`quote-quick-nav__chip${service === value ? " quote-quick-nav__chip--active" : ""}`} onClick={() => setService(value)}>{label}</button>)}</div></fieldset>
    <div className="quote-explorer__fields"><label>Area<select value={area} onChange={(event) => setArea(event.target.value)}><option value="">All areas</option>{areas.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value.toLowerCase())} placeholder="Search by neighbourhood, city, project type, material, or quote detail" /></label></div>
    <div className="quote-explorer__status"><strong>Showing {count.toLocaleString()} quote example{count === 1 ? "" : "s"}</strong><button type="button" onClick={reset}>Reset filters</button></div>
    {linkedOutsideFilters ? <p className="quote-filter-status">Showing linked quote outside the current filters.</p> : null}
  </section>;
}
