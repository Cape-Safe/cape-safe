import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Severity = 'urgent' | 'warning' | 'info';
type Filter = 'all' | Severity;

type Alert = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  area: string;
  issuedAt: string; // ISO date
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// TODO: replace with data from Firestore (collection "alerts").
async function fetchAlerts(): Promise<Alert[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [
    {
      id: '1',
      title: 'Smash-and-grab incidents on Nelson Mandela Boulevard',
      body: 'Several car break-ins reported near the city centre. Keep bags and phones out of sight, keep windows up and doors locked while driving.',
      severity: 'urgent',
      area: 'City Centre',
      issuedAt: minutesAgo(25),
    },
    {
      id: '2',
      title: 'Strong winds on Table Mountain',
      body: 'The cable car may close without notice. Avoid hiking the upper trails until the wind drops and check the operator’s status before you go.',
      severity: 'warning',
      area: 'Table Mountain',
      issuedAt: minutesAgo(140),
    },
    {
      id: '3',
      title: 'Phone snatching reported at V&A Waterfront',
      body: 'Use your phone away from the pavement edge and stay in busy, well-lit areas after dark.',
      severity: 'warning',
      area: 'V&A Waterfront',
      issuedAt: minutesAgo(60 * 6),
    },
    {
      id: '4',
      title: 'Planned road closures for Sunday’s marathon',
      body: 'Roads around Green Point will be closed from 05:00 to 13:00. Allow extra time and use ride-hailing drop-off points outside the closure.',
      severity: 'info',
      area: 'Green Point',
      issuedAt: minutesAgo(60 * 20),
    },
  ];
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
];

const SEVERITY_LABEL: Record<Severity, string> = {
  urgent: 'Urgent',
  warning: 'Warning',
  info: 'Info',
};

const SEVERITY_ORDER: Record<Severity, number> = { urgent: 0, warning: 1, info: 2 };

const palette = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#14212B',
    muted: '#5B6B78',
    border: '#DDE3E9',
    chip: '#E8EDF2',
    chipActive: '#14212B',
    chipActiveText: '#FFFFFF',
    urgent: '#B3261E',
    warning: '#9A5B00',
    info: '#1F5FA8',
  },
  dark: {
    background: '#0E151B',
    card: '#17212A',
    text: '#EEF2F5',
    muted: '#9AA9B5',
    border: '#26333E',
    chip: '#1F2B35',
    chipActive: '#EEF2F5',
    chipActiveText: '#0E151B',
    urgent: '#FF8A80',
    warning: '#FFB74D',
    info: '#7DB8FF',
  },
};

function timeAgo(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

export function AlertsScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = palette[scheme];

  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setAlerts(await fetchAlerts());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load: kick off once when the list is still empty.
  if (alerts === null && !refreshing && !error) {
    void load();
  }

  const visible = useMemo(() => {
    const list = (alerts ?? []).filter((a) => filter === 'all' || a.severity === filter);
    return [...list].sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    );
  }, [alerts, filter]);

  const renderItem = ({ item }: { item: Alert }) => {
    const expanded = expandedId === item.id;
    const accent = c[item.severity];
    return (
      <Pressable
        onPress={() => setExpandedId(expanded ? null : item.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${SEVERITY_LABEL[item.severity]} alert: ${item.title}. ${item.area}, ${timeAgo(item.issuedAt)}`}
        accessibilityHint={expanded ? 'Collapse details' : 'Show details'}
        style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.cardContent}>
          <Text style={[styles.severity, { color: accent }]}>{SEVERITY_LABEL[item.severity]}</Text>
          <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>
            {item.area}  •  {timeAgo(item.issuedAt)}
          </Text>
          {expanded && <Text style={[styles.body, { color: c.text }]}>{item.body}</Text>}
        </View>
      </Pressable>
    );
  };

  const emptyMessage = error
    ? { title: 'Couldn’t load alerts', text: 'Check your connection, then pull down to try again.' }
    : alerts === null
      ? { title: 'Loading alerts…', text: '' }
      : filter === 'all'
        ? { title: 'No active alerts', text: 'Nothing to report in Cape Town right now. Pull down to refresh.' }
        : { title: 'No alerts in this category', text: 'Try another filter to see more.' };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: c.text }]}>Alerts</Text>
        <Text style={[styles.subheading, { color: c.muted }]}>Current safety alerts for Cape Town</Text>
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { backgroundColor: active ? c.chipActive : c.chip }]}>
              <Text style={[styles.chipText, { color: active ? c.chipActiveText : c.text }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={c.muted} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: c.text }]}>{emptyMessage.title}</Text>
            {!!emptyMessage.text && (
              <Text style={[styles.emptyText, { color: c.muted }]}>{emptyMessage.text}</Text>
            )}
          </View>
        }
        ListFooterComponent={
          <Text style={[styles.disclaimer, { color: c.muted }]}>
            In an emergency call 10111 (SAPS), 10177 (ambulance) or 112 (mobile emergency). Alerts do not replace
            emergency services.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

export default AlertsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  heading: { fontSize: 28, fontWeight: '700' },
  subheading: { fontSize: 15, marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minHeight: 36, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 120, flexGrow: 1 },
  separator: { height: 12 },
  card: { flexDirection: 'row', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  accentBar: { width: 6 },
  cardContent: { flex: 1, padding: 14, gap: 4 },
  severity: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  meta: { fontSize: 13 },
  body: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  disclaimer: { fontSize: 12, lineHeight: 18, marginTop: 24, textAlign: 'center' },
});
