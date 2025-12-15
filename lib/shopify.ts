const SHOPIFY_STORE_URL = process.env.EXPO_PUBLIC_SHOPIFY_STORE_URL;
const SHOPIFY_STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

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
  if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error('Shopify credentials are not configured. Please check your environment variables.');
  }

  console.log('[SHOPIFY] Fetching from:', SHOPIFY_STORE_URL);

  const response = await fetch(`https://${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[SHOPIFY] API error response:', text);
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
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

export async function createCheckout(variantId: string, quantity: number = 1) {
  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lineItems: [
        {
          variantId,
          quantity,
        },
      ],
    },
  };

  try {
    const data = await shopifyFetch<{
      checkoutCreate: {
        checkout: { id: string; webUrl: string } | null;
        checkoutUserErrors: Array<{ code: string; field: string[]; message: string }>;
      };
    }>(query, variables);

    if (data.checkoutCreate.checkoutUserErrors.length > 0) {
      throw new Error(data.checkoutCreate.checkoutUserErrors[0].message);
    }

    return data.checkoutCreate.checkout;
  } catch (error) {
    console.error('Error creating checkout:', error);
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
