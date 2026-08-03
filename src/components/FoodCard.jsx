import { Link } from "react-router-dom";
import { formatMoney } from "../lib/format";
import { IconPlus } from "./icons";

export default function FoodCard({ food, onAdd, adding }) {
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-ticket">
      <Link to={`/foods/${food.id}`} className="block h-36 w-full overflow-hidden bg-ink/5">
        {food.image ? (
          food.media_type === "video" ? (
            <video src={food.image} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <img src={food.image} alt={food.name} className="h-full w-full object-cover transition group-hover:scale-105" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl font-extrabold text-ink/15">
            {food.name?.[0] ?? "?"}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <Link to={`/foods/${food.id}`} className="font-display text-sm font-bold text-ink hover:text-marigold-dark">
          {food.name}
        </Link>
        {food.business_name && <p className="mt-0.5 text-xs text-ink/45">{food.business_name}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-mono text-sm font-semibold text-ink">{formatMoney(food.price)}</span>
          {onAdd && (
            <button
              onClick={() => onAdd(food)}
              disabled={adding}
              className="btn-accent h-8 gap-1 px-3 text-xs disabled:opacity-60"
              aria-label={`Add ${food.name} to cart`}
            >
              <IconPlus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
