import Image from "next/image";

const points = [
  {
    title: "Fast quote turnaround",
    copy: "Most estimates are returned within 48 hours with a clear scope."
  },
  {
    title: "Clear scopes, no surprises",
    copy: "Line items are explained before work starts so budget decisions are easier."
  },
  {
    title: "Real project-backed pricing",
    copy: "Ranges are informed by local project and quote data, not generic calculators."
  },
  {
    title: "Built for Alberta weather",
    copy: "Install details account for hail, freeze-thaw cycles, and runoff conditions."
  }
];

export default function WhyTrusted() {
  return (
    <section className="homev3-section homev3-section--soft" id="why">
      <div className="homev3-container homev3-why-layout">
        <div>
          <p className="homev3-eyebrow homev3-eyebrow--dark">Why Trusted</p>
          <h2 className="homev3-title">A better roofing experience, start to finish</h2>
          <p className="homev3-copy">
            A cleaner process from first call to final invoice, backed by communication and
            field-tested systems.
          </p>
          <div className="homev3-why-photo">
            <Image
              src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1000&q=80&auto=format&fit=crop"
              alt="Calgary exterior project"
              fill
            />
          </div>
        </div>
        <div className="homev3-why-points">
          {points.map((point) => (
            <article key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
