// ============================================
// PRIVACY POLICY SCREEN - Production Ready
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';

interface Section {
  title: string;
  content: string[];
  bullets?: string[];
}

const PRIVACY_SECTIONS: Section[] = [
  {
    title: '1. ข้อมูลที่เราเก็บรวบรวม',
    content: [
      'เราเก็บรวบรวมข้อมูลเพื่อให้บริการที่ดีที่สุดแก่คุณ ข้อมูลที่เก็บรวบรวมแบ่งเป็นประเภทต่างๆ ดังนี้:',
    ],
    bullets: [
      'ข้อมูลส่วนบุคคล: ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์, ที่อยู่, วันเกิด',
      'ข้อมูลวิชาชีพ: ใบอนุญาตประกอบวิชาชีพ, ประวัติการศึกษา, ประสบการณ์ทำงาน, ทักษะ',
      'ข้อมูลบัญชี: ชื่อผู้ใช้, รหัสผ่าน (เข้ารหัส), การตั้งค่าบัญชี',
      'ข้อมูลการใช้งาน: ประวัติการค้นหา, งานที่ดู, การสมัครงาน, การโต้ตอบกับแอป',
      'ข้อมูลอุปกรณ์: ประเภทอุปกรณ์, ระบบปฏิบัติการ, ID อุปกรณ์, ที่อยู่ IP',
      'ข้อมูลตำแหน่ง: ตำแหน่งที่ตั้งโดยประมาณ (หากอนุญาต) เพื่อแนะนำงานในพื้นที่',
    ],
  },
  {
    title: '2. วิธีการเก็บรวบรวมข้อมูล',
    content: [
      'เราเก็บรวบรวมข้อมูลจากหลายช่องทาง:',
    ],
    bullets: [
      'จากคุณโดยตรง: เมื่อสมัครสมาชิก กรอกโปรไฟล์ สมัครงาน หรือติดต่อเรา',
      'อัตโนมัติ: ผ่านคุกกี้และเทคโนโลยีติดตามเมื่อใช้บริการ',
      'จากบุคคลที่สาม: ผู้ให้บริการยืนยันตัวตน, บริการวิเคราะห์ข้อมูล',
    ],
  },
  {
    title: '3. วัตถุประสงค์ในการใช้ข้อมูล',
    content: [
      'เราใช้ข้อมูลของคุณเพื่อวัตถุประสงค์ดังต่อไปนี้:',
    ],
    bullets: [
      'ให้บริการ: ค้นหางาน, สมัครงาน, ติดต่อนายจ้าง, แชท',
      'ปรับแต่งประสบการณ์: แนะนำงานที่ตรงใจ, ปรับแต่งเนื้อหา',
      'สื่อสาร: ส่งการแจ้งเตือน, อัปเดต, โปรโมชั่น (ตามความยินยอม)',
      'ยืนยันตัวตน: ตรวจสอบใบอนุญาตวิชาชีพและข้อมูลประกอบ',
      'วิเคราะห์และปรับปรุง: พัฒนาบริการ, วิเคราะห์การใช้งาน',
      'รักษาความปลอดภัย: ป้องกันการฉ้อโกง, ตรวจจับภัยคุกคาม',
      'ปฏิบัติตามกฎหมาย: เก็บข้อมูลตามที่กฎหมายกำหนด',
    ],
  },
  {
    title: '4. การแบ่งปันข้อมูล',
    content: [
      'เราอาจแบ่งปันข้อมูลของคุณกับ:',
    ],
    bullets: [
      'นายจ้าง/โรงพยาบาล: โปรไฟล์และข้อมูลที่เกี่ยวข้องเมื่อคุณสมัครงาน',
      'ผู้ให้บริการ: บริษัทที่ช่วยดำเนินการบริการ (โฮสต์, อีเมล, วิเคราะห์)',
      'พาร์ทเนอร์: หน่วยงานรับรองวิชาชีพ (ตามความจำเป็น)',
      'ทางกฎหมาย: หน่วยงานรัฐตามที่กฎหมายกำหนด',
      'การควบรวมกิจการ: หากมีการเปลี่ยนแปลงโครงสร้างธุรกิจ',
    ],
  },
  {
    title: '5. การรักษาความปลอดภัยข้อมูล',
    content: [
      'เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม:',
    ],
    bullets: [
      'เข้ารหัสข้อมูลระหว่างการส่งผ่าน (SSL/TLS)',
      'เข้ารหัสรหัสผ่านด้วย bcrypt',
      'จำกัดการเข้าถึงข้อมูลเฉพาะพนักงานที่จำเป็น',
      'ตรวจสอบความปลอดภัยระบบเป็นประจำ',
      'สำรองข้อมูลอย่างสม่ำเสมอ',
      'ปฏิบัติตามมาตรฐานความปลอดภัยสากล',
    ],
  },
  {
    title: '6. สิทธิ์ของคุณ',
    content: [
      'คุณมีสิทธิ์เกี่ยวกับข้อมูลส่วนบุคคลดังนี้:',
    ],
    bullets: [
      'สิทธิ์ในการเข้าถึง: ขอดูข้อมูลที่เราเก็บเกี่ยวกับคุณ',
      'สิทธิ์ในการแก้ไข: แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่ครบถ้วน',
      'สิทธิ์ในการลบ: ขอให้ลบข้อมูลของคุณ',
      'สิทธิ์ในการจำกัดการประมวลผล: จำกัดการใช้ข้อมูลบางอย่าง',
      'สิทธิ์ในการโอนย้ายข้อมูล: ขอรับข้อมูลในรูปแบบที่อ่านได้',
      'สิทธิ์ในการคัดค้าน: คัดค้านการประมวลผลข้อมูลบางกรณี',
      'สิทธิ์ในการถอนความยินยอม: ถอนความยินยอมได้ตลอดเวลา',
    ],
  },
  {
    title: '7. คุกกี้และเทคโนโลยีติดตาม',
    content: [
      'เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อ:',
    ],
    bullets: [
      'จดจำการเข้าสู่ระบบและการตั้งค่า',
      'วิเคราะห์การใช้งานและปรับปรุงบริการ',
      'แสดงเนื้อหาที่ตรงใจ',
      'วัดประสิทธิภาพการตลาด',
    ],
  },
  {
    title: '8. การเก็บรักษาข้อมูล',
    content: [
      'เราเก็บรักษาข้อมูลของคุณตราบเท่าที่:',
    ],
    bullets: [
      'บัญชียังใช้งานอยู่หรือจำเป็นต่อการให้บริการ',
      'จำเป็นต้องเก็บตามกฎหมาย (เช่น ข้อมูลทางบัญชี)',
      'มีความจำเป็นตามวัตถุประสงค์ทางธุรกิจที่ชอบด้วยกฎหมาย',
      'โดยทั่วไป เมื่อลบบัญชี ข้อมูลจะถูกลบภายใน 30 วัน ยกเว้นที่ต้องเก็บตามกฎหมาย',
    ],
  },
  {
    title: '9. ข้อมูลของผู้เยาว์',
    content: [
      'บริการของเรามีไว้สำหรับผู้ที่มีอายุ 18 ปีขึ้นไปเท่านั้น เราไม่ได้เจตนาเก็บข้อมูลจากผู้เยาว์ หากพบว่าเก็บข้อมูลดังกล่าวโดยไม่ได้ตั้งใจ เราจะลบทิ้งทันที',
    ],
  },
  {
    title: '10. การเปลี่ยนแปลงนโยบาย',
    content: [
      'เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว โดยจะแจ้งให้ทราบผ่านแอปหรืออีเมลก่อนมีผลบังคับใช้ การใช้บริการต่อหลังการเปลี่ยนแปลงถือว่าคุณยอมรับนโยบายใหม่',
    ],
  },
  {
    title: '11. การติดต่อ',
    content: [
      'หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ของคุณ โปรดติดต่อ:',
    ],
    bullets: [
      'อีเมล: privacy@nursejob.th',
      'โทรศัพท์: 02-123-4567',
      'ที่อยู่: 123 อาคาร NurseJob, ถนนสุขุมวิท, กรุงเทพฯ 10110',
      'เจ้าหน้าที่คุ้มครองข้อมูล: dpo@nursejob.th',
    ],
  },
];

