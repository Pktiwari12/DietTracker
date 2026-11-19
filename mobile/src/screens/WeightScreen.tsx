import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/CommonUI';
import { WeightLineChart } from '../components/Charts';
import { formatWeight } from '../utils/units';

export const WeightScreen: React.FC = () => {
  const colors = useTheme();
  const { weightLogs, onboarding, settings, addWeight, deleteWeight } = useApp();
  const [val, setVal] = useState('');

  const currentKg = weightLogs[0]?.weight_kg ?? (Number(onboarding.weight_kg) || 70);
  const targetKg = Number(onboarding.target_weight) || undefined;

  const chartData = [...weightLogs]
    .reverse()
    .slice(-10)
    .map((w) => ({
      label: new Date(w.logged_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      value: w.weight_kg,
    }));

  const logNew = () => {
    const n = Number(val);
    if (!n || n < 20 || n > 300) {
      Alert.alert('Invalid weight', 'Please enter a valid weight in kg.');
      return;
    }
    addWeight(n);
    setVal('');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Weight Tracking</Text>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Current</Text>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800' }}>{formatWeight(currentKg, settings.units)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Target</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
            {targetKg ? formatWeight(targetKg, settings.units) : 'Not set'}
          </Text>
        </Card>
      </View>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Log New Weight (preserves all history)</Text>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Weight in kg (e.g. 69.4)"
            placeholderTextColor={colors.textMuted}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity onPress={logNew} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Log</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Weight Trend</Text>
        <WeightLineChart data={chartData} targetWeight={targetKg} />
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>History ({weightLogs.length})</Text>
        {weightLogs.map((w) => (
          <View key={w.id} style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{formatWeight(w.weight_kg, settings.units)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(w.logged_at).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => deleteWeight(w.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 14 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  btn: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});
