import Link from "next/link";
import type { HomeActivity } from "./types";

function formatRelative(timestamp: string) {
  const ms = Date.now() - new Date(timestamp).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ActivitySection({ activity }: { activity: HomeActivity[] }) {
  return (
    <section className="homev3-section homev3-section--dark" id="activity">
      <div className="homev3-container homev3-activity-layout">
        <div>
          <p className="homev3-eyebrow">Project activity</p>
          <h2 className="homev3-title">Recent work across Calgary</h2>
          <p className="homev3-copy homev3-copy--muted">
            Live quote and project snapshots across neighborhoods to provide local context.
          </p>
          <div className="homev3-hero__actions">
            <Link href="/quote" className="button">Get your quote</Link>
            <Link href="/projects" className="button button--ghost">See projects</Link>
          </div>
        </div>
        <div className="homev3-feed">
          {activity.slice(0, 6).map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.service}</strong>
                <p>{item.location}</p>
              </div>
              <em>{formatRelative(item.occurredAt)}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
