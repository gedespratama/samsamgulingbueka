import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePrinter } from '../context/PrinterContext';
import type { PrinterDevice } from '../services/printer';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function PrinterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    status,
    device,
    scanning,
    devices,
    bluetoothEnabled,
    checkBluetooth,
    scanDevices,
    connect,
    disconnect,
    testPrint,
  } = usePrinter();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const isConnected = status === 'connected';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const enabled = await checkBluetooth();
        if (!active) return;
        if (!enabled) {
          Alert.alert(
            'Bluetooth Belum Aktif',
            'Aktifkan Bluetooth pada perangkat untuk mencari printer terdekat.'
          );
          return;
        }
        try {
          await scanDevices();
        } catch (error) {
          Alert.alert(
            'Gagal Scan',
            error instanceof Error ? error.message : 'Terjadi kesalahan saat memindai perangkat.'
          );
        }
      })();
      return () => {
        active = false;
      };
    }, [checkBluetooth, scanDevices])
  );

  const handleScan = async () => {
    const enabled = bluetoothEnabled ?? (await checkBluetooth());
    if (!enabled) {
      Alert.alert(
        'Bluetooth Belum Aktif',
        'Aktifkan Bluetooth pada perangkat untuk mencari printer terdekat.'
      );
      return;
    }
    try {
      await scanDevices();
    } catch (error) {
      Alert.alert(
        'Gagal Scan',
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memindai perangkat.'
      );
      return;
    }
    if (devices.length === 0) {
      Alert.alert('Scan Selesai', 'Tidak ada perangkat ditemukan. Pastikan printer menyala.');
    }
  };

  const handleConnect = async (target: PrinterDevice) => {
    setConnectingId(target.id);
    try {
      await connect(target);
      Alert.alert('Berhasil', `${target.name} berhasil disambungkan.`);
    } catch {
      Alert.alert('Gagal', 'Gagal terhubung ke printer. Coba lagi.');
    } finally {
      setConnectingId(null);
    }
  };

  const handleTestPrint = async () => {
    setPrinting(true);
    try {
      await testPrint();
    } catch {
      Alert.alert('Gagal', 'Gagal membuat struk uji coba. Coba lagi.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const statusLabel =
    status === 'connected' ? 'Terkoneksi (Bluetooth)' : status === 'connecting' ? 'Menghubungkan...' : 'Tidak Terkoneksi';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Koneksi Printer</Text>
          <Text style={styles.subtitle}>Bluetooth thermal printer struk</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: isConnected ? colors.successSoft : status === 'connecting' ? '#FEF3C7' : '#E5EAF3' },
            ]}
          >
            {status === 'connecting' ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <MaterialCommunityIcons
                name="printer"
                size={24}
                color={isConnected ? colors.success : '#9AA8C2'}
              />
            )}
          </View>
          <View style={styles.statusTextArea}>
            <Text style={styles.statusLabel}>Status Printer</Text>
            <Text
              style={[
                styles.statusValue,
                {
                  color: isConnected
                    ? colors.success
                    : status === 'connecting'
                      ? '#D97706'
                      : '#9AA8C2',
                },
              ]}
            >
              {statusLabel}
            </Text>
            {isConnected && device && (
              <>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceAddress}>{device.address}</Text>
              </>
            )}
          </View>
        </View>

        {bluetoothEnabled === false && (
          <View style={styles.btWarning}>
            <MaterialCommunityIcons name="bluetooth-off" size={18} color={colors.warning} />
            <View style={styles.btWarningTextArea}>
              <Text style={styles.btWarningTitle}>Bluetooth Belum Aktif</Text>
              <Text style={styles.btWarningText}>
                Aktifkan Bluetooth pada perangkat untuk mencari printer terdekat.
              </Text>
            </View>
          </View>
        )}

        {isConnected ? (
          <View style={styles.connectedArea}>
            <View style={styles.deviceCard}>
              <View style={styles.deviceIcon}>
                <MaterialCommunityIcons name="printer-check" size={22} color={colors.success} />
              </View>
              <View style={styles.deviceTextArea}>
                <Text style={styles.deviceName}>{device?.name}</Text>
                <Text style={styles.deviceAddress}>{device?.address}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>Terkoneksi</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={printing}
              onPress={handleTestPrint}
              style={[styles.actionButton, styles.primaryButton, printing && styles.buttonDisabled]}
            >
              {printing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={17} color={colors.white} />
              )}
              <Text style={styles.primaryButtonText}>
                {printing ? 'Mencetak...' : 'Uji Cetak Struk'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleDisconnect}
              style={[styles.actionButton, styles.disconnectButton]}
            >
              <MaterialCommunityIcons name="link-off" size={17} color={colors.danger} />
              <Text style={styles.disconnectButtonText}>Putuskan Koneksi</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.scanArea}>
            <Pressable
              accessibilityRole="button"
              disabled={scanning || status === 'connecting'}
              onPress={handleScan}
              style={[styles.actionButton, styles.primaryButton, (scanning || status === 'connecting') && styles.buttonDisabled]}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="bluetooth" size={17} color={colors.white} />
              )}
              <Text style={styles.primaryButtonText}>
                {scanning ? 'Mencari Perangkat...' : 'Cari Perangkat Bluetooth'}
              </Text>
            </Pressable>

            <Text style={styles.hint}>Pastikan Bluetooth HP menyala dan printer dalam mode pairing.</Text>

            {devices.map((dev) => {
              const connecting = connectingId === dev.id;
              return (
                <View key={dev.id} style={styles.deviceCard}>
                  <View style={styles.deviceIcon}>
                    <MaterialCommunityIcons name="bluetooth-audio" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.deviceTextArea}>
                    <Text style={styles.deviceName}>{dev.name}</Text>
                    <Text style={styles.deviceAddress}>{dev.address}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={connecting || status === 'connecting'}
                    onPress={() => handleConnect(dev)}
                    style={styles.connectButton}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.connectButtonText}>Sambungkan</Text>
                    )}
                  </Pressable>
                </View>
              );
            })}

            {devices.length > 0 && (
              <Text style={styles.foundText}>{devices.length} perangkat ditemukan</Text>
            )}
          </View>
        )}
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 28,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextArea: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  deviceAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  connectedArea: {
    marginTop: 16,
    gap: 10,
  },
  scanArea: {
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  buttonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  btWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  btWarningTextArea: {
    flex: 1,
  },
  btWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
  btWarningText: {
    fontSize: 11,
    color: colors.warning,
    marginTop: 2,
    lineHeight: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  deviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceTextArea: {
    flex: 1,
  },
  connectedBadge: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  connectButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  foundText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
