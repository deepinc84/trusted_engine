import Image from "next/image";
import Link from "next/link";
import type { HomeActivity, HomeMetric } from "./types";

type Props = {
  metrics: HomeMetric[];
  activity: HomeActivity[];
};

function formatRelative(timestamp: string) {
  const ms = Date.now() - new Date(timestamp).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function HeroSection({ metrics, activity }: Props) {
  return (
    <section className="homev3-hero" id="top">
      <Image
        src="https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1800&q=85&auto=format&fit=crop"
        alt="Calgary roofline"
        fill
        className="homev3-hero__bg"
        priority
      />
      <div className="homev3-hero__overlay" />
      <div className="homev3-container homev3-hero__content">
        <div>
          <p className="homev3-eyebrow">Calgary roofing & exteriors specialists</p>
          <h1>Your home&apos;s exterior, done once. Done right.</h1>
          <p className="homev3-hero__sub">
            Fast quotes, dependable workmanship, and clear communication for roofing,
            siding, and eavestrough projects.
          </p>
          <div className="homev3-hero__actions">
            <Link href="/quote" className="button">Start instant quote</Link>
            <Link href="/projects" className="button button--ghost">View projects</Link>
          </div>
          <div className="homev3-hero__proof">
            {metrics.slice(0, 4).map((metric) => (
              <div key={metric.id}>
                <strong>{metric.value_text}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="homev3-activity-card">
          <div className="homev3-activity-card__head">
            <h3>Recent activity</h3>
            <span>Live</span>
          </div>
          <ul>
            {activity.slice(0, 5).map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.service}</strong>
                  <p>{item.location}</p>
                </div>
                <em>{formatRelative(item.occurredAt)}</em>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
