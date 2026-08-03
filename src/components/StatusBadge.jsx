import { STATUS_LABEL } from "../services/orders";

const STYLES = {
  pending: "bg-marigold-soft text-marigold-dark",
  preparing: "bg-marigold-soft text-marigold-dark",
  ready: "bg-basil-soft text-basil",
  delivered: "bg-basil-soft text-basil",
  cancelled: "bg-chili-soft text-chili",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || "bg-ink/10 text-ink/60"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

const TIMELINE_STEPS = ["pending", "preparing", "ready", "delivered"];

export function StatusTimeline({ status }) {
  if (status === "cancelled") {
    return <StatusBadge status="cancelled" />;
  }
  const activeIndex = TIMELINE_STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1.5">
      {TIMELINE_STEPS.map((step, i) => (
        <li key={step} className="flex flex-1 items-center gap-1.5">
          <span
            className={`h-1.5 flex-1 rounded-full ${i <= activeIndex ? "bg-basil" : "bg-ink/10"}`}
            title={STATUS_LABEL[step]}
          />
        </li>
      ))}
    </ol>
  );
}
