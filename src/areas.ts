import type { Place } from './places';
export type Coordinate = [number, number];
export interface Area { id: string; zh: string; en: string; kind: 'region' | 'walk'; ring: Coordinate[]; line?: Coordinate[]; source: string; note: string }
export function ellipse(center: Coordinate, eastKm: number, northKm: number, count = 64): Coordinate[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = i * Math.PI * 2 / count;
    return [center[0] + Math.cos(angle) * eastKm / (111.32 * Math.cos(center[1] * Math.PI / 180)), center[1] + Math.sin(angle) * northKm / 111.32] as Coordinate;
  });
}
export function hull(points: Coordinate[]): Coordinate[] {
  const sorted = [...points].sort((a,b) => a[0]-b[0] || a[1]-b[1]);
  const cross = (a: Coordinate,b: Coordinate,c: Coordinate) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const lower: Coordinate[] = [], upper: Coordinate[] = [];
  for (const point of sorted) { while (lower.length >= 2 && cross(lower.at(-2)!,lower.at(-1)!,point) <= 0) lower.pop(); lower.push(point); }
  for (const point of sorted.reverse()) { while (upper.length >= 2 && cross(upper.at(-2)!,upper.at(-1)!,point) <= 0) upper.pop(); upper.push(point); }
  const ring = lower.slice(0,-1).concat(upper.slice(0,-1));
  return [...ring, ring[0]];
}
const seeds: Record<string,{ center: Coordinate; east: number; north: number; zh: string; en: string; source: string }> = {
  fukuoka: { center:[130.401667,33.59], east:8,north:6,zh:'福冈',en:'Fukuoka',source:'https://facts.city.fukuoka.lg.jp/en/data/position/' },
  yufuin: { center:[131.367,33.272],east:3,north:2.5,zh:'由布院',en:'Yufuin',source:'https://www.city.yufu.oita.jp/uploads/files/guidebooks/guidebook_2021_en.pdf' },
  'beppu-area': { center:[131.482,33.302],east:4,north:5,zh:'别府 / 日出',en:'Beppu / Hiji',source:'https://www.city.beppu.oita.jp/' },
  kurokawa: { center:[131.142,33.078],east:2,north:1.7,zh:'黑川温泉',en:'Kurokawa',source:'https://www.kurokawaonsen.or.jp/map/' },
  aso: { center:[131.08,32.93],east:9,north:12.5,zh:'阿苏盆地',en:'Aso caldera',source:'https://gbank.gsj.jp/volcano/Act_Vol/aso/text/eng/exp04-1e.html' }
};
export function regionAreas(places: Place[]): Record<string, Area> {
  return Object.fromEntries(Object.entries(seeds).map(([id, seed]) => {
    const points = ellipse(seed.center,seed.east,seed.north);
    for (const place of places.filter(p => p.regionId === id)) points.push(...ellipse([place.coordinates.longitude,place.coordinates.latitude],.35,.35,12));
    return [id,{ id,zh:seed.zh,en:seed.en,kind:'region',ring:hull(points),source:seed.source,note: id === 'aso' ? 'Approximate 25 × 18 km caldera envelope plus saved places; not a traced geological boundary.' : 'Approximate planning envelope plus saved places, including nearby excursions; not an administrative boundary.' }];
  }));
}
// Curated orientation footprints, not surveyed boundaries or walking routes.
const street: Coordinate[] = [[131.3594,33.2645],[131.3603,33.2650],[131.3613,33.2656],[131.3622,33.2660],[131.3631,33.26675],[131.3641,33.2673],[131.3652,33.2678],[131.3665,33.2679]];
export const walkAreas: Record<string, Area> = {
  'kurokawa-village-center': { id:'kurokawa-village-center',zh:'黑川温泉街 · 近似步行范围',en:'Kurokawa village · approximate walking area',kind:'walk',ring:[[131.1378,33.0775],[131.1386,33.0789],[131.1413,33.07925],[131.1441,33.0786],[131.145,33.0771],[131.1433,33.0759],[131.1404,33.0760],[131.1383,33.0766],[131.1378,33.0775]],source:'https://www.kurokawaonsen.or.jp/map/',note:'Hand-curated approximate village core around the central inns and streets; not a complete walk or access boundary.' },
  'yunotsubo-kaido': { id:'yunotsubo-kaido',zh:'汤之坪街道 · 近似游逛走廊',en:'Yunotsubo Street · approximate exploration corridor',kind:'walk',line:street,ring:hull(street.flatMap(point=>ellipse(point,.045,.045,12))),source:'https://www.city.yufu.oita.jp/wp-content/uploads/2020/07/yunotubokeikakusho.pdf',note:'Hand-curated approximate shopping-street corridor; not a surveyed street alignment or the official landscape-planning boundary.' }
};
export function overlappingIndices(points: { x:number;y:number }[], start:number): number[] {
  const found = new Set([start]); const queue=[start];
  while (queue.length) {
    const current=queue.shift()!;
    points.forEach((point,index) => {
      if (!found.has(index) && Math.abs(point.x-points[current].x)<42 && Math.abs(point.y-points[current].y)<54) { found.add(index);queue.push(index); }
    });
  }
  return [...found];
}