export default function PrivacyScreen() {
  const navigation = useNavigation();

  const handleContactDPO = () => {
    Linking.openURL('mailto:privacy@nursejob.th?subject=คำถามเกี่ยวกับความเป็นส่วนตัว');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>นโยบายความเป็นส่วนตัว</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.lastUpdatedText}>อัปเดตล่าสุด: 1 มกราคม 2568</Text>
        </View>

        {/* Introduction */}
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.introTitle}>ความเป็นส่วนตัวของคุณสำคัญสำหรับเรา</Text>
          <Text style={styles.introText}>
            NurseJob มุ่งมั่นปกป้องข้อมูลส่วนบุคคลของคุณ นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม 
            ใช้ และปกป้องข้อมูลของคุณตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </Text>
        </View>

        {/* Quick Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>สรุปสั้นๆ</Text>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.summaryText}>เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.summaryText}>ข้อมูลของคุณได้รับการเข้ารหัสและปกป้อง</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.summaryText}>เราไม่ขายข้อมูลของคุณให้บุคคลภายนอก</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.summaryText}>คุณสามารถลบบัญชีและข้อมูลได้ตลอดเวลา</Text>
          </View>
        </View>

        {/* Sections */}
        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.map((paragraph, pIndex) => (
              <Text key={pIndex} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets && (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet, bIndex) => (
                  <View key={bIndex} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Contact Card */}
        <TouchableOpacity style={styles.contactCard} onPress={handleContactDPO}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail" size={24} color={COLORS.white} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>มีคำถามเกี่ยวกับความเป็นส่วนตัว?</Text>
            <Text style={styles.contactSubtitle}>ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลของเรา</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2568 NurseJob. สงวนลิขสิทธิ์.
          </Text>
          <Text style={styles.footerSubtext}>
            นโยบายนี้เป็นไปตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  lastUpdatedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  intro: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  introTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  introText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.successLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  paragraph: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  bulletList: {
    marginTop: SPACING.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.lg,
    ...SHADOWS.sm,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  footerSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
