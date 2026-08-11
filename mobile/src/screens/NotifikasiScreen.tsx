import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../components/ui/EmptyState';
import { notificationsSeed, type AppNotification } from '../data/mock';
import { colors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const typeMeta: Record<AppNotification['type'], { icon: IconName; tint: string; color: string }> = {
  warning: { icon: 'alert-outline', tint: '#FEF3C7', color: '#D97706' },
  danger: { icon: 'alert-octagon-outline', tint: '#FEE2E2', color: '#DC2626' },
  success: { icon: 'check-circle-outline', tint: colors.successSoft, color: colors.success },
  info: { icon: 'information-outline', tint: colors.primarySoft, color: colors.primary },
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};

export default function NotifikasiScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>(notificationsSeed);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Notifikasi</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={markAllRead}
            style={styles.readAllButton}
          >
            <Text style={styles.readAllText}>Tandai Semua Dibaca</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="bell-outline" title="Tidak ada notifikasi" />}
        renderItem={({ item }) => {
          const meta = typeMeta[item.type];
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => toggleRead(item.id)}
              style={[styles.card, !item.read && styles.cardUnread]}
            >
              <View style={[styles.iconWrap, { backgroundColor: meta.tint }]}>
                <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
      />
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
  readAllButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  readAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardMessage: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  cardTime: {
    fontSize: 10,
    color: '#9AA8C2',
    marginTop: 5,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
