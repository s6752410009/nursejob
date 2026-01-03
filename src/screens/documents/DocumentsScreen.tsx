// ============================================
// DOCUMENTS SCREEN - Production Ready
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Loading, EmptyState, Button } from '../../components/common';
import {
  getUserDocuments,
  uploadDocument,
  deleteDocument,
  Document,
  DocumentType,
  getDocumentTypeLabel,
  formatFileSize,
} from '../../services/documentsService';
import { formatDate } from '../../utils/helpers';

const documentTypes: { type: DocumentType; icon: string }[] = [
  { type: 'resume', icon: 'document-text' },
  { type: 'license', icon: 'ribbon' },
  { type: 'certificate', icon: 'medal' },
  { type: 'education', icon: 'school' },
  { type: 'training', icon: 'book' },
  { type: 'id_card', icon: 'card' },
  { type: 'photo', icon: 'camera' },
  { type: 'other', icon: 'folder' },
];

export default function DocumentsScreen() {
  const { user, requireAuth } = useAuth();
  const navigation = useNavigation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const data = await getUserDocuments(user.uid);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDocuments();
  };

  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type);
    setShowTypeModal(false);

    if (type === 'photo') {
      pickImage();
    } else {
      pickDocument();
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        await handleUpload(file.uri, file.name, file.mimeType || 'application/pdf', file.size || 0);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกเอกสารได้');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการเข้าถึงรูปภาพ');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        await handleUpload(image.uri, fileName, 'image/jpeg', image.fileSize || 0);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้');
    }
  };

  const handleUpload = async (uri: string, fileName: string, mimeType: string, fileSize: number) => {
    if (!user?.uid || !selectedType) return;

    // Check file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      Alert.alert('ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์สูงสุด 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      const doc = await uploadDocument(
        user.uid,
        selectedType,
        getDocumentTypeLabel(selectedType),
        blob,
        fileName,
        mimeType
      );

      setDocuments(prev => [doc, ...prev]);
      Alert.alert('สำเร็จ', 'อัพโหลดเอกสารเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัพโหลดได้ กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
      setSelectedType(null);
    }
  };

  const handleDelete = (doc: Document) => {
    Alert.alert(
      'ลบเอกสาร',
      `ต้องการลบ "${doc.name}" หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(doc.id, doc.fileUrl);
              setDocuments(prev => prev.filter(d => d.id !== doc.id));
            } catch (error) {
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
            }
          },
        },
      ]
    );
  };

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon="documents-outline"
          title="เข้าสู่ระบบเพื่อจัดการเอกสาร"
          subtitle="อัพโหลด Resume, ใบประกอบวิชาชีพ และเอกสารอื่นๆ"
          actionLabel="เข้าสู่ระบบ"
          onAction={() => requireAuth(() => {})}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <Loading message="กำลังโหลด..." />;
  }

  const renderDocument = ({ item }: { item: Document }) => {
    const typeInfo = documentTypes.find(t => t.type === item.type);

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentIcon}>
          <Ionicons
            name={(typeInfo?.icon || 'document') as any}
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.documentMeta}>
            {getDocumentTypeLabel(item.type)} • {formatFileSize(item.fileSize)}
          </Text>
          <View style={styles.documentStatus}>
            {item.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.verifiedText}>ยืนยันแล้ว</Text>
              </View>
            ) : (
              <Text style={styles.pendingText}>รอการตรวจสอบ</Text>
            )}
            <Text style={styles.documentDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เอกสารของฉัน</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowTypeModal(true)}
          disabled={Boolean(isUploading)}
        >
          {isUploading ? (
            <Text style={styles.addButtonText}>กำลังอัพโหลด...</Text>
          ) : (
            <>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>เพิ่มเอกสาร</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="documents-outline"
            title="ยังไม่มีเอกสาร"
            subtitle="เพิ่มเอกสารเพื่อเพิ่มโอกาสในการสมัครงาน"
            actionLabel="เพิ่มเอกสาร"
            onAction={() => setShowTypeModal(true)}
          />
        }
      />

      {/* Document Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกประเภทเอกสาร</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeGrid}>
              {documentTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={styles.typeItem}
                  onPress={() => handleSelectType(item.type)}
                >
                  <View style={styles.typeIcon}>
                    <Ionicons name={item.icon as any} size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.typeLabel}>{getDocumentTypeLabel(item.type)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  documentMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  pendingText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
  },
  documentDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
  },
  typeItem: {
    width: '25%',
    alignItems: 'center',
    padding: SPACING.md,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
});
