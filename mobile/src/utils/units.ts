import { UnitSystem } from '../types';

export function formatWeight(kg: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${(kg * 2.20462).toFixed(1)} lb`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatWater(ml: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${(ml / 29.5735).toFixed(0)} oz`;
  }
  return ml >= 1000 ? `${(ml / 1000).toFixed(2)} L` : `${ml} ml`;
}

export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inches = Math.round(totalIn % 12);
    return `${ft}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function isSameLocalDay(isoA: string, refDate: Date = new Date()): boolean {
  const d = new Date(isoA);
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
}

export function getDefaultMealTypeByTime(): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Breakfast';
  if (h >= 11 && h < 16) return 'Lunch';
  if (h >= 16 && h < 19) return 'Snacks';
  return 'Dinner';
}
