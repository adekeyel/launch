import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createFood, updateFood, listMyFoods } from "../../services/foods";
import VendorTabs from "../../components/VendorTabs";
import ErrorBanner from "../../components/ErrorBanner";
import Loader from "../../components/Loader";
import { IconUpload } from "../../components/icons";

export default function FoodForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({ name: "", description: "", price: "", category: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        // There's no single-food-by-id vendor endpoint, so we pull it from
        // the vendor's own food list, which vendors can always see in full.
        const data = await listMyFoods();
        const food = data.foods.find((f) => f.id === id);
        if (!food) throw new Error("Food item not found.");
        if (!cancelled) {
          setForm({
            name: food.name,
            description: food.description || "",
            price: food.price,
            category: food.category || "",
          });
          setPreview(food.image);
        }
      } catch (err) {
        console.error("Failed to load food item for editing:", err);
        if (!cancelled) setError("Couldn't load this item.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateFood(id, { ...form, mediaFile });
      } else {
        await createFood({ ...form, mediaFile });
      }
      navigate("/vendor/foods");
    } catch (err) {
      setError(err?.message || "Couldn't save this item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{isEdit ? "Edit food" : "Add food"}</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      {loading ? (
        <Loader label="Loading item…" />
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <ErrorBanner message={error} />

          <div>
            <label className="field-label">Photo (optional)</label>
            <label
              htmlFor="media"
              className="flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-ink/20 bg-ink/5 text-ink/45 hover:border-marigold"
            >
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs">
                  <IconUpload className="h-5 w-5" />
                  Upload
                </span>
              )}
            </label>
            <input id="media" type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          </div>

          <div>
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input id="name" required value={form.name} onChange={update("name")} className="field-input" placeholder="Jollof rice & chicken" />
          </div>
          <div>
            <label className="field-label" htmlFor="category">
              Category (optional)
            </label>
            <input id="category" value={form.category} onChange={update("category")} className="field-input" placeholder="Rice, Grills, Drinks…" />
          </div>
          <div>
            <label className="field-label" htmlFor="price">
              Price (₦)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={update("price")}
              className="field-input"
              placeholder="3500"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="description">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={update("description")}
              className="field-input h-auto py-2.5"
              placeholder="What's in it, how it's made, portion size…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Add to menu"}
            </button>
            <Link to="/vendor/foods" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
