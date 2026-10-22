"use client";
import { useState, useSyncExternalStore } from "react";
import type { ActivityRow } from "@/app/actions/activity";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { AnimatedList } from "@/components/react-bits/AnimatedList";
const labels: Record<string, string> = {
  create: "Created",
  delete: "Deleted",
  view: "Viewed",
  copy: "Copied",
  edit: "Edited",
  share: "Shared",
  revoke: "Access revoked",
};
const actionIcons: Record<string, GlyphName> = {
  create: "plus",
  delete: "delete",
  view: "view",
  copy: "copy",
  edit: "edit",
  share: "share",
  revoke: "unlink",
};
const subscribeToHydration = () => () => {};

export function ActivityList({ activity }: { activity: ActivityRow[] }) {
  const [filter, setFilter] = useState("");
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const filtered = activity.filter((item) => !filter || item.action === filter);
  return (
    <section>
      <div className="activity-toolbar">
        <p>Latest {activity.length} events</p>
        <label className="filter-field">
          <span className="sr-only">Filter activity</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All actions</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="activity-table">
          <div className="activity-table-heading">
            <span>Event</span>
            <span>Key</span>
            <span>When</span>
          </div>
          <AnimatedList>
            {filtered.map((entry) => (
              <div className="activity-row" key={entry.id}>
                <span className="activity-event">
                  <Glyph
                    name={actionIcons[entry.action] ?? "activity"}
                    size={19}
                  />
                  {labels[entry.action] ?? entry.action}
                </span>
                <span>
                  {entry.keyName ?? "Deleted key"}
                  <small className="activity-actor">
                    {entry.actorEmail ?? "System"}
                  </small>
                </span>
                <time dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString("en-US", {
                    // Match the server during hydration, then use local time.
                    timeZone: hydrated ? undefined : "UTC",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))}
          </AnimatedList>
        </div>
      ) : (
        <div className="collection-empty">
          <Glyph name="activity" size={30} />
          <h2>No activity to show.</h2>
          <p>
            {filter
              ? "Try another action filter."
              : "Key activity will appear here as you use your workspace."}
          </p>
        </div>
      )}
    </section>
  );
}
