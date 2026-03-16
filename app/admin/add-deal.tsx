import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ShopifyProduct, getAllProducts } from '@/lib/shopify';

function showAlert(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    onOk?.();
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
}

export default function AddDealScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantityTotal, setQuantityTotal] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [shopifyHandle, setShopifyHandle] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return shopifyProducts;

    const query = searchQuery.toLowerCase().trim();
    return shopifyProducts.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
  }, [shopifyProducts, searchQuery]);

  const loadShopifyProducts = async () => {
    setLoadingProducts(true);
    try {
      console.log('[SHOPIFY] Loading products...');
      const products = await getAllProducts(1000);
      console.log('[SHOPIFY] Loaded products:', products.length);

      if (products.length === 0) {
        showAlert(
          'No Products Found',
          'No products were found in your Shopify store. Please make sure your store has active products.'
        );
      } else {
        setShopifyProducts(products);
        setShowProductPicker(true);
      }
    } catch (error: any) {
      console.error('[SHOPIFY] Error loading products:', error);
      showAlert('Error', error.message || 'Failed to load Shopify products. Please check your store credentials.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectProduct = (product: ShopifyProduct) => {
    setSelectedProduct(product);
    setTitle(product.title);
    setDescription(product.description);
    setShopifyHandle(product.handle);

    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const comparePrice = product.compareAtPriceRange?.minVariantPrice?.amount;

    if (comparePrice) {
      setRegularPrice(comparePrice);
      setSalePrice(price.toFixed(2));
    } else {
      setRegularPrice(price.toFixed(2));
      setSalePrice((price * 0.7).toFixed(2));
    }

    setShowProductPicker(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title');
      return;
    }

    if (!regularPrice || !salePrice) {
      showAlert('Error', 'Please enter regular and sale prices');
      return;
    }

    if (!quantityTotal) {
      showAlert('Error', 'Please enter quantity');
      return;
    }

    if (!startDate || !endDate) {
      showAlert('Error', 'Please enter start and end dates');
      return;
    }

    if (!shopifyHandle) {
      showAlert('Error', 'Please select a Shopify product');
      return;
    }

    const regPrice = parseFloat(regularPrice);
    const salePriceNum = parseFloat(salePrice);

    if (isNaN(regPrice) || isNaN(salePriceNum)) {
      showAlert('Error', 'Invalid price format');
      return;
    }

    if (salePriceNum >= regPrice) {
      showAlert('Error', 'Sale price must be less than regular price');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          title: title.trim(),
          description: description.trim(),
          image_url: selectedProduct?.images.edges[0]?.node.url || '',
          regular_price: regPrice,
          sale_price: salePriceNum,
          quantity_total: parseInt(quantityTotal),
          quantity_remaining: parseInt(quantityTotal),
          start_date: startDate!.toISOString(),
          end_date: endDate!.toISOString(),
          shopify_handle: shopifyHandle,
          shopify_product_id: selectedProduct?.id || '',
        })
        .select();

      if (error) {
        console.error('[ADD DEAL] Database error:', error);
        throw error;
      }

      console.log('[ADD DEAL] Deal created successfully:', data);

      showAlert('Success', 'Deal created successfully', () => router.back());
    } catch (error: any) {
      console.error('[ADD DEAL] Error creating deal:', error);
      showAlert('Error', error.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  if (showProductPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Shopify Product</Text>
          <TouchableOpacity onPress={() => setShowProductPicker(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#999999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {searchQuery.trim() !== '' && (
          <View style={styles.resultsCounter}>
            <Text style={styles.resultsText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
            </Text>
          </View>
        )}

        <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
              {searchQuery && (
                <Text style={styles.emptyHint}>
                  Try searching by product name
                </Text>
              )}
            </View>
          ) : (
            filteredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productItem}
                onPress={() => selectProduct(product)}
              >
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productHandle}>@{product.handle}</Text>
                <Text style={styles.productPrice}>
                  ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shopify Product</Text>

          {selectedProduct ? (
            <View style={styles.selectedProduct}>
              <Text style={styles.selectedProductTitle}>{selectedProduct.title}</Text>
              <Text style={styles.selectedProductHandle}>@{selectedProduct.handle}</Text>
              <TouchableOpacity onPress={loadShopifyProducts}>
                <Text style={styles.changeProductText}>Change Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Select from Shopify"
              onPress={loadShopifyProducts}
              loading={loadingProducts}
              variant="secondary"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Deal title"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Deal description"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Regular Price ($)</Text>
              <TextInput
                style={styles.input}
                value={regularPrice}
                onChangeText={setRegularPrice}
                placeholder="0.00"
                placeholderTextColor="#999999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Sale Price ($)</Text>
              <TextInput
                style={styles.input}
                value={salePrice}
                onChangeText={setSalePrice}
                placeholder="0.00"
                placeholderTextColor="#999999"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity Available</Text>
            <TextInput
              style={styles.input}
              value={quantityTotal}
              onChangeText={setQuantityTotal}
              placeholder="0"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <DateTimePicker
            label="Start Date & Time"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date & time"
          />

          <DateTimePicker
            label="End Date & Time"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date & time"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Create Deal" onPress={handleSubmit} loading={loading} fullWidth />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    color: '#000000',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodyBold,
    color: '#000000',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: '#000000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    ...Typography.body,
    color: '#000000',
  },
  helperText: {
    ...Typography.caption,
    color: '#666666',
    marginTop: 4,
  },
  selectedProduct: {
    backgroundColor: '#F5F5F5',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  selectedProductTitle: {
    ...Typography.bodyBold,
    color: '#000000',
    marginBottom: 4,
  },
  selectedProductHandle: {
    ...Typography.caption,
    color: '#666666',
    marginBottom: Spacing.sm,
  },
  changeProductText: {
    ...Typography.bodyBold,
    color: '#2563EB',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    ...Typography.heading,
    color: '#000000',
  },
  cancelText: {
    ...Typography.bodyBold,
    color: '#2563EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    margin: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: '#000000',
  },
  productList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  productItem: {
    backgroundColor: '#F5F5F5',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productTitle: {
    ...Typography.bodyBold,
    color: '#000000',
    marginBottom: 4,
  },
  productHandle: {
    ...Typography.caption,
    color: '#666666',
    marginBottom: 4,
  },
  productPrice: {
    ...Typography.body,
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: '#666666',
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.caption,
    color: '#666666',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  resultsCounter: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultsText: {
    ...Typography.caption,
    color: '#666666',
  },
});
