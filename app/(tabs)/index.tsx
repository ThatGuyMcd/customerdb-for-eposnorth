import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Navigation,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import Header from '@/components/Header';
import LoginCard from '@/components/LoginCard';
import CustomerRow from '@/components/CustomerRow';
import CustomerEditModal from '@/components/CustomerEditModal';
import RoutePlannerModal from '@/components/RoutePlannerModal';
import Toast, { showToast } from '@/components/Toast';
import { CustomerRow as CustomerRowType } from '@/services/api';

export default function CustomersScreen() {
  const { theme, isLoaded } = useTheme();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const {
    databases,
    selectedDb,
    selectDatabase,
    columns,
    rows,
    total,
    skip,
    take,
    search,
    nextPage,
    prevPage,
    customersLoading,
    refresh,
    getRowId,
    getRowLabel,
    getCardProvider,
    selectedIds,
    toggleSelection,
    routeStops,
    routeIds,
    addToRoute,
    removeFromRoute,
  } = useCustomers();

  const [searchInput, setSearchInput] = useState('');
  const [showDbPicker, setShowDbPicker] = useState(false);
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    mode: 'add' | 'edit';
    row: CustomerRowType | null;
  }>({ visible: false, mode: 'add', row: null });
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  useEffect(() => {
    if (databases.length > 0 && !selectedDb) {
      selectDatabase(databases[0]);
    }
  }, [databases, selectedDb, selectDatabase]);

  const handleSearch = useCallback(() => {
    search(searchInput);
  }, [search, searchInput]);

  const handleRefresh = useCallback(() => {
    refresh();
    showToast('Refreshed');
  }, [refresh]);

  const openAddModal = useCallback(() => {
    setEditModal({ visible: true, mode: 'add', row: null });
  }, []);

  const openEditModal = useCallback((row: CustomerRowType) => {
    setEditModal({ visible: true, mode: 'edit', row });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ visible: false, mode: 'add', row: null });
  }, []);

  const handleRowPress = useCallback(
    (row: CustomerRowType) => {
      const id = getRowId(row);
      toggleSelection(id);
    },
    [getRowId, toggleSelection]
  );

  const handleRowLongPress = useCallback(
    (row: CustomerRowType) => {
      const id = getRowId(row);
      if (routeIds.has(id)) {
        removeFromRoute(id);
        showToast('Removed from route');
      } else {
        addToRoute(row);
        showToast('Added to route');
      }
    },
    [getRowId, routeIds, addToRoute, removeFromRoute]
  );

  const renderCustomerRow = useCallback(
    ({ item }: { item: CustomerRowType }) => {
      const id = getRowId(item);
      return (
        <CustomerRow
          row={item}
          id={id}
          label={getRowLabel(item)}
          cardProvider={getCardProvider(item)}
          isSelected={selectedIds.has(id)}
          isInRoute={routeIds.has(id)}
          columns={columns}
          onPress={() => handleRowPress(item)}
          onLongPress={() => handleRowLongPress(item)}
          onEdit={() => openEditModal(item)}
          onToggleRoute={() => {
            if (routeIds.has(id)) {
              removeFromRoute(id);
              showToast('Removed from route');
            } else {
              addToRoute(item);
              showToast('Added to route');
            }
          }}
        />
      );
    },
    [
      getRowId,
      getRowLabel,
      getCardProvider,
      selectedIds,
      routeIds,
      columns,
      handleRowPress,
      handleRowLongPress,
      openEditModal,
      addToRoute,
      removeFromRoute,
    ]
  );

  const keyExtractor = useCallback(
    (item: CustomerRowType) => getRowId(item),
    [getRowId]
  );

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const showCount = `${total} rows • showing ${Math.min(total, skip + 1)}-${Math.min(total, skip + rows.length)}`;
  const canPrev = skip > 0;
  const canNext = skip + take < total;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header />

      {!isLoggedIn && !authLoading ? (
        <LoginCard />
      ) : authLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.toolbar, { borderColor: theme.line }]}>
            <TouchableOpacity
              style={[styles.dbSelector, { backgroundColor: theme.inputBg, borderColor: theme.line }]}
              onPress={() => setShowDbPicker(!showDbPicker)}
            >
              <Text style={[styles.dbText, { color: theme.text }]} numberOfLines={1}>
                {selectedDb || 'Select database'}
              </Text>
              <ChevronDown size={16} color={theme.muted} />
            </TouchableOpacity>

            {showDbPicker && (
              <View style={[styles.dbDropdown, { backgroundColor: theme.panel, borderColor: theme.line }]}>
                {databases.map((db) => (
                  <TouchableOpacity
                    key={db}
                    style={[
                      styles.dbOption,
                      selectedDb === db && { backgroundColor: theme.rowHover },
                    ]}
                    onPress={() => {
                      selectDatabase(db);
                      setShowDbPicker(false);
                    }}
                  >
                    <Text style={[styles.dbOptionText, { color: theme.text }]}>{db}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.line }]}>
              <Search size={16} color={theme.muted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                placeholder="Search any field..."
                placeholderTextColor={theme.muted}
                returnKeyType="search"
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={[styles.countPill, { backgroundColor: theme.chipBg, borderColor: theme.line }]}>
              <Text style={[styles.countText, { color: theme.muted }]}>{showCount}</Text>
            </View>

            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={openAddModal}
              >
                <Plus size={16} color="#38bdf8" />
                <Text style={styles.actionBtnPrimaryText}>Add</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.line }]}
                onPress={handleRefresh}
              >
                <RefreshCw size={14} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  routeStops.length > 0 ? styles.actionBtnAccent : { borderColor: theme.line },
                ]}
                onPress={() => setRouteModalVisible(true)}
              >
                <Navigation size={14} color={routeStops.length > 0 ? '#a78bfa' : theme.text} />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: routeStops.length > 0 ? '#a78bfa' : theme.text },
                  ]}
                >
                  Route ({routeStops.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {customersLoading && rows.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : (
            <FlatList
              data={rows}
              renderItem={renderCustomerRow}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={customersLoading}
                  onRefresh={handleRefresh}
                  tintColor={theme.accent}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.muted }]}>
                    No customers found
                  </Text>
                </View>
              }
            />
          )}

          <View style={[styles.pagination, { backgroundColor: theme.panel, borderColor: theme.line }]}>
            <TouchableOpacity
              style={[styles.pageBtn, { borderColor: theme.line }, !canPrev && styles.pageBtnDisabled]}
              onPress={prevPage}
              disabled={!canPrev}
            >
              <ChevronLeft size={18} color={canPrev ? theme.text : theme.muted} />
              <Text style={[styles.pageBtnText, { color: canPrev ? theme.text : theme.muted }]}>
                Prev
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pageBtn, { borderColor: theme.line }, !canNext && styles.pageBtnDisabled]}
              onPress={nextPage}
              disabled={!canNext}
            >
              <Text style={[styles.pageBtnText, { color: canNext ? theme.text : theme.muted }]}>
                Next
              </Text>
              <ChevronRight size={18} color={canNext ? theme.text : theme.muted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomerEditModal
        visible={editModal.visible}
        mode={editModal.mode}
        row={editModal.row}
        onClose={closeEditModal}
      />

      <RoutePlannerModal visible={routeModalVisible} onClose={() => setRouteModalVisible(false)} />

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  dbSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dbText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  dbDropdown: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dbOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dbOptionText: {
    fontSize: 14,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 11,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderColor: 'rgba(56,189,248,0.55)',
  },
  actionBtnPrimaryText: {
    color: '#38bdf8',
    fontWeight: '600' as const,
    fontSize: 13,
  },
  actionBtnAccent: {
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.55)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
});
