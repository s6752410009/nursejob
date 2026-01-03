// ============================================
// TERMS OF SERVICE SCREEN - Production Ready
// ============================================

import React from 'react';
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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

interface Section {
  title: string;
  content: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    title: '1. การยอมรับข้อกำหนด',
    content: [
      'เมื่อคุณสมัครใช้บริการ NurseJob คุณตกลงที่จะผูกพันตามข้อกำหนดและเงื่อนไขการใช้งานนี้ หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดใช้บริการของเรา',
      'เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดการใช้งานได้ตลอดเวลา โดยจะแจ้งให้ทราบผ่านแอปพลิเคชันหรืออีเมล การใช้บริการต่อหลังจากมีการเปลี่ยนแปลง ถือว่าคุณยอมรับข้อกำหนดใหม่',
    ],
  },
  {
    title: '2. คำจำกัดความ',
    content: [
      '"NurseJob" หรือ "แพลตฟอร์ม" หมายถึง แอปพลิเคชันมือถือและเว็บไซต์ที่ให้บริการหางานสำหรับพยาบาลและบุคลากรทางการแพทย์',
      '"ผู้ใช้งาน" หมายถึง บุคคลที่สมัครและใช้บริการ NurseJob ซึ่งรวมถึงพยาบาลผู้หางานและโรงพยาบาล/สถานพยาบาลที่ลงประกาศงาน',
      '"บริการ" หมายถึง การให้บริการทั้งหมดบนแพลตฟอร์ม NurseJob รวมถึงการค้นหางาน การสมัครงาน การลงประกาศงาน และการติดต่อสื่อสาร',
    ],
  },
  {
    title: '3. การสมัครสมาชิกและบัญชีผู้ใช้',
    content: [
      'ในการใช้บริการ คุณต้องสมัครสมาชิกและให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นปัจจุบัน',
      'คุณต้องมีอายุ 18 ปีขึ้นไปจึงจะสามารถสมัครสมาชิกได้',
      'คุณมีหน้าที่รักษาความปลอดภัยของบัญชี รหัสผ่าน และข้อมูลเข้าสู่ระบบ ไม่เปิดเผยให้ผู้อื่นทราบ',
      'การกระทำใดๆ ที่เกิดขึ้นภายใต้บัญชีของคุณ ถือเป็นความรับผิดชอบของคุณ',
      'หากพบว่ามีการใช้บัญชีโดยไม่ได้รับอนุญาต กรุณาแจ้งเราทันที',
    ],
  },
  {
    title: '4. ข้อกำหนดสำหรับผู้หางาน',
    content: [
      'คุณต้องเป็นพยาบาลหรือบุคลากรทางการแพทย์ที่มีใบอนุญาตประกอบวิชาชีพที่ถูกต้องตามกฎหมาย',
      'ข้อมูลในโปรไฟล์ ประวัติการศึกษา และประสบการณ์การทำงาน ต้องเป็นความจริงและถูกต้อง',
      'คุณต้องไม่ให้ข้อมูลเท็จหรือทำให้เข้าใจผิดในการสมัครงาน',
      'การตกลงเรื่องเงินเดือนและเงื่อนไขการทำงานเป็นเรื่องระหว่างคุณกับนายจ้างโดยตรง NurseJob ไม่รับผิดชอบต่อข้อตกลงดังกล่าว',
    ],
  },
  {
    title: '5. ข้อกำหนดสำหรับโรงพยาบาล/นายจ้าง',
    content: [
      'คุณต้องเป็นตัวแทนที่ได้รับอนุญาตจากโรงพยาบาลหรือสถานพยาบาลในการลงประกาศงาน',
      'ข้อมูลงานที่ลงประกาศต้องเป็นความจริง ไม่ทำให้เข้าใจผิด และเป็นไปตามกฎหมายแรงงาน',
      'ห้ามลงประกาศงานที่มีลักษณะเลือกปฏิบัติ หรือขัดต่อกฎหมาย',
      'คุณต้องปฏิบัติตามกฎหมายแรงงานและกฎหมายที่เกี่ยวข้องในการจ้างงาน',
      'การไม่ปฏิบัติตามข้อกำหนดอาจส่งผลให้บัญชีถูกระงับหรือยกเลิก',
    ],
  },
  {
    title: '6. การใช้บริการที่ยอมรับได้',
    content: [
      'คุณตกลงที่จะใช้บริการเพื่อวัตถุประสงค์ที่ถูกต้องตามกฎหมายเท่านั้น',
      'ห้ามใช้บริการเพื่อรบกวน คุกคาม หรือทำอันตรายผู้อื่น',
      'ห้ามส่งสแปม ไวรัส หรือโค้ดที่เป็นอันตราย',
      'ห้ามพยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต',
      'ห้ามเก็บรวบรวมข้อมูลผู้ใช้อื่นโดยไม่ได้รับความยินยอม',
      'ห้ามใช้ระบบอัตโนมัติเพื่อเข้าถึงบริการ เว้นแต่จะได้รับอนุญาต',
    ],
  },
  {
    title: '7. เนื้อหาของผู้ใช้',
    content: [
      'คุณยังคงเป็นเจ้าของเนื้อหาที่คุณโพสต์บนแพลตฟอร์ม แต่คุณให้สิทธิ์ NurseJob ในการใช้ แสดง และเผยแพร่เนื้อหาดังกล่าว',
      'คุณรับรองว่าเนื้อหาที่โพสต์ไม่ละเมิดสิทธิ์ของบุคคลอื่นหรือกฎหมาย',
      'เราขอสงวนสิทธิ์ในการลบเนื้อหาที่ไม่เหมาะสมหรือละเมิดข้อกำหนด',
    ],
  },
  {
    title: '8. ทรัพย์สินทางปัญญา',
    content: [
      'NurseJob และเนื้อหา โลโก้ ดีไซน์ ซอฟต์แวร์ บนแพลตฟอร์มเป็นทรัพย์สินของเรา ได้รับความคุ้มครองตามกฎหมายทรัพย์สินทางปัญญา',
      'คุณได้รับสิทธิ์การใช้งานแบบจำกัด ไม่เป็นเอกสิทธิ์ และเพิกถอนได้ เพื่อใช้บริการตามวัตถุประสงค์',
      'ห้ามคัดลอก ดัดแปลง ทำวิศวกรรมย้อนกลับ หรือใช้งานในทางที่ขัดต่อข้อกำหนด',
    ],
  },
  {
    title: '9. ค่าบริการและการชำระเงิน',
    content: [
      'บริการบางส่วนอาจมีค่าใช้จ่าย ซึ่งจะแจ้งให้ทราบอย่างชัดเจนก่อนการซื้อ',
      'การชำระเงินเป็นที่สิ้นสุดและไม่สามารถขอคืนได้ เว้นแต่จะระบุไว้เป็นอย่างอื่น',
      'ราคาอาจมีการเปลี่ยนแปลงโดยจะแจ้งให้ทราบล่วงหน้า',
      'คุณมีหน้าที่รับผิดชอบค่าใช้จ่ายในการเข้าถึงอินเทอร์เน็ตและอุปกรณ์',
    ],
  },
  {
    title: '10. ข้อจำกัดความรับผิด',
    content: [
      'NurseJob ให้บริการแบบ "ตามสภาพ" และ "ตามที่มี" โดยไม่มีการรับประกันใดๆ',
      'เราไม่รับประกันความถูกต้อง ความสมบูรณ์ หรือความน่าเชื่อถือของข้อมูลบนแพลตฟอร์ม',
      'เราไม่รับผิดชอบต่อการกระทำของผู้ใช้งานคนอื่นหรือนายจ้าง',
      'ไม่ว่ากรณีใดๆ NurseJob จะไม่รับผิดชอบต่อความเสียหายทางอ้อม โดยบังเอิญ หรือเป็นผลสืบเนื่อง',
      'ความรับผิดสูงสุดของเราไม่เกินจำนวนเงินที่คุณชำระให้เราในช่วง 12 เดือนที่ผ่านมา',
    ],
  },
  {
    title: '11. การยกเลิกและระงับบัญชี',
    content: [
      'คุณสามารถยกเลิกบัญชีได้ตลอดเวลาผ่านการตั้งค่าในแอป',
      'เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของคุณหากละเมิดข้อกำหนด',
      'เมื่อบัญชีถูกยกเลิก ข้อมูลของคุณจะถูกลบตามนโยบายความเป็นส่วนตัว',
    ],
  },
  {
    title: '12. กฎหมายที่ใช้บังคับ',
    content: [
      'ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย',
      'ข้อพิพาทที่เกิดขึ้นจะถูกระงับโดยศาลที่มีเขตอำนาจในประเทศไทย',
    ],
  },
  {
    title: '13. การติดต่อ',
    content: [
      'หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน สามารถติดต่อเราได้ที่:',
      'อีเมล: legal@nursejob.th',
      'โทรศัพท์: 02-123-4567',
      'ที่อยู่: 123 อาคาร NurseJob, ถนนสุขุมวิท, กรุงเทพฯ 10110',
    ],
  },
];

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ข้อกำหนดการใช้งาน</Text>
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
          <Text style={styles.introText}>
            ยินดีต้อนรับสู่ NurseJob กรุณาอ่านข้อกำหนดและเงื่อนไขการใช้งานอย่างละเอียดก่อนใช้บริการ 
            การใช้บริการของเราถือว่าคุณยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดเหล่านี้
          </Text>
        </View>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.map((paragraph, pIndex) => (
              <Text key={pIndex} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2568 NurseJob. สงวนลิขสิทธิ์.
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
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  introText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    lineHeight: 22,
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
});
