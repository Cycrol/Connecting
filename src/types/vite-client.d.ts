declare module 'vite/client' {
  interface ImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
