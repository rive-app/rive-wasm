import { defineConfig } from "vite";

export default defineConfig({
  assetsInclude: ["**/*.riv"],
  optimizeDeps: {
    include: ["@rive-app/canvas"],
    force: true,
  },
});
