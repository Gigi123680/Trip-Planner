import { poiTypes } from './trip-overview';
import type { Place } from './places';
export const regionOptions = [
  { id: 'fukuoka', zh: '福冈', en: 'Fukuoka' },
  { id: 'yufuin', zh: '由布院', en: 'Yufuin' },
  { id: 'beppu-area', zh: '别府 / 日出', en: 'Beppu / Hiji' },
  { id: 'kurokawa', zh: '黑川温泉', en: 'Kurokawa' },
  { id: 'aso', zh: '阿苏', en: 'Aso' }
];
export const typeOptions = [...Object.entries(poiTypes).map(([id, value]) => ({ id, ...value })), { id: 'accommodation', zh: '住宿', en: 'Stay', icon: 'house' }];
export interface Filters { q: string; regions: string[]; types: string[]; focus: string | null }
export function readFilters(): Filters {
  const params = new URLSearchParams(location.search);
  function read(key: string, known: string[]) {
    if (!params.has(key)) return known;
    return (params.get(key) || '').split(',').filter(id => known.includes(id));
  }
  return { focus: regionOptions.some(r => r.id === params.get('focus')) ? params.get('focus') : null, q: params.get('q') || '', regions: read('regions', regionOptions.map(r => r.id)), types: read('types', typeOptions.map(t => t.id)) };
}
export function allFilters(): Filters { return { focus: null, q: '', regions: regionOptions.map(r => r.id), types: typeOptions.map(t => t.id) }; }
export function filterPlaces(places: Place[], filters: Filters): Place[] {
  const query = filters.q.normalize('NFKC').trim().toLocaleLowerCase();
  return places.filter(p => filters.regions.includes(p.regionId || '') && filters.types.includes(p.category === 'accommodation' ? 'accommodation' : p.poiType || 'natural_scenery')
    && (!query || [p.name.zh, p.name.en, p.nameJa].filter(Boolean).some(name => name!.normalize('NFKC').toLocaleLowerCase().includes(query))));
}
export function writeFilters(filters: Filters) {
  const url = new URL(location.href);
  if (filters.q) url.searchParams.set('q', filters.q); else url.searchParams.delete('q');
  for (const [key, values, count] of [['regions', filters.regions, regionOptions.length], ['types', filters.types, typeOptions.length]] as const) {
    if (values.length === count) url.searchParams.delete(key); else url.searchParams.set(key, values.join(',') || 'none');
  }
  if (filters.focus) url.searchParams.set('focus', filters.focus); else url.searchParams.delete('focus');
  history.replaceState(null, '', url);
}
