import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyFoods, updateFood, deleteFood } from "../../services/foods";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ErrorBanner from "../../components/ErrorBanner";
import { formatMoney } from "../../lib/format";
import { IconTrash } from "../../components/icons";

export default function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listMyFoods();
      setFoods(data.foods);
    } catch (err) {
      console.error("Failed to load your foods:", err);
      setError("Couldn't load your menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvailable = async (food) => {
    setBusyId(food.id);
    setError("");
    try {
      const updated = await updateFood(food.id, { is_available: !food.is_available });
      setFoods((fs) => fs.map((f) => (f.id === food.id ? updated : f)));
    } catch (err) {
      setError(err?.message || "Couldn't update this item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Delete "${food.name}"? This can't be undone.`)) return;
    setBusyId(food.id);
    setError("");
    try {
      await deleteFood(food.id);
      setFoods((fs) => fs.filter((f) => f.id !== food.id));
    } catch (err) {
      setError(err?.message || "Couldn't delete this item.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Manage foods</h1>
        <Link to="/vendor/foods/new" className="btn-accent">
          + Add food
        </Link>
      </div>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading your menu…" />
        ) : foods.length === 0 ? (
          <EmptyState
            title="Your menu is empty"
            hint="Add your first dish to start selling."
            action={
              <Link to="/vendor/foods/new" className="btn-accent">
                Add food
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {foods.map((food) => (
              <li key={food.id} className="flex items-center gap-4 py-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                  {food.image && <img src={food.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{food.name}</p>
                  <p className="font-mono text-sm text-ink/60">{formatMoney(food.price)}</p>
                </div>
                <button
                  onClick={() => toggleAvailable(food)}
                  disabled={busyId === food.id}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                    food.is_available ? "bg-basil-soft text-basil" : "bg-ink/8 text-ink/50"
                  }`}
                >
                  {food.is_available ? "Live" : "Draft"}
                </button>
                <Link to={`/vendor/foods/${food.id}/edit`} className="btn-outline h-9 px-4 text-xs">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(food)}
                  disabled={busyId === food.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/40 transition hover:bg-chili-soft hover:text-chili"
                  aria-label={`Delete ${food.name}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
