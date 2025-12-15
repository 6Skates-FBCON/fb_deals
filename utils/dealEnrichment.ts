import { Deal, EnrichedDeal } from '@/types/deal';
import { getProductByHandle, getProductById, ShopifyProduct } from '@/lib/shopify';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([promise, timeout]);
}

export async function enrichDealWithShopifyData(deal: Deal): Promise<EnrichedDeal> {
  try {
    if (!deal.shopify_handle && !deal.shopify_product_id) {
      return deal as EnrichedDeal;
    }

    let shopifyProduct: ShopifyProduct | null = null;

    if (deal.shopify_handle) {
      shopifyProduct = await withTimeout(getProductByHandle(deal.shopify_handle), 5000);
    } else if (deal.shopify_product_id) {
      shopifyProduct = await withTimeout(getProductById(deal.shopify_product_id), 5000);
    }

    if (!shopifyProduct) {
      console.warn(`[ENRICH] No Shopify product found for deal ${deal.id}, using basic data`);
      return deal as EnrichedDeal;
    }

    const firstVariant = shopifyProduct.variants.edges[0]?.node;
    const targetVariant = deal.shopify_variant_id
      ? shopifyProduct.variants.edges.find((edge) => edge.node.id === deal.shopify_variant_id)
          ?.node
      : firstVariant;

    const variant = targetVariant || firstVariant;

    if (!variant) {
      return deal as EnrichedDeal;
    }

    const images = shopifyProduct.images.edges.map((edge) => ({
      url: edge.node.url,
      altText: edge.node.altText,
    }));

    return {
      ...deal,
      shopifyProduct: {
        id: shopifyProduct.id,
        title: shopifyProduct.title,
        description: shopifyProduct.description,
        images: images.length > 0 ? images : [{ url: deal.image_url, altText: deal.title }],
        currentPrice: parseFloat(variant.price.amount),
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
        availableForSale: variant.availableForSale,
        totalInventory: shopifyProduct.totalInventory,
        variantId: variant.id,
      },
    };
  } catch (error) {
    console.error(`[ENRICH] Error enriching deal ${deal.id}:`, error);
    return deal as EnrichedDeal;
  }
}

export async function enrichDealsWithShopifyData(deals: Deal[]): Promise<EnrichedDeal[]> {
  const enrichedDeals = await Promise.all(deals.map((deal) => enrichDealWithShopifyData(deal)));
  return enrichedDeals;
}
