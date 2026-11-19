import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton } from '../components/CommonUI';
import { isSameLocalDay } from '../utils/units';

const ACTIVITIES = ['Walking', 'Running', 'Cycling', 'Gym', 'Yoga', 'Swimming', 'Sports', 'Other'];
const INTENSITIES: ('Light' | 'Moderate' | 'Vigorous')[] = ['Light', 'Moderate', 'Vigorous'];

export const ExerciseScreen: React.FC = () => {
  const colors = useTheme();
  const { exerciseLogs, addExercise, deleteExercise } = useApp();
  const [activity, setActivity] = useState('Walking');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<'Light' | 'Moderate' | 'Vigorous'>('Moderate');

  const todayLogs = exerciseLogs.filter((e) => isSameLocalDay(e.logged_at));
  const totalBurned = Math.round(todayLogs.reduce((s, e) => s + e.calories_burned, 0));

  const logActivity = () => {
    const mins = Number(duration);
    if (!mins || mins <= 0) {
      Alert.alert('Invalid duration', 'Enter duration in minutes.');
      return;
    }
    addExercise(activity, mins, intensity);
    Alert.alert('Activity Logged', `${activity} (${mins} min) saved.`);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Exercise</Text>

      <Card style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontWeight: '700' }}>TODAY'S CALORIES BURNED</Text>
        <Text style={{ color: colors.warning, fontSize: 32, fontWeight: '800', marginTop: 4 }}>{totalBurned} kcal</Text>
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Log Activity</Text>
        <View style={styles.chipWrap}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setActivity(a)}
              style={[
                styles.chip,
                { backgroundColor: activity === a ? colors.primary : colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: activity === a ? '#FFF' : colors.text, fontWeight: '600', fontSize: 13 }}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Intensity</Text>
        <View style={styles.row}>
          {INTENSITIES.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              onPress={() => setIntensity(lvl)}
              style={[
                styles.intBtn,
                { backgroundColor: intensity === lvl ? colors.primary : colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: intensity === lvl ? '#FFF' : colors.text, fontWeight: '700', fontSize: 13 }}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton title="Save Activity" onPress={logActivity} style={{ marginTop: 14 }} />
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Today's Activities ({todayLogs.length})</Text>
        {todayLogs.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>No exercise logged today yet.</Text>
        ) : (
          todayLogs.map((e) => (
            <View key={e.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{e.activity_type} ({e.intensity})</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {e.duration_min} min • {Math.round(e.calories_burned)} kcal burned
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteExercise(e.id)}>
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
  container: { flexGrow: 1, padding: 16, paddingTop: 50, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 14 },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, minHeight: 38, borderRadius: 18, borderWidth: 1, justifyContent: 'center' },
  label: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  row: { flexDirection: 'row', gap: 8 },
  intBtn: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
});
