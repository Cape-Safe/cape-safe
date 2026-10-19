import { HomeScreen } from '@/features/Home/HomeScreen';
import { View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
        <Text style={styles.text}>Welcome to Cape Safe</Text>
        <link href="/alerts" style={styles.link}>Go to Alerts</link>
    </View>
  );
}