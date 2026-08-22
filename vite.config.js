import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.png", "favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Officium — Liturgical Calendar",
        short_name: "Officium",
        description: "Track the liturgical year — seasons, feasts, prayers, and readings across Catholic, Anglican, and Orthodox traditions.",
        theme_color: "#211F1D",
        background_color: "#211F1D",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Bundled WEB Bible text (public/bible/**/*.json) is deliberately left
        // out of the precache glob above — at ~16MB it would badly bloat the
        // initial install. Instead each book is cached the first time it's
        // actually fetched (i.e. the first time someone opens that reading),
        // after which it's available offline like everything else.
        runtimeCaching: [
          {
            urlPattern: /\/bible\/.*\.json$/,
            handler: "CacheFirst",
            options: {
              cacheName: "bible-text",
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
