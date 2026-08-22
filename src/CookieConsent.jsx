import React from "react";
import { useTheme } from "./ThemeContext";
import { alpha } from "./theme";

// Simple accept/reject cookie banner. Positioned like UpdateToast (above the
// mobile tab bar, bottom-right on desktop) but has no dismiss/X button on
// purpose — a real choice is required before it goes away, and that choice
// is what gates whether Google Analytics ever loads.
export default function CookieConsent({ onAccept, onReject, onOpenPrivacy }) {
  const theme = useTheme();
  return (
    <div
      className="fixed z-[70] left-4 right-4 lg:left-auto lg:right-6 lg:w-[380px] flex justify-center lg:justify-end"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl p-4 shadow-2xl"
        style={{ backgroundColor: theme.surfaceRaised, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[13.5px] leading-snug" style={{ color: theme.text }}>
          Officium would like to use Google Analytics to understand how the app is used. It's only switched on if
          you agree.
        </p>
        <button
          onClick={onOpenPrivacy}
          className="text-[11.5px] underline decoration-dotted mt-1.5 block"
          style={{ color: alpha(theme.text, 0.53) }}
        >
          Read our Privacy Policy
        </button>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onAccept}
            className="flex-1 rounded-xl px-3 py-2.5 text-[13px]"
            style={{ backgroundColor: "#C9A227", color: "#1A1918" }}
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-xl px-3 py-2.5 text-[13px]"
            style={{ backgroundColor: theme.bg, color: alpha(theme.text, 0.7), border: `1px solid ${theme.border}` }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
