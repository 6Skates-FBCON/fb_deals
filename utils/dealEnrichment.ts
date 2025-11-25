import { Deal, EnrichedDeal } from '@/types/deal';
import { getProductByHandle, getProductById, ShopifyProduct } from '@/lib/shopify';

export async function enrichDealWithShopifyData(deal: Deal): Promise<EnrichedDeal> {
  try {
    let shopifyProduct: ShopifyProduct | null = null;

    if (deal.shopify_handle) {
      shopifyProduct = await getProductByHandle(deal.shopify_handle);
    } else if (deal.shopify_product_id) {
      shopifyProduct = await getProductById(deal.shopify_product_id);
    }

    if (!shopifyProduct) {
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
    console.error('Error enriching deal with Shopify data:', error);
    return deal as EnrichedDeal;
  }
}

export async function enrichDealsWithShopifyData(deals: Deal[]): Promise<EnrichedDeal[]> {
  const enrichedDeals = await Promise.all(deals.map((deal) => enrichDealWithShopifyData(deal)));
  return enrichedDeals;
}
