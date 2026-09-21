import { Link } from "react-router-dom";

// A link whose address came from the admin editor. Pages on this site use the
// router (no full reload); #anchors and mailto:/tel: are plain links; web
// addresses open in a new tab safely.
// Only these kinds of address are ever turned into links. The server refuses to
// save anything else, and this is a second lock: even if bad data got in
// (say, "javascript:…"), it renders as plain text, never as a clickable link.
const SAFE_LINK = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

export default function SmartLink({ to, children, ...rest }) {
  if (!to || !SAFE_LINK.test(to)) return <span {...rest}>{children}</span>;
  if (to.startsWith("/")) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
