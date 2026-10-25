import { poiTypes, type PoiType } from './trip-overview';
import type { Language } from './i18n';
export type LocalizedText = { zh: string; en?: string };
export interface Place {
  id: string;
  icon?: string;
  poiType?: PoiType | null;
  regionId?: string;
  preference?: string;
  location?: { precision?: string };
  links?: { type: string; url: string | null; label?: string | null }[];
  category: 'poi' | 'accommodation';
  name: LocalizedText;
  nameJa?: string | null;
  coordinates: { longitude: number; latitude: number };
  description?: LocalizedText;
  source?: { label: string; url: string; coordinateNote?: string };
}
export function localize(text: LocalizedText, language: Language): string {
  return text[language] || text.en || text.zh;
}
// The UI depends on this loader; a future API can replace the static file here.
export async function loadPlaces(signal: AbortSignal): Promise<Place[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/places.json`, { signal });
  if (!response.ok) throw new Error('Could not load places');
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.places)) throw new Error('Invalid places file');
  const ids = new Set<string>();
  for (const p of data.places) {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || !['poi', 'accommodation'].includes(p.category)
      || (p.category === 'poi' && !Object.hasOwn(poiTypes, p.poiType))
      || typeof p.name?.zh !== 'string' || !p.name.zh || (p.name.en !== undefined && typeof p.name.en !== 'string')
      || !Number.isFinite(p.coordinates?.longitude) || Math.abs(p.coordinates.longitude) > 180
      || !Number.isFinite(p.coordinates?.latitude) || Math.abs(p.coordinates.latitude) > 90
      || (p.description !== undefined && (typeof p.description.zh !== 'string' || (p.description.en !== undefined && typeof p.description.en !== 'string')))
      || (p.source !== undefined && (typeof p.source.label !== 'string' || typeof p.source.url !== 'string' || !/^https?:\/\//.test(p.source.url)))) {
      throw new Error('Invalid place record');
    }
    ids.add(p.id);
  }
  return data.places;
}
