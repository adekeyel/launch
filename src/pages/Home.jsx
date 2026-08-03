import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listVendors } from "../services/vendors";
import { listFoods } from "../services/foods";
import VendorCard from "../components/VendorCard";
import FoodCard from "../components/FoodCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { IconSearch, IconChevronRight } from "../components/icons";

export default function Home() {
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [v, f] = await Promise.all([listVendors({ limit: 8 }), listFoods({ limit: 8 })]);
        if (!cancelled) {
          setVendors(v.vendors);
          setFoods(f.foods);
        }
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/vendors${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  };

  const handleAdd = async (food) => {
    if (!user) return navigate("/login");
    setAddingId(food.id);
    try {
      await add(food.id, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={heroTextureStyle} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center rounded-full bg-marigold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-marigold">
            Order #001 and counting
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] text-paper sm:text-6xl">
            Your local kitchens, <span className="text-marigold">plated and delivered.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-paper/60">
            Skip the chains. Order straight from the vendors cooking a few streets over — every ticket goes
            straight to their kitchen.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meals, vendors, cuisines…"
                className="h-12 w-full rounded-full border-0 bg-paper pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink/40 focus:ring-2 focus:ring-marigold"
              />
            </div>
            <button type="submit" className="btn-accent h-12 px-6">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Featured vendors */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">On the menu today</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">Vendors near you</h2>
          </div>
          <Link to="/vendors" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
            See all <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <Loader label="Loading vendors…" />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No vendors on the platform yet"
            hint="Once vendors register and get verified, they'll show up here."
            action={
              <Link to="/register" className="btn-accent">
                Register your kitchen
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </section>

      {/* Popular foods */}
      {(loading || foods.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Fresh off the pass</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">Popular right now</h2>
          </div>
          {loading ? (
            <Loader label="Loading meals…" />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {foods.map((f) => (
                <FoodCard
                  key={f.id}
                  food={f}
                  onAdd={!user || user.role === "customer" ? handleAdd : undefined}
                  adding={addingId === f.id}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const heroTextureStyle = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent, transparent 22px, currentColor 22px, currentColor 23px)",
  color: "#FAF4EC",
};
