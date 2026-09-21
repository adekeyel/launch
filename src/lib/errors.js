import { ApiError } from "../services/api";

// Turns anything thrown by the API layer into a message a customer can act on.
// (The raw ApiError message for a network failure names the URL and CORS —
// useful in the console, not on screen.)
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError) {
    if (err.status === 0) return "Can't reach LAUNCH TIME right now. Check your connection and try again.";
    if (err.status >= 500) return "Something went wrong on our side. Please try again in a moment.";
    if (err.errors?.length) return err.errors.map((e) => e.message).join(" ");
    if (err.message) return err.message;
  }
  return fallback;
}

export function isNotFound(err) {
  return err instanceof ApiError && err.status === 404;
}
