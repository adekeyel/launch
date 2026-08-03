import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVendor } from "../services/vendors";
import { listFoods } from "../services/foods";
import FoodCard from "../components/FoodCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { IconClock, IconPin } from "../components/icons";
import TierBadge from "../components/TierBadge";

export default function VendorMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [vendor, setVendor] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [v, f] = await Promise.all([getVendor(id), listFoods({ vendorId: id, limit: 60 })]);
        if (!cancelled) {
          setVendor(v);
          setFoods(f.foods);
        }
      } catch (err) {
        console.error("Failed to load vendor menu:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  if (loading) {
    return <Loader label="Loading menu…" />;
  }

  if (notFound || !vendor) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <EmptyState title="Vendor not found" hint="This kitchen may not be verified yet, or the link is wrong." />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden bg-ink sm:h-64">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink to-basil" />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-10 flex items-end gap-4">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt="" className="h-20 w-20 rounded-2xl border-4 border-paper object-cover shadow" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-paper bg-marigold-soft font-display text-2xl font-bold text-marigold-dark shadow">
              {vendor.business_name?.[0]}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold text-ink">{vendor.business_name}</h1>
            <TierBadge tier={vendor.tier} />
          </div>
          {vendor.tagline && <p className="mt-1 text-ink/60">{vendor.tagline}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink/50">
            {vendor.eta && (
              <span className="inline-flex items-center gap-1.5">
                <IconClock className="h-4 w-4" /> {vendor.eta}
              </span>
            )}
            {vendor.address && (
              <span className="inline-flex items-center gap-1.5">
                <IconPin className="h-4 w-4" /> {vendor.address}
              </span>
            )}
          </div>
          {vendor.categories?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {vendor.categories.map((c) => (
                <span key={c} className="rounded-full bg-basil-soft px-2.5 py-1 text-xs font-medium text-basil">
                  {c}
                </span>
              ))}
            </div>
          )}
          {vendor.description && <p className="mt-4 max-w-2xl text-sm text-ink/60">{vendor.description}</p>}
        </div>

        <div className="mt-10 pb-20">
          <h2 className="mb-5 font-display text-xl font-bold text-ink">Menu</h2>
          {foods.length === 0 ? (
            <EmptyState title="No items on the menu yet" hint="This vendor hasn't published any dishes." />
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
        </div>
      </div>
    </div>
  );
}
