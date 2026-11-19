import React, { useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BRAND } from '../config/brand';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card, PrimaryButton } from '../components/CommonUI';

export const ProfileSettingsScreen: React.FC = () => {
  const colors = useTheme();
  const {
    onboarding, targets, settings, updateCustomTargets, updateSettings,
    scheduleLocalReminders, exportAllDataJson, logout, deleteAccount,
  } = useApp();

  const [calInput, setCalInput] = useState(String(targets.calories));
  const [protInput, setProtInput] = useState(String(targets.protein_g));
  const [waterInput, setWaterInput] = useState(String(targets.water_ml));

  const saveTargets = () => {
    updateCustomTargets({
      calories: Math.max(1200, Number(calInput) || targets.calories),
      protein_g: Math.max(20, Number(protInput) || targets.protein_g),
      water_ml: Math.max(1000, Number(waterInput) || targets.water_ml),
    });
    Alert.alert('Saved', 'Your daily targets have been updated.');
  };

  const handleExport = async () => {
    const json = exportAllDataJson();
    await Share.share({ title: `${BRAND.appName} Data Export`, message: json });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.brandRow}>
        <Image source={BRAND.logoAsset} style={styles.logo} />
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>{onboarding.name || 'User'}</Text>
          <Text style={{ color: colors.textMuted }}>
            {onboarding.primary_goal} • {onboarding.diet_type}
          </Text>
        </View>
      </View>

      {/* Goals & Targets */}
      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Daily Targets</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Calories (kcal)</Text>
        <TextInput value={calInput} onChangeText={setCalInput} keyboardType="number-pad" style={[styles.input, { borderColor: colors.border, color: colors.text }]} />
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Protein (g)</Text>
        <TextInput value={protInput} onChangeText={setProtInput} keyboardType="number-pad" style={[styles.input, { borderColor: colors.border, color: colors.text }]} />
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Water (ml)</Text>
        <TextInput value={waterInput} onChangeText={setWaterInput} keyboardType="number-pad" style={[styles.input, { borderColor: colors.border, color: colors.text }]} />
        <PrimaryButton title="Update Targets" onPress={saveTargets} />
      </Card>

      {/* App Preferences: Language, Units, Dark Mode */}
      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>App Preferences</Text>

        <Text style={[styles.label, { color: colors.text }]}>Language</Text>
        <View style={styles.row}>
          {(['en', 'hi'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => updateSettings({ language: l })}
              style={[styles.chip, { backgroundColor: settings.language === l ? colors.primary : colors.background, borderColor: colors.border }]}
            >
              <Text style={{ color: settings.language === l ? '#FFF' : colors.text, fontWeight: '700' }}>
                {l === 'en' ? 'English' : 'हिंदी (Hindi)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Units</Text>
        <View style={styles.row}>
          {(['metric', 'imperial'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => updateSettings({ units: u })}
              style={[styles.chip, { backgroundColor: settings.units === u ? colors.primary : colors.background, borderColor: colors.border }]}
            >
              <Text style={{ color: settings.units === u ? '#FFF' : colors.text, fontWeight: '700' }}>
                {u === 'metric' ? 'kg / cm / ml' : 'lb / ft-in / oz'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
        <View style={styles.row}>
          {(['system', 'light', 'dark'] as const).map((th) => (
            <TouchableOpacity
              key={th}
              onPress={() => updateSettings({ theme: th })}
              style={[styles.chip, { backgroundColor: settings.theme === th ? colors.primary : colors.background, borderColor: colors.border }]}
            >
              <Text style={{ color: settings.theme === th ? '#FFF' : colors.text, fontWeight: '700', textTransform: 'capitalize' }}>{th}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Notifications & Reminders */}
      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Reminders</Text>
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, flex: 1 }}>Enable Daily Reminders</Text>
          <Switch
            value={settings.reminders.enabled}
            onValueChange={(v) => updateSettings({ reminders: { ...settings.reminders, enabled: v } })}
          />
        </View>
        <PrimaryButton
          title="Apply & Schedule Reminders"
          variant="outline"
          onPress={async () => {
            const ok = await scheduleLocalReminders();
            Alert.alert(ok ? 'Reminders Scheduled' : 'Permission Needed', ok ? 'Your reminders are active.' : 'Enable notifications in Android Settings.');
          }}
        />
      </Card>

      {/* Data, Privacy & AI Consent (Section 5.5 & 14) */}
      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>Data & Privacy</Text>
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>
            Allow using my meal photos & corrections to improve AI food recognition (default OFF)
          </Text>
          <Switch
            value={settings.trainingPhotoConsent}
            onValueChange={(v) => updateSettings({ trainingPhotoConsent: v })}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>Upload meal photos on Wi-Fi only</Text>
          <Switch
            value={settings.wifiOnlyUpload}
            onValueChange={(v) => updateSettings({ wifiOnlyUpload: v })}
          />
        </View>
        <PrimaryButton title="Export All My Data (JSON)" variant="outline" onPress={handleExport} style={{ marginTop: 10 }} />
        <PrimaryButton
          title="Delete Account & All Data"
          variant="danger"
          onPress={() =>
            Alert.alert('Delete Account?', 'This removes your local data and schedules permanent server deletion within 30 days.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: deleteAccount },
            ])
          }
          style={{ marginTop: 10 }}
        />
      </Card>

      {/* About, Nutrition Sources & Health Disclaimer */}
      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>About {BRAND.appName}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
          • Version: 1.0.0{'\n'}
          • Nutrition Sources: Indian Food Composition Tables (IFCT 2017) & USDA FoodData Central.{'\n'}
          • Photo Tips: Shoot from above in good light, keep the full plate in frame, and separate items slightly.{'\n'}
          • Health Disclaimer: General nutritional guidance only; does not replace a doctor or dietitian.
        </Text>
      </Card>

      <PrimaryButton
        title="Log Out"
        variant="outline"
        onPress={() =>
          Alert.alert('Log out?', 'Local private data will be cleared from this device.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
          ])
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 48, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logo: { width: 52, height: 52, borderRadius: 12 },
  heading: { fontSize: 22, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  label: { fontWeight: '700', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8, gap: 10 },
});
