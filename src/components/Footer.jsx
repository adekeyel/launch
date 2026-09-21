import SmartLink from "./SmartLink";
import { useContent } from "../context/ContentContext";
import logoFull from "../assets/logo-full.png";

// Everything here (blurb, link columns, contact details, social links,
// copyright line, logo) is edited in Admin > Site content > Footer.
export default function Footer() {
  const { content, t, siteName } = useContent();
  const { brand, footer } = content;
  const hasContact = footer.contactEmail || footer.contactPhone || footer.address;

  return (
    <footer className="mt-24 border-t border-line bg-ink text-paper/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <div className="inline-block rounded-xl bg-paper p-2">
              <img src={brand.logoFull || logoFull} alt={siteName} className="h-14 w-auto object-contain" />
            </div>
            {footer.about && <p className="mt-3 max-w-xs text-sm text-paper/55">{t(footer.about)}</p>}

            {hasContact && (
              <ul className="mt-4 space-y-1 text-sm text-paper/60">
                {footer.contactEmail && (
                  <li>
                    <a href={`mailto:${footer.contactEmail}`} className="hover:text-paper">
                      {footer.contactEmail}
                    </a>
                  </li>
                )}
                {footer.contactPhone && (
                  <li>
                    <a href={`tel:${footer.contactPhone.replace(/\s+/g, "")}`} className="hover:text-paper">
                      {footer.contactPhone}
                    </a>
                  </li>
                )}
                {footer.address && <li>{footer.address}</li>}
              </ul>
            )}

            {footer.social.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Social media">
                {footer.social.map((item, i) => (
                  <li key={`${item.link}-${i}`}>
                    <SmartLink to={item.link} className="text-paper/70 underline-offset-2 hover:text-paper hover:underline">
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8 text-sm">
            {footer.columns.map((column, ci) => (
              <div key={`${column.title}-${ci}`}>
                <p className="mb-3 font-semibold text-paper">{t(column.title)}</p>
                <ul className="space-y-2 text-paper/60">
                  {column.links.map((item, li) => (
                    <li key={`${item.link}-${li}`}>
                      <SmartLink to={item.link} className="hover:text-paper">
                        {t(item.label)}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 text-xs text-paper/40">
          © {new Date().getFullYear()} {siteName}.{footer.copyright ? ` ${t(footer.copyright)}` : ""}
        </p>
      </div>
    </footer>
  );
}
