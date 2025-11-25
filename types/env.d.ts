declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_SHOPIFY_STORE_URL: string;
      EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: string;
    }
  }
}

export {};
