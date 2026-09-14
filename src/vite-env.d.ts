/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COINFLOW_API_KEY?: string;
  readonly VITE_COINFLOW_MERCHANT_ID?: string;
  readonly VITE_COINFLOW_ENV?: string;
  readonly VITE_COINFLOW_AUTH_USER_ID?: string;
  readonly VITE_COINFLOW_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
