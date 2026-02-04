import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { api, CustomerRow } from '@/services/api';
import { useAuth } from './AuthContext';

export interface RouteStop {
  id: string;
  row: CustomerRow;
  label: string;
  address: string;
  lat: number | null;
  lon: number | null;
}

const normKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '');

export const [CustomerProvider, useCustomers] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();
  
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const take = 200;

  const databasesQuery = useQuery({
    queryKey: ['databases'],
    queryFn: () => api.getDatabases(),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const databases = databasesQuery.data?.databases ?? [];

  const customersQuery = useQuery({
    queryKey: ['customers', selectedDb, searchQuery, skip, take],
    queryFn: () => api.getCustomers(selectedDb!, searchQuery, skip, take),
    enabled: !!selectedDb && isLoggedIn,
    staleTime: 1000 * 30,
  });

  const columns = useMemo(() => customersQuery.data?.columns ?? [], [customersQuery.data?.columns]);
  const idColumn = customersQuery.data?.idColumn ?? 'ID';
  const rows = customersQuery.data?.rows ?? [];
  const total = customersQuery.data?.total ?? 0;

  const addMutation = useMutation({
    mutationFn: (values: Record<string, string>) => api.addCustomer(selectedDb!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, string> }) =>
      api.updateCustomer(selectedDb!, id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCustomer(selectedDb!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const getRowId = useCallback(
    (row: CustomerRow): string => {
      return String(row[idColumn] ?? row['ID'] ?? '');
    },
    [idColumn]
  );

  const getRowLabel = useCallback(
    (row: CustomerRow): string => {
      const pick = (pred: (c: string) => boolean): string | null => {
        for (const c of columns) {
          if (pred(c)) {
            const v = String(row[c] ?? '').trim();
            if (v) return v;
          }
        }
        return null;
      };

      return (
        pick((c) => normKey(c).includes('BUSINESS') && normKey(c).includes('NAME')) ||
        pick((c) => normKey(c).endsWith('NAME')) ||
        pick((c) => normKey(c).includes('COMPANY')) ||
        String(getRowId(row) || 'Customer')
      );
    },
    [columns, getRowId]
  );

  const geoKeys = useMemo(() => {
    const up = columns.map((c) => ({ c, n: normKey(c) }));
    const lat = up.find((x) => x.n === 'LAT' || x.n === 'LATITUDE');
    const lon = up.find(
      (x) => x.n === 'LON' || x.n === 'LNG' || x.n === 'LONG' || x.n === 'LONGITUDE'
    );

    const addressKeys: string[] = [];
    const addrHints = [
      'ADDRESS', 'ADDR', 'POSTCODE', 'ZIP', 'TOWN', 'CITY',
      'COUNTY', 'STATE', 'COUNTRY', 'STREET', 'LINE1', 'LINE2', 'LINE3', 'POSTAL',
    ];
    const block = [
      'EMAIL', 'MAIL', 'TEL', 'PHONE', 'MOBILE', 'WEBSITE',
      'WEB', 'URL', 'COMMENT', 'NOTES', 'CARD', 'PROVIDER', 'REP',
    ];

    up.forEach((x) => {
      if (block.some((b) => x.n.includes(normKey(b)))) return;
      for (const h of addrHints) {
        if (x.n.includes(h)) {
          addressKeys.push(x.c);
          break;
        }
      }
    });

    return { latKey: lat?.c ?? null, lonKey: lon?.c ?? null, addressKeys };
  }, [columns]);

  const extractLatLon = useCallback(
    (row: CustomerRow): { lat: number; lon: number } | null => {
      if (!geoKeys.latKey || !geoKeys.lonKey) return null;
      const lat = parseFloat(String(row[geoKeys.latKey] ?? '').trim());
      const lon = parseFloat(String(row[geoKeys.lonKey] ?? '').trim());
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
      return { lat, lon };
    },
    [geoKeys]
  );

  const buildAddress = useCallback(
    (row: CustomerRow): string => {
      const isEmptyish = (v: any) => {
        const s = String(v ?? '').trim();
        if (!s) return true;
        const u = s.toUpperCase();
        return ['N/A', 'NA', 'N\\A', 'NONE', 'NULL', '-', '0'].includes(u);
      };

      const parts: string[] = [];
      geoKeys.addressKeys.forEach((k) => {
        const raw = row[k];
        if (isEmptyish(raw)) return;
        const v = String(raw).replace(/\s+/g, ' ').trim();
        if (!v || /@/.test(v) || /^https?:\/\//i.test(v)) return;
        parts.push(v);
      });

      const joined = parts.join(', ');
      const hasUK = /\b(UK|UNITED\s+KINGDOM|GREAT\s+BRITAIN|GB)\b/i.test(joined);
      const looksGBPostcode = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i.test(joined);
      const hasHomeNation = /\b(SCOTLAND|ENGLAND|WALES|NORTHERN\s+IRELAND)\b/i.test(joined);

      if (!hasUK && (looksGBPostcode || hasHomeNation)) {
        parts.push('United Kingdom');
      }

      return parts.join(', ').replace(/\s+/g, ' ').trim();
    },
    [geoKeys]
  );

  const getCardProvider = useCallback(
    (row: CustomerRow): string | null => {
      const providerCol = columns.find((c) => {
        const n = normKey(c);
        return n === 'CARDPROVIDER' || n.includes('CARDPROVIDER');
      });
      if (!providerCol) return null;
      return String(row[providerCol] ?? '').trim().toUpperCase();
    },
    [columns]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const routeIds = useMemo(() => new Set(routeStops.map((s) => s.id)), [routeStops]);

  const addToRoute = useCallback(
    (row: CustomerRow) => {
      const id = getRowId(row);
      if (routeIds.has(id)) return;

      const ll = extractLatLon(row);
      const addr = buildAddress(row);

      const stop: RouteStop = {
        id,
        row,
        label: getRowLabel(row),
        address: addr,
        lat: ll?.lat ?? null,
        lon: ll?.lon ?? null,
      };

      setRouteStops((prev) => [...prev, stop]);
    },
    [routeIds, getRowId, getRowLabel, extractLatLon, buildAddress]
  );

  const removeFromRoute = useCallback((id: string) => {
    setRouteStops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearRoute = useCallback(() => {
    setRouteStops([]);
  }, []);

  const updateStopCoords = useCallback((id: string, lat: number, lon: number) => {
    setRouteStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lat, lon } : s))
    );
  }, []);

  const reorderStops = useCallback((newOrder: RouteStop[]) => {
    setRouteStops(newOrder);
  }, []);

  const nextPage = useCallback(() => {
    if (skip + take < total) {
      setSkip((prev) => prev + take);
    }
  }, [skip, take, total]);

  const prevPage = useCallback(() => {
    setSkip((prev) => Math.max(0, prev - take));
  }, [take]);

  const search = useCallback((q: string) => {
    setSearchQuery(q);
    setSkip(0);
  }, []);

  const selectDatabase = useCallback((db: string) => {
    setSelectedDb(db);
    setSkip(0);
    setSearchQuery('');
    setSelectedIds(new Set());
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  return {
    databases,
    databasesLoading: databasesQuery.isLoading,
    selectedDb,
    selectDatabase,
    columns,
    idColumn,
    rows,
    total,
    skip,
    take,
    searchQuery,
    search,
    nextPage,
    prevPage,
    customersLoading: customersQuery.isLoading,
    refresh,
    getRowId,
    getRowLabel,
    getCardProvider,
    extractLatLon,
    buildAddress,
    selectedIds,
    toggleSelection,
    clearSelection,
    routeStops,
    routeIds,
    addToRoute,
    removeFromRoute,
    clearRoute,
    updateStopCoords,
    reorderStops,
    addCustomer: addMutation.mutateAsync,
    addingCustomer: addMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    updatingCustomer: updateMutation.isPending,
    deleteCustomer: deleteMutation.mutateAsync,
    deletingCustomer: deleteMutation.isPending,
  };
});
