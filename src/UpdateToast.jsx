import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { alpha } from "./theme";

// Checks for a new service worker every hour for tabs left open a long time,
// in addition to the check vite-plugin-pwa already does on load/navigation.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function UpdateToast() {
  const theme = useTheme();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });

  const dismiss = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      className="fixed z-[60] left-4 right-4 lg:left-auto lg:right-6 lg:w-[360px] flex justify-center lg:justify-end"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl p-4 shadow-2xl flex items-start gap-3"
        style={{ backgroundColor: theme.surfaceRaised, border: `1px solid ${theme.border}` }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: alpha("#C9A227", 0.15) }}
        >
          <RefreshCw size={16} color="#C9A227" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px]" style={{ color: theme.text }}>
            {needRefresh ? "A new version of Ordo is ready" : "Ordo is ready to work offline"}
          </p>
          {needRefresh && (
            <p className="text-[11.5px] mt-0.5" style={{ color: alpha(theme.text, 0.53) }}>
              Reload to get the latest version.
            </p>
          )}

          {needRefresh && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => updateServiceWorker(true)}
                className="rounded-lg px-3 py-1.5 text-[12.5px]"
                style={{ backgroundColor: "#C9A227", color: "#1A1918" }}
              >
                Reload
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-[12.5px]"
                style={{ color: alpha(theme.text, 0.53) }}
              >
                Later
              </button>
            </div>
          )}
        </div>

        <button onClick={dismiss} className="flex-shrink-0 p-1" aria-label="Dismiss">
          <X size={15} color={alpha(theme.text, 0.4)} />
        </button>
      </div>
    </div>
  );
}
