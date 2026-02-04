import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { MapPin, Edit2, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { providerColors } from '@/constants/colors';
import { CustomerRow as CustomerRowType } from '@/services/api';

interface Props {
  row: CustomerRowType;
  id: string;
  label: string;
  cardProvider: string | null;
  isSelected: boolean;
  isInRoute: boolean;
  columns: string[];
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  onToggleRoute: () => void;
}

const getProviderKey = (provider: string | null): keyof typeof providerColors | null => {
  if (!provider) return 'na';
  const p = provider.toUpperCase().replace(/\s+/g, ' ');
  if (p === 'WORLDPAY') return 'worldpay';
  if (p === 'DOJO') return 'dojo';
  if (p === 'PAYMENT SENSE' || p === 'PAYMENTSENSE' || p === 'PAYMENT_SENSE') return 'payment-sense';
  if (p === 'TEYA') return 'teya';
  if (p === 'NEW LEAD' || p === 'NEWLEAD' || p === 'NEW_LEAD') return 'new-lead';
  if (p === 'N/A' || p === 'NA' || p === 'N\\A' || p === '') return 'na';
  return null;
};

function CustomerRowComponent({
  row,
  id,
  label,
  cardProvider,
  isSelected,
  isInRoute,
  columns,
  onPress,
  onLongPress,
  onEdit,
  onToggleRoute,
}: Props) {
  const { theme } = useTheme();

  const providerKey = getProviderKey(cardProvider);
  const providerStyle = providerKey ? providerColors[providerKey] : null;

  const displayColumns = useMemo(() => {
    return columns.slice(0, 4).map((col) => ({
      key: col,
      value: String(row[col] ?? '').substring(0, 50),
    }));
  }, [columns, row]);

  const rowBg = useMemo(() => {
    if (isSelected) return 'rgba(56,189,248,0.15)';
    if (providerStyle) return providerStyle.bg;
    return 'transparent';
  }, [isSelected, providerStyle]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? (providerStyle?.bgHover || theme.rowHover) : rowBg,
          borderColor: isSelected ? theme.accent : theme.line,
        },
        isInRoute && {
          borderLeftWidth: 4,
          borderLeftColor: theme.accent2,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {providerStyle && (
            <View style={[styles.providerDot, { backgroundColor: providerStyle.border }]} />
          )}
          <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.id, { color: theme.muted }]}>#{id}</Text>
      </View>

      <View style={styles.fields}>
        {displayColumns.map((col, idx) => (
          <View key={col.key} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.muted }]} numberOfLines={1}>
              {col.key.replace(/_/g, ' ')}
            </Text>
            <Text style={[styles.fieldValue, { color: theme.text }]} numberOfLines={1}>
              {col.value || '-'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onToggleRoute}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isInRoute ? theme.accent2 : theme.chipBg,
              borderColor: isInRoute ? theme.accent2 : theme.line,
            },
          ]}
        >
          <MapPin size={14} color={isInRoute ? '#fff' : theme.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEdit}
          style={[styles.actionBtn, { backgroundColor: theme.chipBg, borderColor: theme.line }]}
        >
          <Edit2 size={14} color={theme.muted} />
        </TouchableOpacity>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.accent }]}>
            <Check size={12} color="#fff" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default React.memo(CustomerRowComponent);

const styles = StyleSheet.create({
  container: {
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  id: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  field: {
    width: '50%',
    marginBottom: 6,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
