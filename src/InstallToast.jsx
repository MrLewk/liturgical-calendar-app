import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { alpha } from "./theme";

// Once dismissed (or installed), never shown again on this device.
const DISMISS_KEY = "officium-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // legacy iOS Safari flag
  );
}

// iPadOS 13+ identifies itself as "MacIntel" in the user agent, so a touch
// check is needed alongside the classic iPhone/iPad/iPod match.
function isIOS() {
  const ua = window.navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * A dismissible install prompt, positioned like UpdateToast (above the
 * mobile tab bar). Android/Chrome/Edge get the real `beforeinstallprompt`
 * flow with a one-tap Install button; iOS Safari can't trigger an install
 * programmatically, so it gets instructions for the manual Share ->
 * "Add to Home Screen" steps instead. Hidden entirely once the app is
 * already installed (running in standalone display mode), and gated by
 * `active` so it never overlaps the cookie consent banner's same slot.
 */
export default function InstallToast({ active }) {
  const theme = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // "android" | "ios" | null — determined once at mount, not inside the
  // effect below, since it never changes for the life of the page.
  const [platform, setPlatform] = useState(() => (isIOS() ? "ios" : null));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isStandalone()) return;

    if (platform === "ios") {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      setVisible(true);
    };
    const handleInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [active, platform]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!visible) return null;

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
          {platform === "ios" ? <Share size={16} color="#C9A227" /> : <Download size={16} color="#C9A227" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px]" style={{ color: theme.text }}>
            Install Officium on your {platform === "ios" ? "iPhone" : "device"}
          </p>
          <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: alpha(theme.text, 0.53) }}>
            {platform === "ios"
              ? 'Tap the Share icon in Safari, then "Add to Home Screen".'
              : "Add it to your home screen for quick, full-screen access — even offline."}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {platform === "android" && (
              <button
                onClick={install}
                className="rounded-lg px-3 py-1.5 text-[12.5px]"
                style={{ backgroundColor: "#C9A227", color: "#1A1918" }}
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-[12.5px]"
              style={{ color: alpha(theme.text, 0.53) }}
            >
              Dismiss
            </button>
          </div>
        </div>

        <button onClick={dismiss} className="flex-shrink-0 p-1" aria-label="Dismiss">
          <X size={15} color={alpha(theme.text, 0.4)} />
        </button>
      </div>
    </div>
  );
}
