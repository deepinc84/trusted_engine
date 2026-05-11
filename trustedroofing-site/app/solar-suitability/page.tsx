import type { Metadata } from "next";
import SolarSuitabilityForm from "./SolarSuitabilityForm";
import styles from "./solar-suitability.module.css";

export const metadata: Metadata = {
  title: "Private solar suitability review | Trusted Roofing & Exteriors",
  description: "Private testing page for solar suitability lead capture.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0
    }
  }
};

export default function SolarSuitabilityPage() {
  return (
    <section className={styles.pageShell}>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.privateBadge}>Private testing page · noindex</span>
          <h1>Solar suitability review</h1>
          <p>
            Share the property address, a latest electricity bill, and appointment preferences so Trusted can help review whether the roof is a good candidate for solar planning.
          </p>
          <div className={styles.notice}>
            This page is for internal testing and early customer intake. It is not part of the public solar launch.
          </div>
        </div>
        <aside className={styles.summaryCard} aria-label="What the review considers">
          <h2>What affects suitability?</h2>
          <ul>
            <li>Roof orientation, usable roof area, pitch, and shading.</li>
            <li>Electrical usage patterns from a current utility bill.</li>
            <li>Roof condition and sequencing before any installation planning.</li>
            <li>Coordination that may involve a solar partner for final pathway review.</li>
          </ul>
        </aside>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.infoStack}>
          <article className={styles.card}>
            <h2>How this review works</h2>
            <p>
              Solar suitability depends on several site-specific factors, including roof direction, available roof planes, pitch, nearby shading, and how much electricity the property uses.
            </p>
            <p>
              A latest utility bill can help estimate consumption and the potential value of solar planning. It does not replace a technical design or final electrical review.
            </p>
          </article>
          <article className={styles.card}>
            <h2>Roof-first planning</h2>
            <p>
              Roof condition still requires review before installation decisions are made. Trusted can help evaluate whether roofing work should be considered before solar planning proceeds.
            </p>
            <p>
              Final coordination or installation pathways may involve a solar partner. We will avoid making assumptions about rebates, savings, financing, or payback during this suitability review.
            </p>
          </article>
        </div>
        <SolarSuitabilityForm />
      </div>
    </section>
  );
}
