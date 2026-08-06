import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdSlot from "./AdSlot";

const NO_ADS_PATHS = new Set(["/login", "/register", "/checkout/callback"]);

export default function Layout({ children }) {
  const location = useLocation();
  const showAds = !NO_ADS_PATHS.has(location.pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {showAds && <AdSlot placement="top" />}
      <main className="flex-1">{children}</main>
      {showAds && <AdSlot placement="middle" />}
      {showAds && <AdSlot placement="bottom" />}
      <Footer />
    </div>
  );
}
