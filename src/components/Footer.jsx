import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-paper/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <div className="font-display text-lg font-extrabold text-paper">
              LAUNCH<span className="text-marigold">TIME</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-paper/55">
              Local kitchens, cooked to order. Every meal on this menu comes from a real vendor around the corner.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="mb-3 font-semibold text-paper">Explore</p>
              <ul className="space-y-2 text-paper/60">
                <li>
                  <Link to="/vendors" className="hover:text-paper">
                    Browse vendors
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-paper">
                    Sell on LAUNCH TIME
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-paper">Account</p>
              <ul className="space-y-2 text-paper/60">
                <li>
                  <Link to="/login" className="hover:text-paper">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-paper">
                    My orders
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-paper/40">© {new Date().getFullYear()} LAUNCH TIME. Built for local kitchens.</p>
      </div>
    </footer>
  );
}
