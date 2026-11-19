import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const CHART_W = 310;
const CHART_H = 150;
const PAD = 26;

export const WeightLineChart: React.FC<{
  data: { label: string; value: number }[];
  targetWeight?: number;
}> = ({ data, targetWeight }) => {
  const colors = useTheme();
  if (data.length === 0) {
    return <Text style={{ color: colors.textMuted, paddingVertical: 16 }}>No weight entries logged yet.</Text>;
  }

  const vals = [...data.map((d) => d.value), ...(targetWeight ? [targetWeight] : [])];
  const minV = Math.min(...vals) - 2;
  const maxV = Math.max(...vals) + 2;
  const span = Math.max(1, maxV - minV);

  const getX = (i: number) =>
    data.length === 1 ? CHART_W / 2 : PAD + (i / (data.length - 1)) * (CHART_W - PAD * 2);
  const getY = (v: number) => CHART_H - PAD - ((v - minV) / span) * (CHART_H - PAD * 2);

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const targetY = targetWeight ? getY(targetWeight) : null;

  return (
    <View style={styles.box}>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {targetY !== null && (
          <>
            <Line x1={PAD} y1={targetY} x2={CHART_W - PAD} y2={targetY} stroke={colors.warning} strokeDasharray="5,4" strokeWidth={1.5} />
            <SvgText x={CHART_W - PAD - 4} y={targetY - 4} fontSize={10} fill={colors.warning} textAnchor="end">
              Target {targetWeight} kg
            </SvgText>
          </>
        )}
        <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2.5} />
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={getX(i)} cy={getY(d.value)} r={4} fill={colors.primary} />
            <SvgText x={getX(i)} y={CHART_H - 6} fontSize={9} fill={colors.textMuted} textAnchor="middle">
              {d.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

export const SimpleBarChart: React.FC<{
  data: { label: string; value: number }[];
  targetLine?: number;
  barColor: string;
}> = ({ data, targetLine, barColor }) => {
  const colors = useTheme();
  const maxV = Math.max(targetLine || 0, ...data.map((d) => d.value), 10) * 1.15;
  const barW = Math.max(10, Math.min(24, (CHART_W - PAD * 2) / Math.max(1, data.length) - 6));

  return (
    <View style={styles.box}>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {targetLine && targetLine > 0 ? (
          <Line
            x1={PAD}
            y1={CHART_H - PAD - (targetLine / maxV) * (CHART_H - PAD * 2)}
            x2={CHART_W - PAD}
            y2={CHART_H - PAD - (targetLine / maxV) * (CHART_H - PAD * 2)}
            stroke={colors.warning}
            strokeDasharray="4,4"
            strokeWidth={1.5}
          />
        ) : null}
        {data.map((d, i) => {
          const step = (CHART_W - PAD * 2) / Math.max(1, data.length);
          const x = PAD + i * step + (step - barW) / 2;
          const h = (d.value / maxV) * (CHART_H - PAD * 2);
          const y = CHART_H - PAD - h;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={Math.max(2, h)} rx={4} fill={barColor} />
              <SvgText x={x + barW / 2} y={CHART_H - 6} fontSize={9} fill={colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

export const StackedMacroChart: React.FC<{
  data: { label: string; protein: number; carbs: number; fat: number }[];
}> = ({ data }) => {
  const colors = useTheme();
  const totals = data.map((d) => d.protein + d.carbs + d.fat);
  const maxV = Math.max(...totals, 10) * 1.15;
  const barW = Math.max(10, Math.min(24, (CHART_W - PAD * 2) / Math.max(1, data.length) - 6));

  return (
    <View style={styles.box}>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {data.map((d, i) => {
          const step = (CHART_W - PAD * 2) / Math.max(1, data.length);
          const x = PAD + i * step + (step - barW) / 2;
          const usableH = CHART_H - PAD * 2;
          const pH = (d.protein / maxV) * usableH;
          const cH = (d.carbs / maxV) * usableH;
          const fH = (d.fat / maxV) * usableH;
          const base = CHART_H - PAD;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={base - pH} width={barW} height={pH} fill={colors.protein} />
              <Rect x={x} y={base - pH - cH} width={barW} height={cH} fill={colors.carbs} />
              <Rect x={x} y={base - pH - cH - fH} width={barW} height={fH} fill={colors.fat} />
              <SvgText x={x + barW / 2} y={CHART_H - 6} fontSize={9} fill={colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text style={{ color: colors.protein, fontSize: 12, fontWeight: '700' }}>■ Protein</Text>
        <Text style={{ color: colors.carbs, fontSize: 12, fontWeight: '700' }}>■ Carbs</Text>
        <Text style={{ color: colors.fat, fontSize: 12, fontWeight: '700' }}>■ Fat</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { width: '100%', alignItems: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
});
