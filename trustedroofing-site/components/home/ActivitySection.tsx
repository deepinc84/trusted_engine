import Link from "next/link";
import { formatRelativeTime } from "@/lib/time";
import type { HomeActivity } from "./types";

export default function ActivitySection({
  activity,
}: {
  activity: HomeActivity[];
}) {
  return (
    <section className="homev3-section homev3-section--dark" id="activity">
      <div className="homev3-container homev3-activity-layout">
        <div>
          <p className="homev3-eyebrow">Recent activity</p>
          <h2 className="homev3-title">
            Recent roofing and exterior activity
          </h2>
          <p className="homev3-copy homev3-copy--muted">
            See newly completed projects and local roofing and exterior updates
            from across the Calgary area.
          </p>
          <div className="homev3-hero__actions">
            <Link href="/projects" className="button">
              View recent projects
            </Link>
            <Link href="/services" className="button button--ghost">
              Explore services
            </Link>
          </div>
        </div>
        <div className="homev3-feed">
          {activity.slice(0, 8).map((item) => (
            <article key={item.id}>
              <div>
                <strong>
                  <Link href={item.href}>{item.message}</Link>
                </strong>
                <p>
                  {item.service} · {item.location}
                </p>
              </div>
              <em>{formatRelativeTime(item.occurredAt)}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
