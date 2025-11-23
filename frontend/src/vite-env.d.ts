/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_URL: string
  readonly VITE_WEBHOOK_URL: string
  readonly VITE_CDP_PROJECT_ID: string
  readonly VITE_JWT_EXP_GRACE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
