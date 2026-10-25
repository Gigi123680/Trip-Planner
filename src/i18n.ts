export const translations = {
  zh: {
    title: '九州 · 旅行手记', brand: '旅行手记', eyebrow: '日本 · 九州', heading: '下一段旅程，', destination: '从九州开始。', description: '火山、温泉与沿途的风景。在这里，一起慢慢勾勒下一段旅程。', canvas: '探索地图', region: '日本 · 九州', regionNote: '七个县，无数种旅行的可能', back: '回到九州', mood: '地图风格', explore: '探索', quiet: '简约', moodNote: '看见更多细节，或留一点想象的空间。', first: '先从认识这片土地开始。', next: '点击地图标记，查看地点信息。', footer: '旅程从这里开始', tag: '探索九州', loading: '正在加载地图…', error: '部分地图数据加载失败，请检查网络或刷新页面。', ready: '拖动探索 · 滚动缩放', map: '九州互动地图', language: '界面语言'
  },
  en: {
    title: 'Kyushu — Field notes', brand: 'FIELD NOTES', eyebrow: 'JAPAN · THE SOUTHERN ISLAND', heading: 'A little closer', destination: 'to Kyushu.', description: 'Volcanic landscapes, slow mornings, and roads worth taking. A place for our next journey to take shape.', canvas: 'YOUR CANVAS', region: 'Kyushu, Japan', regionNote: 'Seven prefectures, endless possibilities', back: 'Back to Kyushu', mood: 'MAP STYLE', explore: 'Explore', quiet: 'Quiet', moodNote: 'A little detail, or a little breathing room.', first: 'First, find our bearings.', next: 'Select a marker to discover a place.', footer: 'THE JOURNEY STARTS HERE', tag: 'KYUSHU EXPLORER', loading: 'Loading the landscape…', error: 'Some map data could not load. Check your connection or reload.', ready: 'Drag to explore · Scroll to zoom', map: 'Interactive map of Kyushu', language: 'Interface language'
  }
};
export type Language = keyof typeof translations;
export function initialLanguage(): Language {
  try { return localStorage.getItem('kyushu-language') === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}
