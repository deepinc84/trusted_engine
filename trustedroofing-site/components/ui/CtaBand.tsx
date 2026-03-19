import Link from "next/link";

type Props = {
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export default function CtaBand({
  title,
  body,
  primaryHref = "/quote",
  primaryLabel = "Start instant quote"
}: Props) {
  return (
    <section className="ui-cta-band">
      <div className="site-shell">
        <h2 className="homev3-title">{title}</h2>
        <p className="homev3-copy homev3-copy--muted">{body}</p>
        <div className="homev3-hero__actions">
          <Link href={primaryHref} className="button">{primaryLabel}</Link>
          <Link href="/projects" className="button button--ghost">View projects</Link>
        </div>
      </div>
    </section>
  );
}
