// Browser location as a promise. Resolves { lat, lng }, or rejects with a
// friendly message (permission denied, unsupported, timed out) that pages
// can show as-is.
export function getPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This device doesn't support location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location is turned off for this site. Allow it in your browser to see the nearest orders first."));
        } else {
          reject(new Error("Couldn't get your location right now."));
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 30000 }
    );
  });
}
