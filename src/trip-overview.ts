import drivingRouteText from '../public/routes/driving.geojson?raw';
export const poiTypes = {
  natural_scenery: { zh: '自然风景', en: 'Nature', icon: 'mountain' },
  hot_spring: { zh: '温泉浴场', en: 'Bathing', icon: 'onsen' },
  town: { zh: '街区漫游', en: 'Town walks', icon: 'village' },
  food_market: { zh: '美食与市场', en: 'Food & markets', icon: 'shop' }
} as const;
export type PoiType = keyof typeof poiTypes;
// Label anchors identify regional context, not precise administrative centroids.
export const tripRegions = [
  { id: 'fukuoka', zh: '福冈', en: 'Fukuoka', coordinates: [130.401667, 33.59], offset: [65, -8] },
  { id: 'yufuin', zh: '由布院', en: 'Yufuin', coordinates: [131.365193, 33.274488], offset: [-85, -8] },
  { id: 'beppu-area', zh: '别府', en: 'Beppu', coordinates: [131.476237, 33.315453], offset: [85, -8] },
  { id: 'kurokawa', zh: '黑川温泉', en: 'Kurokawa', coordinates: [131.14194, 33.07771], offset: [-90, -8] },
  { id: 'aso', zh: '阿苏', en: 'Aso', coordinates: [131.053547, 32.881466], offset: [-70, -8] }
] as const;
// Cached road geometry; no live routing request is made by the browser.
export interface DrivingRouteCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { id: string; distanceMeters: number; durationSeconds: number; generatedOn: string };
    geometry: { type: 'LineString'; coordinates: number[][] };
  }>;
}
export const overviewRoute = JSON.parse(drivingRouteText) as DrivingRouteCollection;
