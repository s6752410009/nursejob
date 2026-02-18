// ============================================
// TERMS CONSENT MODAL - Must scroll to accept
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';

interface TermsConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsConsentModal({
  visible,
  onAccept,
  onDecline,
}: TermsConsentModalProps) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [currentTab, setCurrentTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    if (visible && typeof document !== 'undefined') {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) active.blur();
      } catch (e) {}
    }
  }, [visible]);

  // Check if scrolled to bottom
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isAtBottom) {
      setHasScrolledToEnd(true);
    }
  };

  // Terms content
  const termsContent = `
ข้อตกลงและเงื่อนไขการใช้งาน NurseGo

1. คำนิยาม
"แอปพลิเคชัน" หมายถึง NurseGo ซึ่งเป็นแพลตฟอร์มสำหรับการประกาศหาคนแทนเวรของบุคลากรทางการแพทย์
"ผู้ใช้งาน" หมายถึง บุคคลที่ลงทะเบียนและใช้งานแอปพลิเคชัน
"เนื้อหา" หมายถึง ข้อมูล ข้อความ รูปภาพ หรือสื่ออื่นๆ ที่ผู้ใช้งานโพสต์หรือแชร์ผ่านแอปพลิเคชัน

2. การลงทะเบียนและบัญชีผู้ใช้
2.1 ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการลงทะเบียน
2.2 ผู้ใช้ต้องรักษาความปลอดภัยของรหัสผ่านและบัญชีของตน
2.3 ผู้ใช้ต้องเป็นบุคลากรทางการแพทย์ที่มีใบอนุญาตประกอบวิชาชีพที่ถูกต้อง

3. การใช้งานที่ยอมรับได้
3.1 ผู้ใช้ต้องใช้งานแอปพลิเคชันเพื่อวัตถุประสงค์ที่ถูกกฎหมาย
3.2 ห้ามโพสต์เนื้อหาที่เป็นเท็จ หลอกลวง หรือทำให้เข้าใจผิด
3.3 ห้ามใช้แอปพลิเคชันเพื่อรบกวนหรือสร้างความเสียหายต่อผู้อื่น

4. ความรับผิดชอบของผู้ใช้
4.1 ผู้ใช้รับผิดชอบต่อเนื้อหาทั้งหมดที่โพสต์
4.2 ผู้ใช้รับผิดชอบในการตรวจสอบความถูกต้องของข้อมูลการทำงาน
4.3 ผู้ใช้ต้องปฏิบัติตามกฎระเบียบของสถานพยาบาลที่เกี่ยวข้อง

5. ข้อจำกัดความรับผิด
5.1 แอปพลิเคชันเป็นเพียงแพลตฟอร์มเชื่อมต่อระหว่างผู้ใช้
5.2 เราไม่รับผิดชอบต่อข้อพิพาทระหว่างผู้ใช้
5.3 เราไม่รับประกันความพร้อมใช้งานของบริการตลอดเวลา

6. การยกเลิกบัญชี
6.1 ผู้ใช้สามารถยกเลิกบัญชีได้ตลอดเวลา
6.2 เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดข้อตกลง

7. การเปลี่ยนแปลงข้อตกลง
เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อตกลงนี้โดยจะแจ้งให้ผู้ใช้ทราบล่วงหน้า

8. กฎหมายที่ใช้บังคับ
ข้อตกลงนี้อยู่ภายใต้กฎหมายของประเทศไทย

วันที่มีผลบังคับใช้: 1 มกราคม 2569
`;

  const privacyContent = `
นโยบายความเป็นส่วนตัว NurseGo

1. ข้อมูลที่เราเก็บรวบรวม
1.1 ข้อมูลส่วนบุคคล: ชื่อ อีเมล เบอร์โทรศัพท์ เลขใบอนุญาตประกอบวิชาชีพ
1.2 ข้อมูลการใช้งาน: ประวัติการใช้งาน การค้นหา การติดต่อ
1.3 ข้อมูลอุปกรณ์: ประเภทอุปกรณ์ ระบบปฏิบัติการ IP address

2. วัตถุประสงค์ในการใช้ข้อมูล
2.1 ให้บริการและปรับปรุงแอปพลิเคชัน
2.2 ติดต่อสื่อสารกับผู้ใช้
2.3 ป้องกันการฉ้อโกงและรักษาความปลอดภัย
2.4 ปฏิบัติตามกฎหมาย

3. การแบ่งปันข้อมูล
3.1 เราจะไม่ขายข้อมูลส่วนบุคคลของคุณ
3.2 เราอาจแบ่งปันข้อมูลกับ:
   - ผู้ให้บริการที่เกี่ยวข้อง (เช่น Firebase, Google)
   - หน่วยงานราชการตามที่กฎหมายกำหนด

4. การรักษาความปลอดภัยของข้อมูล
4.1 เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม
4.2 ข้อมูลถูกเข้ารหัสระหว่างการส่งและจัดเก็บ
4.3 เราจำกัดการเข้าถึงข้อมูลเฉพาะบุคลากรที่จำเป็น

5. สิทธิของเจ้าของข้อมูล
5.1 สิทธิในการเข้าถึงข้อมูลของตน
5.2 สิทธิในการแก้ไขข้อมูล
5.3 สิทธิในการลบข้อมูล
5.4 สิทธิในการถอนความยินยอม

6. การเก็บรักษาข้อมูล
ข้อมูลจะถูกเก็บรักษาตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุไว้

7. คุกกี้และเทคโนโลยีติดตาม
เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งาน

8. การเปลี่ยนแปลงนโยบาย
เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว โดยจะแจ้งให้ทราบผ่านแอปพลิเคชัน

9. การติดต่อ
หากมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อ: privacy@nursego.app

วันที่มีผลบังคับใช้: 1 มกราคม 2569
`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay} accessibilityViewIsModal={true}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>📋</Text>
            <Text style={styles.headerTitle}>ข้อตกลงการใช้งาน</Text>
            <Text style={styles.headerSubtitle}>
              กรุณาอ่านและเลื่อนลงจนสุดเพื่อยอมรับ
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'terms' && styles.tabActive]}
              onPress={() => {
                setCurrentTab('terms');
                setHasScrolledToEnd(false);
              }}
            >
              <Text style={[styles.tabText, currentTab === 'terms' && styles.tabTextActive]}>
                ข้อตกลงและเงื่อนไข
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, currentTab === 'privacy' && styles.tabActive]}
              onPress={() => {
                setCurrentTab('privacy');
                setHasScrolledToEnd(false);
              }}
            >
              <Text style={[styles.tabText, currentTab === 'privacy' && styles.tabTextActive]}>
                นโยบายความเป็นส่วนตัว
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.content}>
              {currentTab === 'terms' ? termsContent : privacyContent}
            </Text>
            <View style={styles.endMarker}>
              <Text style={styles.endMarkerText}>
                {hasScrolledToEnd ? '✅ อ่านจบแล้ว' : '👇 เลื่อนลงเพื่ออ่านต่อ'}
              </Text>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>ไม่ยอมรับ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                !hasScrolledToEnd && styles.acceptButtonDisabled,
              ]}
              onPress={onAccept}
              disabled={!hasScrolledToEnd}
            >
              <Text style={[
                styles.acceptButtonText,
                !hasScrolledToEnd && styles.acceptButtonTextDisabled,
              ]}>
                {hasScrolledToEnd ? '✅ ยอมรับ' : '⏳ กรุณาอ่านให้จบ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 350,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
    paddingVertical: SPACING.md,
  },
  endMarker: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  endMarkerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  declineButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  acceptButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});
