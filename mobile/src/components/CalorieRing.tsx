import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  eaten: number;
  target: number;
  labelRemaining: string;
  labelOver: string;
}

export const CalorieRing: React.FC<Props> = ({ eaten, target, labelRemaining, labelOver }) => {
  const colors = useTheme();
  const size = 164;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? eaten / target : 0;
  const clamped = Math.min(1, Math.max(0, ratio));
  const strokeDashoffset = circumference * (1 - clamped);

  // Blueprint Section 7.4 color cues: green on track, amber close to limit, red exceeded
  const ringColor =
    ratio > 1.0 ? colors.danger : ratio >= 0.88 ? colors.warning : colors.primary;

  const remaining = Math.round(target - eaten);
  const isOver = remaining < 0;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${Math.round(eaten)} of ${target} calories eaten`}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.bigNum, { color: ringColor }]}>{Math.abs(remaining)}</Text>
        <Text style={[styles.subLabel, { color: colors.textMuted }]}>
          {isOver ? labelOver : labelRemaining}
        </Text>
        <Text style={[styles.kcalUnit, { color: colors.textMuted }]}>kcal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  center: { position: 'absolute', alignItems: 'center' },
  bigNum: { fontSize: 30, fontWeight: '800' },
  subLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  kcalUnit: { fontSize: 11 },
});
