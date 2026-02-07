// ============================================
// IN-APP PURCHASE SERVICE
// ============================================
// รองรับ Apple IAP + Google Play Billing
// ใช้ react-native-iap (ติดตั้งเมื่อพร้อม build native)
//
// ⚠️ ตอนนี้ทำงานใน "mock mode" เพราะยังไม่มี:
//   - Apple Developer Account / App Store Connect products
//   - Google Play Developer / Play Console products
//   - react-native-iap installed
//
// เมื่อพร้อม:
//   1. npm install react-native-iap
//   2. สร้าง Products ใน App Store Connect + Play Console
//   3. เปลี่ยน USE_MOCK_IAP = false
//   4. Deploy Cloud Function verifyReceipt
// ============================================

import { Platform, Alert } from 'react-native';
import { completePurchase as completePurchaseInDB, purchaseSubscription, purchaseSinglePost } from './pricingService';
import { upgradeToPremium } from './subscriptionService';

// ============================================
// CONFIG
// ============================================

// 🔧 เปลี่ยนเป็น false เมื่อพร้อม production
const USE_MOCK_IAP = true;

// Product IDs — ต้องตรงกับ App Store Connect / Google Play Console
export const IAP_PRODUCTS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'com.nursego.app.premium.monthly',
    android: 'com.nursego.app.premium.monthly',
    default: 'com.nursego.app.premium.monthly',
  }) as string,
  EXTRA_POST: Platform.select({
    ios: 'com.nursego.app.extra.post',
    android: 'com.nursego.app.extra.post',
    default: 'com.nursego.app.extra.post',
  }) as string,
  EXTEND_POST: Platform.select({
    ios: 'com.nursego.app.extend.post',
    android: 'com.nursego.app.extend.post',
    default: 'com.nursego.app.extend.post',
  }) as string,
  URGENT_POST: Platform.select({
    ios: 'com.nursego.app.urgent.post',
    android: 'com.nursego.app.urgent.post',
    default: 'com.nursego.app.urgent.post',
  }) as string,
};

// All product IDs for fetching
export const ALL_PRODUCT_IDS = [
  IAP_PRODUCTS.PREMIUM_MONTHLY,
  IAP_PRODUCTS.EXTRA_POST,
  IAP_PRODUCTS.EXTEND_POST,
  IAP_PRODUCTS.URGENT_POST,
];

// Subscription product IDs
export const SUBSCRIPTION_PRODUCT_IDS = [
  IAP_PRODUCTS.PREMIUM_MONTHLY,
];

// ============================================
// Types
// ============================================
export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
}

export interface IAPPurchaseResult {
  success: boolean;
  transactionId?: string;
  productId?: string;
  receipt?: string;
  error?: string;
}

// ============================================
// IAP Manager Class
// ============================================
class IAPManager {
  private isInitialized = false;
  private products: IAPProduct[] = [];
  private purchaseListener: any = null;

  // ==========================================
  // Initialize
  // ==========================================
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (USE_MOCK_IAP) {
      console.log('🛒 IAP: Running in MOCK mode');
      this.isInitialized = true;
      return true;
    }

