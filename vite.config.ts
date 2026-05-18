import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["bcryptjs", "jose"],
    },
  },
});
