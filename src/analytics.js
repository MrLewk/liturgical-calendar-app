// Google Analytics (GA4) — deliberately NOT loaded on app start. It is only
// injected once the person has accepted the cookie consent banner (see
// CookieConsent.jsx / App.jsx), so no analytics cookie is ever set without
// affirmative consent.

const GA_MEASUREMENT_ID = "G-544QD91PK8";

let gaLoaded = false;

export function loadGoogleAnalytics() {
  if (gaLoaded || typeof window === "undefined") return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Called when someone accepts after previously rejecting, or rejects after
// previously accepting (via Settings). There's no reliable way to un-set a
// cookie GA has already dropped from client-side JS alone, but we can at
// least stop sending further events and tell GA to forget this client going
// forward.
export function disableGoogleAnalytics() {
  if (typeof window === "undefined") return;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}
