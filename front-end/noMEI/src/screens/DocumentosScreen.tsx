/**
 * @file src/screens/DocumentosScreen.tsx
 * @description Gestão de Documentos — upload e listagem via API
 * 
 */

import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Header, StatusBadge, Button, EmptyState, ErrorState } from '../components';
import { colors, spacing, borderRadius, shadows, textPresets } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { listarDocumentos, uploadDocumento, abrirDocumento, deletarDocumento, type Documento } from '../services/documentosService';
import type { MainTabScreenProps } from '../types';

type Props = MainTabScreenProps<"Documentos">;

// Mapeia status do backend para o tipo aceito pelo StatusBadge
type BadgeStatus = 'pending' | 'sent' | 'error';
function mapStatus(status: Documento['status']): BadgeStatus {
  if (status === 'valido') return 'sent';
  if (status === 'expirado') return 'error';
  return 'pending';
}

export function DocumentosScreen({ navigation: _navigation }: Props): React.JSX.Element {
  const { cnpj } = useProfile();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchDocumentos = useCallback(async () => {
    if (!cnpj) return;
    setLoadingList(true);
    setErrorList(null);
    try {
      const result = await listarDocumentos(cnpj);
      setDocumentos(result.items);
    } catch (err) {
      setErrorList(err instanceof Error ? err.message : 'Erro ao carregar documentos');
    } finally {
      setLoadingList(false);
    }
  }, [cnpj]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  async function doUpload(file: { uri: string; name: string; mimeType: string }): Promise<void> {
    setUploading(true);
    try {
      await uploadDocumento(cnpj, file);
      await fetchDocumentos();
    } catch (err) {
      Alert.alert(
        'Erro no upload',
        err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.'
      );
    } finally {
      setUploading(false);
    }
  }

  function handleDocumentoMenu(doc: Documento): void {
  setSelectedDoc(doc);
  setMenuVisible(true);
}

  // Web: usa input[type=file] nativo para garantir que o picker abra
  function handleWebFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    doUpload({ uri, name: file.name, mimeType: file.type || 'application/octet-stream' });
    input.value = '';
  }

  async function handleSelectFile(): Promise<void> {
    if (!cnpj) {
      Alert.alert('Perfil incompleto', 'Complete seu perfil para fazer upload de documentos.');
      return;
    }

    if (Platform.OS === 'web') {
      // Cria um input temporário e dispara o click
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = handleWebFileChange;
      input.click();
      return;
    }

    // Native: usa expo-document-picker
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    await doUpload({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header variant="default" notificationCount={0} />

         <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Gestão de Documentos</Text>
            <Text style={styles.screenSubtitle}>
               Mantenha sua documentação atualizada para garantir sua
               participação em licitações.
            </Text>
         </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Upload area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconWrapper}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>Fazer Upload de Novo Documento</Text>
          <Text style={styles.uploadSubtitle}>
            Adicione e atualize seus documentos aqui. Clique para fazer upload.
          </Text>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Button
              label="Selecionar arquivo"
              onPress={handleSelectFile}
              variant="outline"
              size="sm"
              leftIcon={<Ionicons name="attach-outline" size={16} color={colors.primary} />}
            />
          )}
        </View>

        {/* Lista de documentos */}
        <Text style={styles.sectionTitle}>Seus Documentos</Text>

        {loadingList && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}

        {errorList && !loadingList && (
          <ErrorState
            title="Erro ao carregar documentos"
            description={errorList}
            onRetry={fetchDocumentos}
          />
        )}

        {!loadingList && !errorList && documentos.length === 0 && (
          <EmptyState
            icon="document-outline"
            title="Nenhum documento enviado"
            description="Faça upload dos documentos necessários para participar de licitações."
          />
        )}

        {!loadingList && !errorList && documentos.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docIconWrapper}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={2}>{doc.nome}</Text>
              <Text style={styles.docExpiry}>
                Enviado em: {new Date(doc.data_upload).toLocaleDateString('pt-BR')}
              </Text>
              <StatusBadge status={mapStatus(doc.status)} />
            </View>
            <TouchableOpacity onPress={() => handleDocumentoMenu(doc)}>
              <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDoc?.nome}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                if (!selectedDoc) return;

                try {
                  await abrirDocumento(selectedDoc.id);
                  setMenuVisible(false);
                } catch {
                  Alert.alert(
                    'Erro',
                    'Não foi possível abrir o documento.'
                  );
                }
              }}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.modalButtonText}>
                Visualizar documento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                if (!selectedDoc) return;

                try {
                  await deletarDocumento(selectedDoc.id);

                  setDocumentos((prev) =>
                    prev.filter((item) => item.id !== selectedDoc.id)
                  );

                  setMenuVisible(false);

                  Alert.alert(
                    'Sucesso',
                    'Documento removido.'
                  );
                } catch {
                  Alert.alert(
                    'Erro',
                    'Não foi possível remover o documento.'
                  );
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.error}
              />

              <Text
                style={[
                  styles.modalButtonText,
                  { color: colors.error }
                ]}
              >
                Deletar documento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelButtonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleSection: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    gap: spacing[1],
  },
  screenTitle: {
    ...textPresets.h4,
    color: colors.white,
  },
  screenSubtitle: {
    ...textPresets.bodySm,
    color: 'rgba(255,255,255,0.65)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  uploadArea: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  uploadIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  uploadTitle: {
    ...textPresets.labelMd,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...textPresets.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginVertical: spacing[6],
  },
  sectionTitle: {
    ...textPresets.h5,
    color: colors.textPrimary,
    marginTop: spacing[2],
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[3],
    ...shadows.sm,
  },
  docIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    gap: spacing[1],
  },
  docName: {
    ...textPresets.labelMd,
    color: colors.textPrimary,
  },
  docExpiry: {
    ...textPresets.bodySm,
    color: colors.textSecondary,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },

  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    gap: spacing[3],
    ...shadows.md,
  },

  modalTitle: {
    ...textPresets.labelLg,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },

  modalButtonText: {
    ...textPresets.labelMd,
    color: colors.textPrimary,
  },

  cancelButton: {
    marginTop: spacing[2],
    alignItems: 'center',
    paddingVertical: spacing[2],
  },

  cancelButtonText: {
    ...textPresets.bodyMd,
    color: colors.textSecondary,
  },
});

