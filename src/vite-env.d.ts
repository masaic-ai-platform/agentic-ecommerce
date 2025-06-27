/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_CLAUDE_API_KEY: string
  readonly VITE_RAZOR_PAY_KEY: string
  readonly VITE_LLAMA_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
