import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MealFoodEntry } from '../types';

const BOX_COLORS = ['#2E7D32', '#EF6C00', '#0288D1', '#7B1FA2', '#C62828'];

export const BoundingBoxOverlay: React.FC<{
  photoUri?: string;
  items: MealFoodEntry[];
}> = ({ photoUri, items }) => {
  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.img, styles.placeholder]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Meal Photo Preview</Text>
        </View>
      )}
      {items.map((item, idx) => {
        if (!item.bbox) return null;
        const [x1, y1, x2, y2] = item.bbox;
        const color = item.is_low_confidence ? '#E68A00' : BOX_COLORS[idx % BOX_COLORS.length];
        return (
          <View
            key={item.id}
            style={[
              styles.box,
              {
                left: `${x1 * 100}%`,
                top: `${y1 * 100}%`,
                width: `${(x2 - x1) * 100}%`,
                height: `${(y2 - y1) * 100}%`,
                borderColor: color,
              },
            ]}
          >
            <View style={[styles.tag, { backgroundColor: color }]}>
              <Text style={styles.tagText} numberOfLines={1}>
                {item.name_en.split(' ')[0]} {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 14, position: 'relative' },
  img: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#263829', alignItems: 'center', justifyContent: 'center' },
  box: { position: 'absolute', borderWidth: 2, borderRadius: 6 },
  tag: { position: 'absolute', top: -1, left: -1, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
