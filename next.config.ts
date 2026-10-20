import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled for the authenticated workspace: private, session-scoped responses
  // must not be cached or prefetched as static content. The public demo remains usable.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      // Keep component .module.css files on the native CSS-module pipeline.
      // Rewriting every CSS file as *.css strips their scoped class exports.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
