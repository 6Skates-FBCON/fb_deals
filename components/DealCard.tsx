import { TouchableOpacity, View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getDealStatus, getTimeRemaining, formatPrice } from '@/utils/dealUtils';
import { Clock, Flame } from 'lucide-react-native';
import { EnrichedDeal } from '@/types/deal';

interface DealCardProps {
  deal: EnrichedDeal;
  onPress: () => void;
  variant?: 'spotlight' | 'list' | 'grid';
}

export function DealCard({ deal, onPress, variant = 'list' }: DealCardProps) {
  const status = getDealStatus(deal);
  const timeRemaining = getTimeRemaining(deal.end_date);
  const isSpotlight = variant === 'spotlight';
  const isGrid = variant === 'grid';

  const displayImage =
    deal.shopifyProduct?.images?.[0]?.url || deal.image_url;
  const displayTitle = deal.title;
  const displayPrice = deal.sale_price;
  const displayRegularPrice = deal.regular_price;
  const displayQuantity = deal.quantity_remaining;

  const renderStatusBadge = () => {
    if (status === 'sold_out') {
      return (
        <LinearGradient
          colors={['#2C2C2E', '#1C1C1E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badge, styles.soldOutBadge]}
        >
          <View style={styles.soldOutStripes} />
          <Text style={styles.soldOutText}>SOLD OUT</Text>
        </LinearGradient>
      );
    }

    if (status === 'active') {
      return (
        <View style={[styles.badge, styles.activeBadge]}>
          <Flame size={14} color={Colors.white} />
          <Text style={styles.activeText}>LIVE NOW</Text>
        </View>
      );
    }

    if (status === 'coming_soon') {
      return (
        <View style={[styles.badge, styles.comingSoonBadge]}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      );
    }

    return null;
  };

  if (isGrid) {
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
        activeOpacity={0.9}
        disabled={status === 'expired'}
      >
        <ImageBackground
          source={{ uri: displayImage }}
          style={styles.gridImage}
          imageStyle={styles.gridImageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(232,67,157,0.3)', 'rgba(0,0,0,0.9)']}
            style={styles.gridGradient}
          >
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle} numberOfLines={2}>
                {displayTitle}
              </Text>
              <Text style={styles.gridPrice}>{formatPrice(displayPrice)}</Text>
            </View>
          </LinearGradient>
          {renderStatusBadge()}
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSpotlight && styles.spotlightCard,
        status === 'coming_soon' && styles.comingSoonCard,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={status === 'expired'}
    >
      {status === 'active' && (
        <View style={styles.ctaHeader}>
          <Text style={styles.ctaText}>ACT NOW ON THIS DEAL!</Text>
        </View>
      )}
      <View style={styles.cardInner}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: displayImage }}
            style={styles.squareImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContent}>
          {renderStatusBadge()}

          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>

          <View style={styles.priceBlock}>
            <Text style={styles.salePrice}>
              {formatPrice(displayPrice)}
            </Text>
            <Text style={styles.regularPrice}>
              {formatPrice(displayRegularPrice)}
            </Text>
          </View>

          {status === 'active' && (
            <View style={styles.timeContainer}>
              <Clock size={14} color={Colors.white} />
              <Text style={styles.timeText}>
                Ends in {timeRemaining}
              </Text>
            </View>
          )}

          {status === 'active' && displayQuantity < 10 && (
            <View style={styles.urgencyContainer}>
              <Text style={styles.urgencyText}>
                Only {displayQuantity} left!
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  spotlightCard: {
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  comingSoonCard: {
    opacity: 0.7,
  },
  cardInner: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  gridCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gridImage: {
    width: '100%',
    height: 200,
  },
  gridImageStyle: {
    borderRadius: BorderRadius.xl,
  },
  gridGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  gridContent: {
    gap: 4,
  },
  gridTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 14,
  },
  gridPrice: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#FF5757',
  },
  soldOutBadge: {
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  soldOutStripes: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    opacity: 0.15,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 3,
    borderColor: '#48484A',
    borderStyle: 'solid',
  },
  comingSoonBadge: {
    backgroundColor: Colors.charcoal,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  soldOutText: {
    ...Typography.smallBold,
    color: '#8E8E93',
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comingSoonText: {
    ...Typography.smallBold,
    color: Colors.white,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 20,
  },
  priceBlock: {
    gap: 4,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  regularPrice: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#8E8E93',
    textDecorationLine: 'line-through' as const,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.white,
  },
  urgencyContainer: {
    backgroundColor: '#FF453A20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF453A',
  },
  ctaHeader: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
});
