import Link from "next/link";
import { formatRelativeTime } from "@/lib/time";
import type { HomeActivity } from "./types";

export default function ActivitySection({ activity }: { activity: HomeActivity[] }) {
  return (
    <section className="homev3-section homev3-section--dark" id="activity">
      <div className="homev3-container homev3-activity-layout">
        <div>
          <p className="homev3-eyebrow">Live trust feed</p>
          <h2 className="homev3-title">Recent quote, project, and publish activity across Calgary</h2>
          <p className="homev3-copy homev3-copy--muted">
            Live Supabase-backed activity shows fresh estimate signals, newly completed projects, and newly published geo-posts in real time.
          </p>
          <div className="homev3-hero__actions">
            <Link href="/quote" className="button">Get your quote</Link>
            <Link href="/quotes" className="button button--ghost">Browse quote archive</Link>
          </div>
        </div>
        <div className="homev3-feed">
          {activity.slice(0, 8).map((item) => (
            <article key={item.id}>
              <div>
                <strong><Link href={item.href}>{item.message}</Link></strong>
                <p>{item.service} · {item.location}</p>
              </div>
              <em>{formatRelativeTime(item.occurredAt)}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
