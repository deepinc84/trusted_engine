"use client";

import { useState } from "react";

type Step1Payload = {
  address: string;
  city: string;
  province: string;
  postal: string;
  lat: number;
  lng: number;
  estimate_low: number;
  estimate_high: number;
  service_type: string;
};

type Step2Payload = {
  quote_id: string;
  name: string;
  phone: string;
  email: string;
  preferred_contact: string;
};

export default function QuoteFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitStep1 = async (payload: Step1Payload) => {
    setError(null);
    const res = await fetch("/api/quotes/step1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unable to submit.");
      return;
    }
    setQuoteId(data.quote_id);
    setStep(2);
  };

  const submitStep2 = async (payload: Step2Payload) => {
    setError(null);
    const res = await fetch("/api/quotes/step2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unable to submit.");
      return;
    }
    setStep(3);
  };

  return (
    <>
      {error ? (
        <div className="card" style={{ marginTop: 24, color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}
      {step === 1 ? (
        <QuoteStep1 onSubmit={submitStep1} />
      ) : step === 2 && quoteId ? (
        <QuoteStep2 quoteId={quoteId} onSubmit={submitStep2} />
      ) : (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Thanks! We will contact you shortly.</h2>
          <p style={{ color: "var(--color-muted)", marginTop: 8 }}>
            TODO: connect to the Instant Quote workflow and schedule a follow-up.
          </p>
        </div>
      )}
    </>
  );
}

function QuoteStep1({ onSubmit }: { onSubmit: (payload: Step1Payload) => void }) {
  const [form, setForm] = useState<Step1Payload>({
    address: "",
    city: "Calgary",
    province: "AB",
    postal: "",
    lat: 0,
    lng: 0,
    estimate_low: 8500,
    estimate_high: 14500,
    service_type: "Roofing"
  });

  return (
    <form
      className="card form-grid"
      style={{ marginTop: 24 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div>
        <label htmlFor="address">Street address</label>
        <input
          id="address"
          className="input"
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
          required
        />
      </div>
      <div>
        <label htmlFor="postal">Postal code</label>
        <input
          id="postal"
          className="input"
          value={form.postal}
          onChange={(event) => setForm({ ...form, postal: event.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="service">Service type</label>
        <select
          id="service"
          className="input"
          value={form.service_type}
          onChange={(event) =>
            setForm({ ...form, service_type: event.target.value })
          }
        >
          <option>Roofing</option>
          <option>Roof repair</option>
          <option>Exteriors</option>
        </select>
      </div>
      <div>
        <label htmlFor="estimateLow">Estimated low</label>
        <input
          id="estimateLow"
          className="input"
          type="number"
          value={form.estimate_low}
          onChange={(event) =>
            setForm({ ...form, estimate_low: Number(event.target.value) })
          }
        />
      </div>
      <div>
        <label htmlFor="estimateHigh">Estimated high</label>
        <input
          id="estimateHigh"
          className="input"
          type="number"
          value={form.estimate_high}
          onChange={(event) =>
            setForm({ ...form, estimate_high: Number(event.target.value) })
          }
        />
      </div>
      <button className="button" type="submit">
        Continue to contact details
      </button>
    </form>
  );
}

function QuoteStep2({
  quoteId,
  onSubmit
}: {
  quoteId: string;
  onSubmit: (payload: Step2Payload) => void;
}) {
  const [form, setForm] = useState<Step2Payload>({
    quote_id: quoteId,
    name: "",
    phone: "",
    email: "",
    preferred_contact: "Phone"
  });

  return (
    <form
      className="card form-grid"
      style={{ marginTop: 24 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div>
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          className="input"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          className="input"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="contact">Preferred contact</label>
        <select
          id="contact"
          className="input"
          value={form.preferred_contact}
          onChange={(event) =>
            setForm({ ...form, preferred_contact: event.target.value })
          }
        >
          <option>Phone</option>
          <option>Email</option>
        </select>
      </div>
      <button className="button" type="submit">
        Submit quote request
      </button>
    </form>
  );
}
