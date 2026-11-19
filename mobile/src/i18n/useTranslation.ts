import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from './translations';

export function useTranslation() {
  const { settings } = useApp();
  const lang = settings.language || 'en';
  const t = (key: string): string => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  return { t, lang };
}
