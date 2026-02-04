import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { X, Navigation, MapPin, Trash2, ExternalLink, Route } from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomers, RouteStop } from '@/contexts/CustomerContext';
import { api } from '@/services/api';
import { showToast } from './Toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: 54.5,
  longitude: -3.0,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export default function RoutePlannerModal({ visible, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const { routeStops, removeFromRoute, clearRoute, updateStopCoords, reorderStops } = useCustomers();
  const mapRef = useRef<MapView>(null);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routePath, setRoutePath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ distance: string; duration: string } | null>(null);

  const fitMapToStops = useCallback(() => {
    const validStopsForFit = routeStops.filter(
      (s) => s.lat !== null && s.lon !== null && Number.isFinite(s.lat) && Number.isFinite(s.lon)
    );
    if (validStopsForFit.length === 0 || !mapRef.current) return;

    const coords = validStopsForFit.map((s) => ({
      latitude: s.lat!,
      longitude: s.lon!,
    }));

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 300);
  }, [routeStops]);

  useEffect(() => {
    if (visible && routeStops.length > 0) {
      fitMapToStops();
    }
  }, [visible, routeStops.length, fitMapToStops]);

  const geocodeStop = useCallback(
    async (stop: RouteStop) => {
      if (stop.lat !== null && stop.lon !== null) return true;
      if (!stop.address) return false;

      showToast('Finding location...');
      const result = await api.geocodeAddress(stop.address);
      if (result) {
        updateStopCoords(stop.id, result.lat, result.lon);
        return true;
      }
      return false;
    },
    [updateStopCoords]
  );

  const handleOptimize = useCallback(async () => {
    if (routeStops.length < 2) {
      showToast('Add at least 2 stops');
      return;
    }

    setIsOptimizing(true);
    setRoutePath([]);
    setRouteMeta(null);

    try {
      for (const stop of routeStops) {
        if (stop.lat === null || stop.lon === null) {
          const ok = await geocodeStop(stop);
          if (!ok) {
            showToast(`Couldn't locate: ${stop.label}`);
            setIsOptimizing(false);
            return;
          }
        }
      }

      const validStops = routeStops.filter(
        (s) => s.lat !== null && s.lon !== null
      ) as (RouteStop & { lat: number; lon: number })[];

      if (validStops.length < 2) {
        showToast('Need at least 2 stops with locations');
        setIsOptimizing(false);
        return;
      }

      showToast('Optimizing route...');
      const result = await api.osrmTrip(validStops.map((s) => ({ lat: s.lat, lon: s.lon })));

      const order = result.waypoints
        .map((w: any, i: number) => ({ i, o: w.waypoint_index }))
        .sort((a: any, b: any) => a.o - b.o)
        .map((x: any) => x.i);

      const reorderedStops = order.map((i: number) => routeStops[i]);
      reorderStops(reorderedStops);

      const trip = result.trips[0];
      if (trip.geometry && trip.geometry.coordinates) {
        const path = trip.geometry.coordinates.map((c: [number, number]) => ({
          latitude: c[1],
          longitude: c[0],
        }));
        setRoutePath(path);
      }

      const distance =
        trip.distance < 1000
          ? `${Math.round(trip.distance)} m`
          : `${(trip.distance / 1000).toFixed(1)} km`;

      const mins = Math.round(trip.duration / 60);
      const duration =
        mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

      setRouteMeta({ distance, duration });
      showToast('Route ready');
      fitMapToStops();
    } catch (e: any) {
      showToast(e.message || 'Routing failed');
    } finally {
      setIsOptimizing(false);
    }
  }, [routeStops, geocodeStop, reorderStops, fitMapToStops]);

  const handleOpenInMaps = useCallback(() => {
    if (routeStops.length < 2) {
      showToast('Need at least 2 stops');
      return;
    }

    const validStops = routeStops.filter(
      (s) => (s.lat !== null && s.lon !== null) || s.address
    );

    if (validStops.length < 2) {
      showToast('Need stops with locations or addresses');
      return;
    }

    const toLoc = (s: RouteStop) => {
      if (s.lat !== null && s.lon !== null) return `${s.lat},${s.lon}`;
      return s.address || null;
    };

    const locs = validStops.map(toLoc).filter(Boolean) as string[];
    if (locs.length < 2) return;

    const origin = locs[0];
    const dest = locs[locs.length - 1];
    const waypoints = locs.length > 2 ? locs.slice(1, -1).join('|') : '';

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;

    Linking.openURL(url);
  }, [routeStops]);

  const handleClear = useCallback(() => {
    clearRoute();
    setRoutePath([]);
    setRouteMeta(null);
    showToast('Route cleared');
  }, [clearRoute]);

  const validMarkers = routeStops.filter(
    (s) => s.lat !== null && s.lon !== null
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay]}>
        <View style={[styles.modal, { backgroundColor: theme.modalBg, borderColor: theme.line }]}>
          <View style={[styles.header, { backgroundColor: theme.panelHd, borderColor: theme.line }]}>
            <Text style={[styles.title, { color: theme.text }]}>Route Planner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, styles.toolBtnPrimary]}
              onPress={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <>
                  <Route size={14} color="#38bdf8" />
                  <Text style={styles.toolBtnPrimaryText}>Optimize</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { borderColor: theme.line }]}
              onPress={handleOpenInMaps}
            >
              <ExternalLink size={14} color={theme.text} />
              <Text style={[styles.toolBtnText, { color: theme.text }]}>Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, styles.toolBtnDanger]}
              onPress={handleClear}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={styles.toolBtnDangerText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={DEFAULT_REGION}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
              >
                {validMarkers.map((stop, idx) => (
                  <Marker
                    key={stop.id}
                    coordinate={{ latitude: stop.lat!, longitude: stop.lon! }}
                    title={`${idx + 1}. ${stop.label}`}
                    description={stop.address || undefined}
                  />
                ))}

                {routePath.length > 1 && (
                  <Polyline
                    coordinates={routePath}
                    strokeColor={theme.accent}
                    strokeWidth={4}
                  />
                )}
              </MapView>
            </View>

            <View style={[styles.sidebar, { backgroundColor: theme.panel2, borderColor: theme.line }]}>
              <View style={styles.sidebarHeader}>
                <Text style={[styles.stopCount, { color: theme.muted }]}>
                  {routeStops.length} stops
                </Text>
                {routeMeta && (
                  <View style={[styles.metaBadge, { backgroundColor: theme.chipBg, borderColor: theme.line }]}>
                    <Text style={[styles.metaText, { color: theme.text }]}>
                      {routeMeta.distance} • {routeMeta.duration}
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView style={styles.stopList} showsVerticalScrollIndicator={false}>
                {routeStops.map((stop, idx) => (
                  <View
                    key={stop.id}
                    style={[styles.stopItem, { backgroundColor: theme.panel, borderColor: theme.line }]}
                  >
                    <View style={styles.stopInfo}>
                      <Text style={[styles.stopNumber, { color: theme.accent }]}>
                        {idx + 1}
                      </Text>
                      <View style={styles.stopDetails}>
                        <Text style={[styles.stopLabel, { color: theme.text }]} numberOfLines={1}>
                          {stop.label}
                        </Text>
                        <Text style={[styles.stopAddress, { color: theme.muted }]} numberOfLines={1}>
                          {stop.lat !== null && stop.lon !== null
                            ? `${stop.lat.toFixed(4)}, ${stop.lon.toFixed(4)}`
                            : stop.address || 'No location'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stopActions}>
                      {stop.lat === null && (
                        <TouchableOpacity
                          style={[styles.stopBtn, { borderColor: theme.line }]}
                          onPress={() => geocodeStop(stop)}
                        >
                          <MapPin size={12} color={theme.muted} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.stopBtn, styles.stopBtnDanger]}
                        onPress={() => removeFromRoute(stop.id)}
                      >
                        <X size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {routeStops.length === 0 && (
                  <View style={styles.emptyState}>
                    <Navigation size={32} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.muted }]}>
                      No stops added yet
                    </Text>
                    <Text style={[styles.emptyHint, { color: theme.muted }]}>
                      Long-press customers to add them to the route
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modal: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
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
    fontSize: 16,
    fontWeight: '600' as const,
  },
  closeBtn: {
    padding: 4,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toolBtnPrimary: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderColor: 'rgba(56,189,248,0.55)',
  },
  toolBtnPrimaryText: {
    color: '#38bdf8',
    fontWeight: '600' as const,
    fontSize: 13,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  toolBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  toolBtnDangerText: {
    color: '#ef4444',
    fontWeight: '500' as const,
    fontSize: 13,
  },
  content: {
    flex: 1,
    flexDirection: isTablet ? 'row' : 'column',
  },
  mapContainer: {
    flex: isTablet ? 1 : 0.5,
    minHeight: 200,
  },
  map: {
    flex: 1,
  },
  sidebar: {
    flex: isTablet ? 0 : 0.5,
    width: isTablet ? 320 : '100%',
    borderTopWidth: isTablet ? 0 : 1,
    borderLeftWidth: isTablet ? 1 : 0,
    padding: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stopCount: {
    fontSize: 12,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  stopList: {
    flex: 1,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  stopNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 24,
  },
  stopDetails: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  stopAddress: {
    fontSize: 11,
    marginTop: 2,
  },
  stopActions: {
    flexDirection: 'row',
    gap: 6,
  },
  stopBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnDanger: {
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