    try {
      // Dynamic import เพื่อไม่ให้ crash ถ้ายังไม่ได้ install
      const RNIap = await this.getRNIap();
      if (!RNIap) return false;

      await RNIap.initConnection();
      console.log('🛒 IAP: Connected to store');

      // Setup purchase listener
      this.purchaseListener = RNIap.purchaseUpdatedListener(
        async (purchase: any) => {
          console.log('🛒 Purchase update:', purchase.productId);
          
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Verify receipt on server
              await this.verifyReceipt(receipt, purchase.productId);
              
              // Acknowledge purchase (required for Google Play)
              if (Platform.OS === 'android') {
                await RNIap.acknowledgePurchaseAndroid({
                  token: purchase.purchaseToken,
                  developerPayload: '',
                });
              }
              
              // Finish transaction
              await RNIap.finishTransaction({ purchase, isConsumable: !SUBSCRIPTION_PRODUCT_IDS.includes(purchase.productId) });
              
              console.log('✅ Purchase completed:', purchase.productId);
            } catch (error) {
              console.error('❌ Purchase verification failed:', error);
            }
          }
        }
      );

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ IAP initialization failed:', error);
      return false;
    }
  }

  // ==========================================
  // Get Products
  // ==========================================
  async getProducts(): Promise<IAPProduct[]> {
    if (USE_MOCK_IAP) {
      return this.getMockProducts();
    }

    try {
      const RNIap = await this.getRNIap();
      if (!RNIap) return this.getMockProducts();

      // Fetch consumable products
      const products = await RNIap.getProducts({ skus: ALL_PRODUCT_IDS });
      
      // Fetch subscriptions
      const subscriptions = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_PRODUCT_IDS });

      const allProducts: IAPProduct[] = [
        ...subscriptions.map((sub: any) => ({
          productId: sub.productId,
          title: sub.title || sub.name,
          description: sub.description,
          price: sub.price || '0',
          currency: sub.currency || 'THB',
          localizedPrice: sub.localizedPrice || `฿${sub.price}`,
        })),
        ...products.map((product: any) => ({
          productId: product.productId,
          title: product.title || product.name,
          description: product.description,
          price: product.price || '0',
          currency: product.currency || 'THB',
          localizedPrice: product.localizedPrice || `฿${product.price}`,
        })),
      ];

      this.products = allProducts;
      return allProducts;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return this.getMockProducts();
    }
  }

  // ==========================================
  // Request Purchase
  // ==========================================
  async requestPurchase(
    productId: string,
    userId: string,
    userName: string,
  ): Promise<IAPPurchaseResult> {
    if (USE_MOCK_IAP) {
      return this.mockPurchase(productId, userId, userName);
    }

    try {
      const RNIap = await this.getRNIap();
      if (!RNIap) {
        return { success: false, error: 'IAP not available' };
      }

      // Check if it's a subscription or consumable
      if (SUBSCRIPTION_PRODUCT_IDS.includes(productId)) {
        await RNIap.requestSubscription({ sku: productId });
      } else {
        await RNIap.requestPurchase({ sku: productId });
      }

      // Purchase result will be handled by purchaseUpdatedListener
      return {
        success: true,
        productId,
      };
    } catch (error: any) {
      if (error.code === 'E_USER_CANCELLED') {
        return { success: false, error: 'ผู้ใช้ยกเลิกการซื้อ' };
      }
      console.error('❌ Purchase error:', error);
      return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการซื้อ' };
    }
  }

  // ==========================================
  // Verify Receipt (Server-side via Cloud Function)
  // ==========================================
  private async verifyReceipt(receipt: string, productId: string): Promise<boolean> {
    try {
      // Call Firebase Cloud Function to verify receipt
      const response = await fetch(
        'https://us-central1-nursejob-th.cloudfunctions.net/verifyIAPReceipt',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receipt,
            productId,
            platform: Platform.OS,
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Receipt verified successfully');
        return true;
      } else {
        console.error('❌ Receipt verification failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Receipt verification error:', error);
      return false;
    }
  }

  // ==========================================
  // Restore Purchases (สำหรับ Apple ต้องมีปุ่มนี้)
  // ==========================================
  async restorePurchases(): Promise<IAPPurchaseResult[]> {
    if (USE_MOCK_IAP) {
      return [{ success: false, error: 'Mock mode: ไม่มีรายการซื้อที่จะกู้คืน' }];
    }

    try {
      const RNIap = await this.getRNIap();
      if (!RNIap) return [];

      const purchases = await RNIap.getAvailablePurchases();
      
      return purchases.map((purchase: any) => ({
        success: true,
        transactionId: purchase.transactionId,
        productId: purchase.productId,
        receipt: purchase.transactionReceipt,
      }));
    } catch (error: any) {
      console.error('❌ Restore purchases error:', error);
      return [{ success: false, error: error.message }];
    }
  }

  // ==========================================
  // Cleanup
  // ==========================================
  cleanup() {
    if (this.purchaseListener) {
      this.purchaseListener.remove();
      this.purchaseListener = null;
    }
    this.isInitialized = false;
  }

  // ==========================================
  // Private: Get react-native-iap module
  // ==========================================
  private async getRNIap(): Promise<any> {
    try {
      // Dynamic import — จะ fail ถ้ายังไม่ได้ install package
      const module = await import('react-native-iap');
      return module.default || module;
    } catch {
      console.warn('⚠️ react-native-iap not installed. Running in mock mode.');
      return null;
    }
  }

  // ==========================================
  // Mock Products (สำหรับ dev / mockup)
  // ==========================================
  private getMockProducts(): IAPProduct[] {
    return [
      {
        productId: IAP_PRODUCTS.PREMIUM_MONTHLY,
        title: '👑 Premium รายเดือน',
        description: 'โพสต์ไม่จำกัด + โพสต์อยู่ 30 วัน + ปุ่มด่วนฟรี 1 ครั้ง',
        price: '89',
        currency: 'THB',
        localizedPrice: '฿89',
      },
      {
        productId: IAP_PRODUCTS.EXTRA_POST,
        title: '📝 โพสต์เพิ่ม 1 ครั้ง',
        description: 'เพิ่มโพสต์อีก 1 ครั้งเมื่อครบ limit วันนี้',
        price: '19',
        currency: 'THB',
        localizedPrice: '฿19',
      },
      {
        productId: IAP_PRODUCTS.EXTEND_POST,
        title: '⏰ ต่ออายุโพสต์ 1 วัน',
        description: 'ขยายเวลาโพสต์ที่กำลังจะหมดอายุเพิ่มอีก 1 วัน',
        price: '19',
        currency: 'THB',
        localizedPrice: '฿19',
      },
      {
        productId: IAP_PRODUCTS.URGENT_POST,
        title: '⚡ ปุ่มด่วน',
        description: 'ทำให้โพสต์ของคุณโดดเด่นและอยู่ด้านบนสุด',
        price: '49',
        currency: 'THB',
        localizedPrice: '฿49',
      },
    ];
  }

  // ==========================================
  // Mock Purchase (สำหรับ dev / mockup)
  // ==========================================
  private async mockPurchase(
    productId: string,
    userId: string,
    userName: string,
  ): Promise<IAPPurchaseResult> {
    return new Promise((resolve) => {
      const product = this.getMockProducts().find(p => p.productId === productId);
      const productName = product?.title || productId;

      Alert.alert(
        '🛒 จำลองการซื้อ (Mock)',
        `${productName}\nราคา: ${product?.localizedPrice || '?'}\n\n⚠️ นี่คือโหมดทดสอบ\nระบบจ่ายเงินจริงจะเปิดเมื่อแอปขึ้น Store`,
        [
          {
            text: 'ยกเลิก',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'ผู้ใช้ยกเลิก' }),
          },
          {
            text: '✅ จำลองซื้อสำเร็จ',
            onPress: async () => {
              try {
                // Activate the purchase in database
                await this.activatePurchase(productId, userId, userName);
                
                resolve({
                  success: true,
                  transactionId: `mock_${Date.now()}`,
                  productId,
                });
              } catch (error: any) {
                resolve({ success: false, error: error.message });
              }
            },
          },
        ]
      );
    });
  }

  // ==========================================
  // Activate Purchase (ให้สินค้าจริงหลังจ่ายเงิน)
  // ==========================================
  async activatePurchase(
    productId: string,
    userId: string,
    userName: string,
  ): Promise<void> {
    switch (productId) {
      case IAP_PRODUCTS.PREMIUM_MONTHLY: {
        // สร้าง purchase record + upgrade เป็น premium
        const purchase = await purchaseSubscription(userId, userName);
        if (purchase.id) {
          await completePurchaseInDB(purchase.id, userId);
        }
        await upgradeToPremium(userId);
        break;
      }

      case IAP_PRODUCTS.EXTRA_POST: {
        const purchase = await purchaseSinglePost(userId, userName);
        if (purchase.id) {
          await completePurchaseInDB(purchase.id, userId);
        }
        break;
      }

      case IAP_PRODUCTS.EXTEND_POST:
      case IAP_PRODUCTS.URGENT_POST: {
        // TODO: Implement extend/urgent purchase activation
        console.log(`Activating ${productId} for user ${userId}`);
        break;
      }

      default:
        console.warn('Unknown product:', productId);
    }
  }
}

// ============================================
// Singleton Export
// ============================================
export const iapManager = new IAPManager();

// Convenience functions
export const initializeIAP = () => iapManager.initialize();
export const getIAPProducts = () => iapManager.getProducts();
export const requestIAPPurchase = (
  productId: string,
  userId: string,
  userName: string,
) => iapManager.requestPurchase(productId, userId, userName);
export const restoreIAPPurchases = () => iapManager.restorePurchases();
export const cleanupIAP = () => iapManager.cleanup();
