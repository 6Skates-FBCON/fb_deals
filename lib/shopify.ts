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
  const response = await fetch(`https://${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
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

export async function getAllProducts(first: number = 50): Promise<ShopifyProduct[]> {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
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
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch<{
      products: {
        edges: Array<{ node: ShopifyProduct }>;
      };
    }>(query, { first });

    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
}
