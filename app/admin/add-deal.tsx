import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Search } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ShopifyProduct, getAllProducts } from '@/lib/shopify';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shopifyHandle, setShopifyHandle] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return shopifyProducts;

    const query = searchQuery.toLowerCase();
    return shopifyProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.handle.toLowerCase().includes(query)
    );
  }, [shopifyProducts, searchQuery]);

  const loadShopifyProducts = async () => {
    setLoadingProducts(true);
    try {
      const products = await getAllProducts(50);
      setShopifyProducts(products);
      setShowProductPicker(true);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load Shopify products');
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
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!regularPrice || !salePrice) {
      Alert.alert('Error', 'Please enter regular and sale prices');
      return;
    }

    if (!quantityTotal) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please enter start and end dates');
      return;
    }

    if (!shopifyHandle) {
      Alert.alert('Error', 'Please select a Shopify product');
      return;
    }

    const regPrice = parseFloat(regularPrice);
    const salePriceNum = parseFloat(salePrice);

    if (isNaN(regPrice) || isNaN(salePriceNum)) {
      Alert.alert('Error', 'Invalid price format');
      return;
    }

    if (salePriceNum >= regPrice) {
      Alert.alert('Error', 'Sale price must be less than regular price');
      return;
    }

    setLoading(true);

    try {
      console.log('[ADD DEAL] Attempting to create deal:', {
        title: title.trim(),
        shopifyHandle,
        startDate,
        endDate,
      });

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
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          shopify_handle: shopifyHandle,
          shopify_product_id: selectedProduct?.id || '',
        })
        .select();

      if (error) {
        console.error('[ADD DEAL] Database error:', error);
        throw error;
      }

      console.log('[ADD DEAL] Deal created successfully:', data);

      Alert.alert('Success', 'Deal created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('[ADD DEAL] Error creating deal:', error);
      Alert.alert('Error', error.message || 'Failed to create deal');
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
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={Colors.white}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
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
              placeholderTextColor={Colors.white}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Deal description"
              placeholderTextColor={Colors.white}
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
                placeholderTextColor={Colors.white}
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
                placeholderTextColor={Colors.white}
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
              placeholderTextColor={Colors.white}
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
    backgroundColor: Colors.darkBg,
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
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodyBold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.white,
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
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.white,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedProduct: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedProductTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    marginBottom: 4,
  },
  selectedProductHandle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  changeProductText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerTitle: {
    ...Typography.heading,
    color: Colors.white,
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    margin: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.white,
  },
  productList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  productItem: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    marginBottom: 4,
  },
  productHandle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  productPrice: {
    ...Typography.body,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
