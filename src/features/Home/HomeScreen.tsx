import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Contact = { number: string; label: string; detail: string };

const EMERGENCY_CONTACTS: Contact[] = [
  { number: '112', label: 'Mobile emergency', detail: 'Works from any mobile phone' },
  { number: '10111', label: 'Police (SAPS)', detail: 'Crime and immediate danger' },
  { number: '10177', label: 'Ambulance', detail: 'Medical emergencies' },
];

const palette = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#14212B',
    muted: '#5B6B78',
    border: '#DDE3E9',
    sos: '#B3261E',
    sosText: '#FFFFFF',
  },
  dark: {
    background: '#0E151B',
    card: '#17212A',
    text: '#EEF2F5',
    muted: '#9AA9B5',
    border: '#26333E',
    sos: '#FF8A80',
    sosText: '#2B0A07',
  },
};

export function HomeScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = palette[scheme];
  const router = useRouter();

  const call = (number: string) => {
    void Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: c.text }]}>Cape Safe</Text>
          <Text style={[styles.subheading, { color: c.muted }]}>
            Stay aware and get help fast while you travel in Cape Town.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Need help now?</Text>
        <View style={styles.sosList}>
          {EMERGENCY_CONTACTS.map((contact) => (
            <Pressable
              key={contact.number}
              onPress={() => call(contact.number)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${contact.label} on ${contact.number}`}
              style={({ pressed }) => [
                styles.sosButton,
                { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={styles.sosText}>
                <Text style={[styles.sosLabel, { color: c.sosText }]}>{contact.label}</Text>
                <Text style={[styles.sosDetail, { color: c.sosText }]}>{contact.detail}</Text>
              </View>
              <Text style={[styles.sosNumber, { color: c.sosText }]}>{contact.number}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Stay informed</Text>
        <View style={styles.links}>
          <Pressable
            onPress={() => router.push('/alerts')}
            accessibilityRole="button"
            style={[styles.linkCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.linkTitle, { color: c.text }]}>Alerts</Text>
            <Text style={[styles.linkText, { color: c.muted }]}>See current safety alerts for Cape Town.</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            style={[styles.linkCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.linkTitle, { color: c.text }]}>Settings</Text>
            <Text style={[styles.linkText, { color: c.muted }]}>
              Manage your account, location and accessibility.
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>
          Cape Safe does not replace emergency services. In an emergency always call 10111, 10177 or 112.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { paddingTop: 12, paddingBottom: 8 },
  heading: { fontSize: 28, fontWeight: '700' },
  subheading: { fontSize: 15, lineHeight: 21, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  sosList: { gap: 10 },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  sosText: { flex: 1, paddingRight: 12 },
  sosLabel: { fontSize: 17, fontWeight: '700' },
  sosDetail: { fontSize: 13, marginTop: 2 },
  sosNumber: { fontSize: 24, fontWeight: '800' },
  links: { gap: 12 },
  linkCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 4 },
  linkTitle: { fontSize: 16, fontWeight: '600' },
  linkText: { fontSize: 14, lineHeight: 20 },
  disclaimer: { fontSize: 12, lineHeight: 18, marginTop: 28, textAlign: 'center' },
});
