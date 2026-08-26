namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;

    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_API_URL?: string;
    MARKITDOWN_API_URL?: string;

    RESEND_API_KEY: string;
    RESEND_EMAIL_FROM: string;

    OPENAI_API_KEY: string;
    LLAMA_CLOUD_API_KEY: string;
    // Optional Upstage Document Parse — a cloud .hwpx parser kept as an
    // alternative; the active path is the local Java hwp-api (lib/ingest/upstage.ts).
    UPSTAGE_API_KEY?: string;

    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;

    // Cloudflare R2 (S3-compatible) — raw source-document storage.
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET?: string;
    R2_ENDPOINT?: string;
  }
}
