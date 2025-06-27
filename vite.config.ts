import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
      'import.meta.env.VITE_LLAMA_API_KEY': JSON.stringify(env.VITE_LLAMA_API_KEY),
      'import.meta.env.VITE_CLAUDE_API_KEY': JSON.stringify(env.VITE_CLAUDE_API_KEY),
      'import.meta.env.VITE_RAZOR_PAY_KEY': JSON.stringify(env.VITE_RAZOR_PAY_KEY),
    },
  };
});
