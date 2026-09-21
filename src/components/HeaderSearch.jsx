import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconSearch } from "./icons";

// The big search box in the header: a white field with an attached button.
export default function HeaderSearch({
  className = "",
  placeholder = "Search for meals, kitchens, cuisines",
  buttonClassName = "bg-ink text-paper hover:bg-charcoal focus-visible:outline-ink",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [term, setTerm] = useState("");

  // Keep the box in step with the URL when you're already on a search.
  useEffect(() => {
    if (location.pathname === "/vendors") {
      setTerm(new URLSearchParams(location.search).get("search") || "");
    }
  }, [location.pathname, location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = term.trim();
    navigate(`/vendors${value ? `?search=${encodeURIComponent(value)}` : ""}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`flex h-11 w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-ink ${className}`}
    >
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Search meals and kitchens"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink/45"
      />
      <button
        type="submit"
        aria-label="Search"
        className={`flex w-12 shrink-0 items-center justify-center transition ${buttonClassName}`}
      >
        <IconSearch className="h-5 w-5" />
      </button>
    </form>
  );
}
