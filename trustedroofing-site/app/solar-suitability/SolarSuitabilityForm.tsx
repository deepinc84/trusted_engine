"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "./solar-suitability.module.css";

const allowedFileTypes = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp";

export default function SolarSuitabilityForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/solar-suitability", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit the request.");
      }

      formRef.current?.reset();
      setStatus("success");
      setMessage("Thanks — your solar suitability request was received. We will review the details and follow up.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit the request.");
    }
  }

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit}>
      <div>
        <span className={styles.formEyebrow}>Start the review</span>
        <h2>Submit property details</h2>
        <p>Required fields are used only for follow-up and suitability review.</p>
      </div>

      <div className={styles.fieldGrid}>
        <label>
          Name
          <input name="name" type="text" autoComplete="name" required maxLength={120} />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required maxLength={160} />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" required maxLength={40} />
        </label>
        <label>
          Property address
          <input name="propertyAddress" type="text" autoComplete="street-address" required maxLength={240} />
        </label>
      </div>

      <label>
        Latest electricity / utility bill
        <input name="billFile" type="file" accept={allowedFileTypes} required />
        <span className={styles.helpText}>Accepted: PDF, JPG, JPEG, PNG, HEIC, HEIF, or WEBP. Maximum 10 MB.</span>
      </label>

      <fieldset className={styles.appointmentSet}>
        <legend>Preferred appointment dates and time windows</legend>
        {[1, 2, 3].map((number) => (
          <div className={styles.appointmentRow} key={number}>
            <label>
              Date {number}
              <input name={`preferredDate${number}`} type="date" required />
            </label>
            <label>
              Time window {number}
              <input
                name={`preferredTimeWindow${number}`}
                type="text"
                placeholder="e.g. 9:00–11:00 AM"
                required
                maxLength={80}
              />
            </label>
          </div>
        ))}
      </fieldset>

      <label>
        Optional notes
        <textarea name="notes" rows={4} maxLength={1200} placeholder="Roof age, known shading, electrical panel notes, timing, or other context." />
      </label>

      <button className={styles.submitButton} type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Request solar suitability review"}
      </button>

      {message ? (
        <p className={status === "success" ? styles.successMessage : styles.errorMessage} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
