import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trash2, Save } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { CustomerRow } from '@/services/api';
import { showToast } from './Toast';

interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  row: CustomerRow | null;
  onClose: () => void;
}

export default function CustomerEditModal({ visible, mode, row, onClose }: Props) {
  const { theme } = useTheme();
  const {
    columns,
    idColumn,
    getRowId,
    addCustomer,
    addingCustomer,
    updateCustomer,
    updatingCustomer,
    deleteCustomer,
    deletingCustomer,
  } = useCustomers();

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && row) {
        const v: Record<string, string> = {};
        columns.forEach((col) => {
          v[col] = String(row[col] ?? '');
        });
        setValues(v);
      } else {
        const v: Record<string, string> = {};
        columns.forEach((col) => {
          v[col] = '';
        });
        setValues(v);
      }
      setErrors({});
    }
  }, [visible, mode, row, columns]);

  const handleChange = (col: string, text: string) => {
    setValues((prev) => ({ ...prev, [col]: text }));
    const hasError = text.includes(',') || text.includes('\n') || text.includes('\r');
    setErrors((prev) => ({ ...prev, [col]: hasError }));
  };

  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  const handleSave = async () => {
    if (hasErrors) {
      showToast('Remove commas/newlines from fields');
      return;
    }

    try {
      if (mode === 'add') {
        await addCustomer(values);
        showToast('Added');
      } else {
        const id = values[idColumn] || (row ? getRowId(row) : '');
        await updateCustomer({ id, values });
        showToast('Saved');
      }
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Error saving');
    }
  };

  const handleDelete = () => {
    const id = values[idColumn] || (row ? getRowId(row) : '');
    Alert.alert('Delete Customer', `Delete ${idColumn} ${id}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer(id);
            showToast('Deleted');
            onClose();
          } catch (e: any) {
            showToast(e.message || 'Error deleting');
          }
        },
      },
    ]);
  };

  const isLoading = addingCustomer || updatingCustomer || deletingCustomer;
  const title =
    mode === 'edit' ? `Edit ${idColumn}: ${row ? getRowId(row) : ''}` : 'Add Customer';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modal, { backgroundColor: theme.modalBg, borderColor: theme.line }]}>
          <View style={[styles.header, { backgroundColor: theme.panelHd, borderColor: theme.line }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGrid}>
              {columns.map((col) => {
                const isId = col.toUpperCase() === idColumn.toUpperCase();
                const isComments = col.toUpperCase().includes('COMMENT');
                const hasError = errors[col];

                return (
                  <View
                    key={col}
                    style={[styles.field, isComments && styles.fieldFull]}
                  >
                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                      {col.replace(/_/g, ' ')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        isComments && styles.inputMultiline,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: hasError ? theme.bad : theme.line,
                          color: theme.text,
                        },
                        isId && mode === 'edit' && { opacity: 0.6 },
                      ]}
                      value={values[col] || ''}
                      onChangeText={(text) => handleChange(col, text)}
                      editable={!(isId && mode === 'edit')}
                      multiline={isComments}
                      numberOfLines={isComments ? 4 : 1}
                      placeholderTextColor={theme.muted}
                    />
                    {hasError && (
                      <Text style={[styles.errorText, { color: theme.bad }]}>
                        Remove commas/newlines
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderColor: theme.line }]}>
            <Text style={[styles.help, { color: theme.muted }]}>
              No commas or new lines (CSV-compat).
            </Text>
            <View style={styles.footerBtns}>
              {mode === 'edit' && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnDanger]}
                  onPress={handleDelete}
                  disabled={isLoading}
                >
                  {deletingCustomer ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#fff" />
                      <Text style={styles.btnDangerText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSave}
                disabled={isLoading || hasErrors}
              >
                {addingCustomer || updatingCustomer ? (
                  <ActivityIndicator size="small" color="#38bdf8" />
                ) : (
                  <>
                    <Save size={16} color="#38bdf8" />
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    maxHeight: '90%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 400,
  },
  bodyContent: {
    padding: 16,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  field: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  fieldFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  help: {
    fontSize: 12,
    marginBottom: 12,
  },
  footerBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnPrimary: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.55)',
  },
  btnPrimaryText: {
    color: '#38bdf8',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  btnDanger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.55)',
  },
  btnDangerText: {
    color: '#ef4444',
    fontWeight: '600' as const,
    fontSize: 14,
  },
});
