export interface Deal {
  id: string;
  title: string;
  description: string;
  image_url: string;
  regular_price: number;
  sale_price: number;
  quantity_total: number;
  quantity_remaining: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  shopify_handle: string;
}

export interface EnrichedDeal extends Deal {
  shopifyProduct?: {
    id: string;
    title: string;
    description: string;
    images: Array<{ url: string; altText: string | null }>;
    currentPrice: number;
    compareAtPrice: number | null;
    availableForSale: boolean;
    totalInventory: number;
    variantId: string;
  };
}
