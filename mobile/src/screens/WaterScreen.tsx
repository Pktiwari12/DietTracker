import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/CommonUI';
import { formatWater, isSameLocalDay } from '../utils/units';

export const WaterScreen: React.FC = () => {
  const colors = useTheme();
  const { waterLogs, targets, settings, addWater, deleteWater } = useApp();
  const [customMl, setCustomMl] = useState('');

  const todayLogs = waterLogs.filter((w) => isSameLocalDay(w.logged_at));
  const totalMl = todayLogs.reduce((s, w) => s + w.amount_ml, 0);
  const pct = Math.min(100, Math.round((totalMl / Math.max(1, targets.water_ml)) * 100));

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Water Tracking</Text>

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        {/* Visual Filling Bottle Graphic (Blueprint Section 7.6) */}
        <View style={[styles.bottleOuter, { borderColor: colors.water }]}>
          <View style={[styles.bottleFill, { height: `${pct}%`, backgroundColor: colors.water }]} />
          <Text style={[styles.bottlePct, { color: pct > 50 ? '#FFF' : colors.text }]}>{pct}%</Text>
        </View>
        <Text style={{ color: colors.water, fontSize: 22, fontWeight: '800', marginTop: 12 }}>
          {formatWater(totalMl, settings.units)} / {formatWater(targets.water_ml, settings.units)}
        </Text>
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Quick Add</Text>
        <View style={styles.presetRow}>
          {[200, 250, 500].map((ml) => (
            <TouchableOpacity key={ml} onPress={() => addWater(ml)} style={[styles.presetBtn, { backgroundColor: colors.water }]}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>+{ml} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customRow}>
          <TextInput
            placeholder="Custom amount (ml)"
            placeholderTextColor={colors.textMuted}
            value={customMl}
            onChangeText={setCustomMl}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity
            onPress={() => {
              const v = Number(customMl);
              if (v > 0) {
                addWater(v);
                setCustomMl('');
              }
            }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Today's Entries ({todayLogs.length})</Text>
        {todayLogs.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>No water logged today yet.</Text>
        ) : (
          todayLogs.map((w) => (
            <View key={w.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{formatWater(w.amount_ml, settings.units)}</Text>
              <Text style={{ color: colors.textMuted }}>{new Date(w.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete entry?', 'Remove this water log?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteWater(w.id) },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 14 },
  bottleOuter: { width: 96, height: 150, borderWidth: 3, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bottleFill: { width: '100%' },
  bottlePct: { position: 'absolute', top: '42%', fontSize: 20, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  presetBtn: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  addBtn: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});
