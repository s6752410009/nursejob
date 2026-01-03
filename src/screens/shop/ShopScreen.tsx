// ============================================
// SHOP SCREEN - ร้านค้า / ซื้อบริการ
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, ModalContainer } from '../../components/common';
import CustomAlert, { AlertState, initialAlertState, createAlert } from '../../components/common/CustomAlert';
import { getUserSubscription, getSubscriptionStatusDisplay, canUseFreeUrgent } from '../../services/subscriptionService';
import { PRICING, SUBSCRIPTION_PLANS, Subscription } from '../../types';

// ============================================
// Component
// ============================================
export default function ShopScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState>(initialAlertState);
  const [hasFreeUrgent, setHasFreeUrgent] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const closeAlert = () => setAlert(initialAlertState);

  // Load subscription data
  useEffect(() => {
    loadSubscription();
  }, [user?.uid]);

  const loadSubscription = async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const sub = await getUserSubscription(user.uid);
      setSubscription(sub);
      
      // Check if user has free urgent available (Premium bonus)
      const freeUrgent = await canUseFreeUrgent(user.uid);
      setHasFreeUrgent(freeUrgent);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = (item: 'premium' | 'extraPost' | 'extendPost' | 'urgent') => {
    const prices = {
      premium: PRICING.subscription,
      extraPost: PRICING.extraPost,
      extendPost: PRICING.extendPost,
      urgent: PRICING.urgentPost,
    };

    const titles = {
      premium: '👑 Premium รายเดือน',
      extraPost: '📝 โพสต์เพิ่ม 1 ครั้ง',
      extendPost: '⏰ ต่ออายุโพสต์ 1 วัน',
      urgent: '⚡ ปุ่มด่วน',
    };

    setAlert({
      ...createAlert.info(titles[item], `ราคา: ฿${prices[item]}\n\nระบบชำระเงินกำลังพัฒนา\nติดต่อ admin เพื่อซื้อบริการ`),
      buttons: [
        { text: 'ปิด', onPress: closeAlert },
        { 
          text: '📞 ติดต่อ Admin', 
          onPress: () => {
            closeAlert();
            // TODO: Open LINE or contact
            setAlert({ ...createAlert.info('ติดต่อ Admin', 'LINE: @nursejob\nFacebook: NurseJob Thailand') } as AlertState);
          }
        },
      ],
    } as AlertState);
  };

  const subscriptionStatus = subscription 
    ? getSubscriptionStatusDisplay(subscription) 
    : null;

  const isPremium = subscription?.plan === 'premium';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 ร้านค้า</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        <Card style={styles.currentPlanCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>แพ็กเกจปัจจุบัน</Text>
            {subscriptionStatus && (
              <View style={[styles.planBadge, { backgroundColor: isPremium ? '#FFD700' : '#E0E0E0' }]}>
                <Text style={[styles.planBadgeText, { color: isPremium ? '#000' : '#666' }]}>
                  {subscriptionStatus.planName}
                </Text>
              </View>
            )}
          </View>
          
          {isPremium && subscriptionStatus?.expiresText && (
            <Text style={styles.planExpiry}>{subscriptionStatus.expiresText}</Text>
          )}

          {!isPremium && (
            <View style={styles.freeLimit}>
              <Text style={styles.freeLimitText}>
                📝 โพสต์ได้: {SUBSCRIPTION_PLANS.free.maxPostsPerDay} ครั้ง/วัน
              </Text>
              <Text style={styles.freeLimitText}>
                📅 โพสต์อยู่: {SUBSCRIPTION_PLANS.free.postExpiryDays} วัน
              </Text>
            </View>
          )}
        </Card>

        {/* Premium Subscription */}
        <Card style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumEmoji}>👑</Text>
            <View style={styles.premiumTitleRow}>
              <Text style={styles.premiumTitle}>Premium</Text>
              <Text style={styles.premiumPrice}>฿{PRICING.subscription}<Text style={styles.premiumPriceUnit}>/เดือน</Text></Text>
            </View>
          </View>

          <View style={styles.premiumBenefits}>
            {SUBSCRIPTION_PLANS.premium.features.map((feature, index) => (
              <View key={index} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                <Text style={styles.benefitText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isPremium ? (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.activeBadgeText}>ใช้งานอยู่</Text>
            </View>
          ) : (
            <Button
              title="อัพเกรดเป็น Premium"
              onPress={() => handlePurchase('premium')}
              style={styles.premiumButton}
            />
          )}
        </Card>

        {/* Individual Items */}
        <Text style={styles.sectionTitle}>💡 ซื้อแยกรายครั้ง</Text>

        {/* Extra Post */}
        <Card style={styles.itemCard}>
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>📝</Text>
              <View>
                <Text style={styles.itemTitle}>โพสต์เพิ่ม</Text>
                <Text style={styles.itemDesc}>เพิ่มโพสต์อีก 1 ครั้งเมื่อครบ limit</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => handlePurchase('extraPost')}
            >
              <Text style={styles.buyButtonText}>฿{PRICING.extraPost}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Extend Post */}
        <Card style={styles.itemCard}>
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>⏰</Text>
              <View>
                <Text style={styles.itemTitle}>ต่ออายุโพสต์</Text>
                <Text style={styles.itemDesc}>ต่ออายุโพสต์เพิ่มอีก 1 วัน</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => handlePurchase('extendPost')}
            >
              <Text style={styles.buyButtonText}>฿{PRICING.extendPost}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Urgent Button */}
        <Card style={styles.itemCard}>
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>⚡</Text>
              <View>
                <Text style={styles.itemTitle}>ปุ่มด่วน</Text>
                <Text style={styles.itemDesc}>ทำให้ประกาศโดดเด่นขึ้น</Text>
                {hasFreeUrgent && (
                  <View style={styles.freeTag}>
                    <Text style={styles.freeTagText}>🎁 มีสิทธิ์ฟรี 1 ครั้ง!</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyButton, hasFreeUrgent && styles.freeButton]}
              onPress={() => {
                if (hasFreeUrgent) {
                  setAlert({ ...createAlert.info('🎁 สิทธิ์ฟรี Premium', 'คุณมีสิทธิ์ใช้ปุ่มด่วนฟรี 1 ครั้ง!\n\nไปที่ "ประกาศของฉัน" แล้วเลือกโพสต์ที่ต้องการทำให้ด่วน') } as AlertState);
                } else {
                  handlePurchase('urgent');
                }
              }}
            >
              <Text style={[styles.buyButtonText, hasFreeUrgent && styles.freeButtonText]}>
                {hasFreeUrgent ? 'ฟรี!' : `฿${PRICING.urgentPost}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Pricing Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 สรุปราคา</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Premium รายเดือน</Text>
            <Text style={styles.summaryValue}>฿{PRICING.subscription}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>โพสต์เพิ่ม</Text>
            <Text style={styles.summaryValue}>฿{PRICING.extraPost}/ครั้ง</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ต่ออายุโพสต์</Text>
            <Text style={styles.summaryValue}>฿{PRICING.extendPost}/วัน</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ปุ่มด่วน</Text>
            <Text style={styles.summaryValue}>฿{PRICING.urgentPost}/ครั้ง</Text>
          </View>
        </Card>

        {/* Contact */}
        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞 ติดต่อเรา</Text>
          <Text style={styles.contactText}>
            หากต้องการซื้อบริการหรือมีคำถาม{'\n'}
            ติดต่อได้ที่:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactItem}>LINE: @nursejob</Text>
            <Text style={styles.contactItem}>Facebook: NurseJob Thailand</Text>
          </View>
        </Card>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },

  // Current Plan
  currentPlanCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  planBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  planBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  planExpiry: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  freeLimit: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
  },
  freeLimitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  // Premium Card
  premiumCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  premiumEmoji: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  premiumTitleRow: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  premiumPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FF8F00',
  },
  premiumPriceUnit: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  premiumBenefits: {
    marginBottom: SPACING.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  benefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#fff',
  },

  // Section Title
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Item Card
  itemCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  itemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  buyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#fff',
  },
  freeButton: {
    backgroundColor: '#4ADE80',
  },
  freeButtonText: {
    color: '#fff',
  },
  freeTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  freeTagText: {
    fontSize: FONT_SIZES.xs,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Summary Card
  summaryCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#F5F5F5',
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Contact Card
  contactCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#E3F2FD',
  },
  contactTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  contactText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  contactInfo: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  contactItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 2,
  },
});
