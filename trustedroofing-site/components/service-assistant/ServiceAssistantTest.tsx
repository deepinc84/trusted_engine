"use client";
import { useEffect, useMemo, useState } from "react";
import { initialServiceState } from "@/lib/service-assistant/conversation";
import type { ServiceState } from "@/lib/service-assistant/service-types";

type Message = { role: "assistant" | "user"; content: string };
type Suggestion = { label: string; place_id?: string | null };
const welcome: Message = { role: "assistant", content: "Hi — describe what’s happening in your own words. I’ll gather only what’s needed and Trusted Engine will calculate any price." };

export default function ServiceAssistantTest() {
  const [state, setState] = useState<ServiceState>(() => initialServiceState());
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const addressWanted = useMemo(() => !state.address && state.service, [state.address, state.service]);
  useEffect(() => {
    if (!addressWanted || input.trim().length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => { const r = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(input)}`); if (r.ok) setSuggestions(((await r.json()) as {suggestions:Suggestion[]}).suggestions); }, 250);
    return () => clearTimeout(timer);
  }, [addressWanted, input]);
  async function send(message = input) {
    if (!message.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: message.trim() }]; setMessages(next); setInput(""); setSuggestions([]); setLoading(true);
    try { const r = await fetch("/api/test/service-assistant/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, state, messages: next }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); let updated = data.state as ServiceState; let reply = data.reply as string;
      if (updated.replacementEstimateRequested && updated.address && updated.lat != null && updated.lng != null && !updated.estimates.some(e => e.type === "roof_replacement")) {
        const quoteResponse = await fetch("/api/instaquote/estimate", { method: "POST", headers: { "Content-Type": "application/json", "x-instaquote-test-mode": "1" }, body: JSON.stringify({ address: updated.address, lat: updated.lat, lng: updated.lng, serviceScope: "roofing", testMode: true }) });
        const quote = await quoteResponse.json();
        if (quoteResponse.ok && quote.ranges?.good) { const estimate = { type: "roof_replacement", low: quote.ranges.good.low, high: quote.ranges.good.high, createdAt: new Date().toISOString() }; updated = { ...updated, estimates: [...updated.estimates, estimate] }; reply = `The test-mode Instant Quote range for a whole-roof replacement is $${estimate.low.toLocaleString("en-CA")}–$${estimate.high.toLocaleString("en-CA")}.`; }
      }
      setState(updated); setMessages([...next, { role: "assistant", content: reply }]); }
    catch (e) { setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : "The test assistant could not respond." }]); } finally { setLoading(false); }
  }
  async function chooseAddress(item: Suggestion) {
    setInput(""); setSuggestions([]); setLoading(true);
    try {
      const r = await fetch("/api/instaquote/estimate", { method: "POST", headers: { "Content-Type": "application/json", "x-instaquote-test-mode": "1" }, body: JSON.stringify({ address: item.label, placeId: item.place_id, serviceScope: "roofing", testMode: true }) });
      const quote = await r.json(); if (!r.ok) throw new Error(quote.error || "Address validation failed.");
      const pitch = typeof quote.pitchRatio === "number" ? quote.pitchRatio : typeof quote.pitchRatio === "string" ? Number.parseFloat(quote.pitchRatio) : undefined;
      let updated: ServiceState = { ...state, address: quote.address || item.label, lat: quote.lat, lng: quote.lng, city: item.label.split(",").at(-3)?.trim(), province: "AB", pitch: Number.isFinite(pitch) ? pitch : state.pitch, pitchSource: Number.isFinite(pitch) && quote.areaSource === "solar" ? "google_solar" : state.pitchSource };
      if (state.replacementEstimateRequested && quote.ranges?.good) updated = { ...updated, estimates: [...updated.estimates, { type: "roof_replacement", low: quote.ranges.good.low, high: quote.ranges.good.high, createdAt: new Date().toISOString() }] };
      setState(updated); const confirmation = state.replacementEstimateRequested && quote.ranges?.good ? `I validated ${updated.address}. The test-mode Instant Quote range is $${quote.ranges.good.low.toLocaleString("en-CA")}–$${quote.ranges.good.high.toLocaleString("en-CA")}.` : `I validated ${updated.address}. Tell me any remaining details about the location of the issue.`;
      setMessages(m => [...m, { role: "user", content: item.label }, { role: "assistant", content: confirmation }]);
    } catch (e) { setMessages(m => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Address validation failed." }]); } finally { setLoading(false); }
  }
  function reset() { setState(initialServiceState()); setMessages([welcome]); setInput(""); setSuggestions([]); }
  return <main className="sa-page"><header className="sa-header"><div><span className="sa-badge">TEST MODE · NO DATA SAVED</span><h1>Trusted Service Assistant</h1><p>AI understands the request. Deterministic Trusted Engine rules calculate pricing.</p></div><button onClick={reset}>Reset conversation</button></header><div className="sa-grid"><section className="sa-chat" aria-label="Service assistant conversation"><div className="sa-messages">{messages.map((m,i)=><div key={i} className={`sa-message sa-${m.role}`}><b>{m.role === "user" ? "You" : "Trusted Assistant"}</b><p>{m.content}</p></div>)}{loading&&<div className="sa-message sa-assistant" aria-live="polite"><b>Trusted Assistant</b><p className="sa-typing">Thinking…</p></div>}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="sa-input"><label htmlFor="sa-text">{addressWanted ? "Enter or select the service-property address" : "Your message"}</label><div><input id="sa-text" value={input} onChange={e=>setInput(e.target.value)} autoComplete="off" placeholder={addressWanted ? "Start typing an address…" : "Describe the issue…"}/><button disabled={loading}>Send</button></div>{suggestions.length>0&&<ul className="sa-suggestions">{suggestions.map(s=><li key={s.place_id || s.label}><button type="button" onClick={()=>void chooseAddress(s)}>{s.label}</button></li>)}</ul>}</form></section><aside className="sa-debug"><details open><summary>Debug / Pricing State</summary><div className="sa-provider">Provider: <strong>{state.aiProvider}</strong></div><pre>{JSON.stringify(state,null,2)}</pre></details></aside></div></main>;
}
