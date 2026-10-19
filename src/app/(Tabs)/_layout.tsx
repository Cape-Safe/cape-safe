import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const TABS = [
  { name: 'index', title: 'Map', icon: '🗺' },
  { name: 'alerts', title: 'Alerts', icon: '🔔' },
  { name: 'settings', title: 'Settings', icon: '⚙' },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0c0c0c',
        headerStyle: { backgroundColor: '#f2f2f2' },
        headerShadowVisible: false,
        headerTintColor: '#0c0c0c',
        tabBarStyle: { backgroundColor: '#f2f2f2' },
      }}>
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            headerTitle: title,
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>{icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
