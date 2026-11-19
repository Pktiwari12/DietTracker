import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  label: string;
  current: number;
  target: number;
  unit?: string;
  barColor: string;
}

export const MacroBar: React.FC<Props> = ({ label, current, target, unit = 'g', barColor }) => {
  const colors = useTheme();
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <View style={styles.container} accessible accessibilityLabel={`${label} ${Math.round(current)} of ${target} ${unit}`}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.val, { color: colors.textMuted }]}>
          {Math.round(current)} / {target} {unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600' },
  val: { fontSize: 13, fontWeight: '600' },
  track: { height: 9, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
