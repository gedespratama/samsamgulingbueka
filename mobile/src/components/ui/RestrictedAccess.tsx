import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

interface Props {
  title?: string;
  message?: string;
  onBack: () => void;
}

export default function RestrictedAccess({
  title = 'Akses Terbatas',
  message = 'Hanya profil Pemilik dan Admin yang dapat mengakses menu ini.',
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={onBack}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Menu Terbatas</Text>
          <Text style={styles.subtitle}>Akses berdasarkan peran</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="lock-outline" size={34} color={colors.textMuted} />
        </View>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  messageText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
});
