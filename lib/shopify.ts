const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice: {
          amount: string;
          currencyCode: string;
        } | null;
        availableForSale: boolean;
        quantityAvailable: number;
      };
    }>;
  };
  availableForSale: boolean;
  totalInventory: number;
}

async function shopifyFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials are not configured. Please check your environment variables.');
  }

  const proxyUrl = `${SUPABASE_URL}/functions/v1/shopify-proxy`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    let errorMessage = `Shopify proxy error: ${response.status}`;
    try {
      const errorJson = await response.json();
      console.error('[SHOPIFY] Proxy error response:', errorJson);
      errorMessage = errorJson.error || errorMessage;
      if (errorJson.details) {
        console.error('[SHOPIFY] Error details:', errorJson.details);
      }
    } catch {
      const text = await response.text();
      console.error('[SHOPIFY] Proxy error response:', text);
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();

  if (json.errors) {
    console.error('[SHOPIFY] GraphQL errors:', json.errors);
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        handle
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable
            }
          }
        }
        availableForSale
        totalInventory
      }
    }
  `;

  try {
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>(query, { handle });
    return data.product;
  } catch (error) {
    console.error('Error fetching product by handle:', error);
    return null;
  }
}

export async function getProductById(productId: string): Promise<ShopifyProduct | null> {
  const query = `
    query getProductById($id: ID!) {
      product(id: $id) {
        id
        title
        description
        handle
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable
            }
          }
        }
        availableForSale
        totalInventory
      }
    }
  `;

  try {
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>(query, { id: productId });
    return data.product;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

export async function getFirstVariantId(productId: string): Promise<string | null> {
  try {
    const product = await getProductById(productId);
    if (!product || !product.variants.edges.length) {
      return null;
    }
    return product.variants.edges[0].node.id;
  } catch (error) {
    console.error('Error getting first variant ID:', error);
    return null;
  }
}

export async function createCheckout(variantId: string, quantity: number = 1, userId?: string, userEmail?: string) {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const noteAttributes: Array<{ key: string; value: string }> = [];

  if (userId) {
    noteAttributes.push({ key: 'user_id', value: userId });
  }

  if (userEmail) {
    noteAttributes.push({ key: 'user_email', value: userEmail });
  }

  const variables = {
    input: {
      lines: [
        {
          merchandiseId: variantId,
          quantity,
        },
      ],
      ...(noteAttributes.length > 0 && { attributes: noteAttributes }),
    },
  };

  try {
    const data = await shopifyFetch<{
      cartCreate: {
        cart: { id: string; checkoutUrl: string } | null;
        userErrors: Array<{ code: string; field: string[]; message: string }>;
      };
    }>(query, variables);

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    const cart = data.cartCreate.cart;
    if (!cart) return null;

    return { id: cart.id, webUrl: cart.checkoutUrl };
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
}

export async function getAllProducts(first: number = 250): Promise<ShopifyProduct[]> {
  let allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  console.log('[SHOPIFY] getAllProducts called with limit:', first);

  try {
    while (hasNextPage && allProducts.length < first) {
      const batchSize = Math.min(250, first - allProducts.length);
      console.log('[SHOPIFY] Fetching batch of', batchSize, 'products, cursor:', cursor);

      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                description
                handle
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      availableForSale
                      quantityAvailable
                    }
                  }
                }
                availableForSale
                totalInventory
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const data = await shopifyFetch<{
        products: {
          edges: Array<{ node: ShopifyProduct; cursor: string }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
        };
      }>(query, { first: batchSize, after: cursor });

      const products = data.products.edges.map((edge) => edge.node);
      console.log('[SHOPIFY] Received', products.length, 'products in this batch');
      allProducts = [...allProducts, ...products];

      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;

      if (products.length === 0) {
        console.log('[SHOPIFY] No more products to fetch');
        break;
      }
    }

    console.log('[SHOPIFY] Total products loaded:', allProducts.length);
    return allProducts;
  } catch (error) {
    console.error('[SHOPIFY] Error fetching all products:', error);
    throw error;
  }
}
