import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Map, NavigationControl, AttributionControl, Marker, Popup, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(workerUrl);
import { kyushuBounds, mapStyles } from './config';
import './styles.css';
import regionNotesData from './region-notes.json';
const regionNotes: Record<string, {zh:string;en:string}[]> = regionNotesData;
import { tripRegions, overviewRoute, poiTypes } from './trip-overview';
import { allFilters, readFilters, writeFilters, filterPlaces, regionOptions, typeOptions } from './filters';
import { regionAreas, walkAreas, overlappingIndices, type Area } from './areas';
import { markerArt } from './marker-art';
import { loadPlaces, localize, type Place } from './places';
import { translations, initialLanguage, type Language } from './i18n';

function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = translations[language];
  const w = (zh: string, en: string) => language === 'zh' ? zh : en;
  const [filters, setFilters] = useState(readFilters);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [hoverArea, setHoverArea] = useState<string | null>(null);
  const regionLeaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holdRegionNote = () => clearTimeout(regionLeaveTimer.current);
  const leaveRegionNote = () => {
    holdRegionNote();
    regionLeaveTimer.current = setTimeout(() => setHoverArea(null), 1500);
  };
  useEffect(() => () => clearTimeout(regionLeaveTimer.current), []);
  const [placeArea, setPlaceArea] = useState<string | null>(null);
  const [spreadCount, setSpreadCount] = useState(0);
  const collapsePins = useRef<() => void>(() => {});
  const focusRegionAction = useRef<(id:string) => void>(() => {});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pinActions = useRef(new globalThis.Map<string, () => void>());
  useEffect(() => { writeFilters(filters); }, [filters]);
  useEffect(() => {
    const restore = () => setFilters(readFilters());
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
    document.title = t.title;
    try { localStorage.setItem('kyushu-language', language); } catch {}
  }, [language, t.title]);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const visiblePlaces = useMemo(() => filterPlaces(places, filters), [places, filters]);
  const areas = useMemo(() => regionAreas(places), [places]);
  const regionQuery = filters.q.normalize('NFKC').trim().toLowerCase();
  const regionMatches = regionQuery ? tripRegions.filter(region => [region.id,region.zh,region.en,region.id === 'yufuin' ? '湯布院 由布院' : region.id === 'aso' ? '阿蘇 aso mountain' : region.id === 'kurokawa' ? '黒川温泉' : region.id === 'beppu-area' ? '別府 日出 hiji' : '福岡'].some(name => name.toLowerCase().includes(regionQuery))) : [];
  const activeRegion = hoverArea || filters.focus;
  const highlightedRegion = tripRegions.find(region=>region.id===activeRegion);
  const shownArea: Area | null = (placeArea && visiblePlaces.some(p=>p.id===placeArea) ? walkAreas[placeArea] : null) || null;
  const sortedPlaces = useMemo(() => [...visiblePlaces].sort((a,b) => (a.regionId || '').localeCompare(b.regionId || '') || localize(a.name, language).localeCompare(localize(b.name, language), language === 'zh' ? 'zh-Hans' : 'en')), [visiblePlaces, language]);
  const [placesStatus, setPlacesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showRoute, setShowRoute] = useState(true);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (!container.current) return;
    const instance = new Map({ container: container.current, style: mapStyles.liberty.url, bounds: kyushuBounds, fitBoundsOptions: { padding: 45 }, attributionControl: false });
    map.current = instance;
    instance.addControl(new NavigationControl(), 'top-right');
    instance.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    instance.on('idle', () => setStatus('ready'));
    instance.on('error', () => setStatus('error'));
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    let enterTimer: ReturnType<typeof setTimeout> | undefined;
    const labels = tripRegions.map(region => {
      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'town-label trip-region-label region-button';
      label.setAttribute('aria-label', `${region.zh} / ${region.en} — ${language === 'zh' ? '显示地区' : 'Focus region'}`);
      label.setAttribute('aria-pressed', String(filters.focus === region.id));
      const chinese = document.createElement('strong'); chinese.textContent = region.zh;
      const english = document.createElement('span'); english.textContent = region.en;
      const count = document.createElement('small');
      count.className='region-count';
      count.textContent = `${visiblePlaces.filter(p=>p.regionId===region.id).length}/${places.filter(p=>p.regionId===region.id).length}`;
      count.title = language === 'zh' ? '可见地点 / 全部地点' : 'Visible / total places';
      label.append(chinese,english,count);
      label.addEventListener('pointerenter',event=>{ if(event.pointerType!=='mouse')return;holdRegionNote();enterTimer=setTimeout(()=>setHoverArea(region.id),150); });
      label.addEventListener('pointerleave',()=>{clearTimeout(enterTimer);leaveRegionNote();});
      label.addEventListener('focus',()=>{holdRegionNote();setHoverArea(region.id);});
      label.addEventListener('blur',leaveRegionNote);
      label.addEventListener('click',event=>{event.stopPropagation();setHoverArea(null);focusRegionAction.current(region.id);});
      const marker=new Marker({element:label,anchor:'center',offset:[0,0]}).setLngLat([region.coordinates[0],region.coordinates[1]]).addTo(instance);
      return {marker,region};
    });
    const updateLabelOffsets=()=>{
      const progress=Math.max(0,Math.min(1,(instance.getZoom()-9)/3));
      labels.forEach(({marker,region})=>marker.setOffset([region.offset[0]*progress,region.offset[1]*progress]));
    };
    updateLabelOffsets();instance.on('zoom',updateLabelOffsets);
    return ()=>{clearTimeout(enterTimer);holdRegionNote();instance.off('zoom',updateLabelOffsets);labels.forEach(({marker})=>marker.remove());};
  }, [places,visiblePlaces,language,filters.focus]);
  useEffect(() => {
    const instance=map.current;
    if(!instance || !shownArea)return;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('area-overlay');svg.setAttribute('aria-hidden','true');
    const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
    shape.setAttribute('class',shownArea.kind==='region'?'region-shape':'walk-shape');svg.append(shape);
    const street=document.createElementNS('http://www.w3.org/2000/svg','path');street.setAttribute('class','street-shape');svg.append(street);
    instance.getContainer().append(svg);
    const draw=()=>{
      const box=instance.getContainer();svg.setAttribute('viewBox',`0 0 ${box.clientWidth} ${box.clientHeight}`);
      const path=(coordinates:number[][])=>coordinates.map((point,i)=>{const p=instance.project([point[0],point[1]]);return `${i?'L':'M'}${p.x},${p.y}`;}).join(' ');
      shape.setAttribute('d',path(shownArea.ring)+' Z');
      street.setAttribute('d',shownArea.line?path(shownArea.line):'');
    };
    draw();instance.on('move',draw);instance.on('resize',draw);
    return ()=>{instance.off('move',draw);instance.off('resize',draw);svg.remove();};
  },[shownArea]);
  useEffect(()=>{
    if(!map.current || !filters.focus || !areas[filters.focus])return;
    const bounds=new LngLatBounds();areas[filters.focus].ring.forEach(point=>bounds.extend(point));
    map.current.fitBounds(bounds,{padding:65,maxZoom:14,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:800});
  },[filters.focus,areas]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('route-overlay');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = showRoute ? 'block' : 'none';
    const paths = overviewRoute.features.map(() => {
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      halo.setAttribute('class', 'route-halo');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('class', 'route-line');
      svg.append(halo, line);
      return [halo, line];
    });
    instance.getContainer().append(svg);
    function drawRoute() {
      if (!instance) return;
      const container = instance.getContainer();
      svg.setAttribute('viewBox', `0 0 ${container.clientWidth} ${container.clientHeight}`);
      overviewRoute.features.forEach((feature, index) => {
        const d = feature.geometry.coordinates.map((coordinate, i) => {
          const point = instance.project([coordinate[0], coordinate[1]]);
          return `${i ? 'L' : 'M'}${point.x},${point.y}`;
        }).join(' ');
        paths[index].forEach(path => path.setAttribute('d', d));
      });
    }
    drawRoute();
    instance.on('move', drawRoute);
    instance.on('resize', drawRoute);
    return () => { instance.off('move', drawRoute); instance.off('resize', drawRoute); svg.remove(); };
  }, [showRoute]);
  useEffect(() => {
    const controller = new AbortController();
    loadPlaces(controller.signal).then(items => { setPlaces(items); setPlacesStatus('ready'); })
      .catch(() => { if (!controller.signal.aborted) setPlacesStatus('error'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    let active: { popup: Popup; button: HTMLButtonElement; id: string } | null = null;
    let pinned = false;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const clearTimers = () => { clearTimeout(hoverTimer); clearTimeout(closeTimer); };
    const closeActive = () => { const previous = active; active = null; previous?.popup.remove(); previous?.button.classList.remove('is-selected'); setPlaceArea(null); };
    const scheduleClose = () => {
      clearTimeout(hoverTimer); clearTimeout(closeTimer);
      if (!pinned) closeTimer = setTimeout(() => { closeActive(); setSelectedId(null); }, 260);
    };
    pinActions.current.clear();
    setSelectedId(null);
    const entries: {marker:Marker;button:HTMLButtonElement;place:Place;open:(sticky:boolean)=>void;refresh:()=>void}[]=[];
    const legs=document.createElementNS('http://www.w3.org/2000/svg','svg');legs.classList.add('spider-legs');legs.setAttribute('aria-hidden','true');instance.getContainer().append(legs);
    let expanded=false;
    const collapse=()=>{ if(!expanded)return;expanded=false;entries.forEach(entry=>{entry.marker.setOffset([0,0]);entry.button.classList.remove('is-spread');});legs.replaceChildren();setSpreadCount(0);closeActive();pinned=false;setSelectedId(null); };
    collapsePins.current=collapse;
    const overlaps=(id:string)=>{
      const index=entries.findIndex(entry=>entry.place.id===id);
      return overlappingIndices(entries.map(entry=>{const p=instance.project(entry.marker.getLngLat()),offset=entry.marker.getOffset();return {x:p.x+offset.x,y:p.y+offset.y};}),index);
    };
    const spread=(id:string)=>{
      const group=overlaps(id);
      if(group.length<2)return;
      if(group.length>12){const bounds=new LngLatBounds();group.forEach(i=>bounds.extend(entries[i].marker.getLngLat()));instance.fitBounds(bounds,{padding:100,maxZoom:15});return;}
      closeActive();pinned=false;setSelectedId(null);expanded=true;
      const origin=instance.project(entries.find(entry=>entry.place.id===id)!.marker.getLngLat());
      const box=instance.getContainer();const radius=Math.max(72,group.length*13);
      const cx=Math.max(radius+30,Math.min(box.clientWidth-radius-30,origin.x));
      const cy=Math.max(radius+110,Math.min(box.clientHeight-radius-65,origin.y));
      legs.setAttribute('viewBox',`0 0 ${box.clientWidth} ${box.clientHeight}`);
      group.forEach((index,n)=>{
        const entry=entries[index],point=instance.project(entry.marker.getLngLat());
        const angle=n*2*Math.PI/group.length-Math.PI/2;
        const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
        entry.marker.setOffset([x-point.x,y-point.y]);entry.button.classList.add('is-spread');
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        for(const [key,value] of Object.entries({x1:point.x,y1:point.y,x2:x,y2:y}))line.setAttribute(key,String(value));
        legs.append(line);
      });setSpreadCount(group.length);
    };
    instance.on('movestart',collapse);instance.on('resize',collapse);
    const markers = visiblePlaces.map(place => {
      const name = localize(place.name, language);
      const button = document.createElement('button');
      button.className = `place-marker ${place.category}`;
      button.dataset.region = place.regionId || '';
      button.type = 'button';
      button.setAttribute('aria-label', name);
      button.title = name;
      // Fixed SVG artwork: only text fields in the popup come from place data.
      button.innerHTML = markerArt(place.category === 'accommodation' ? 'house' : poiTypes[place.poiType || 'natural_scenery'].icon);
      const content = document.createElement('div');
      content.className = 'place-popup';
      const category = document.createElement('span');
      category.className = 'place-category';
      category.textContent = place.category === 'accommodation' ? (language === 'zh' ? '住宿' : 'Accommodation') : poiTypes[place.poiType || 'natural_scenery'][language];
      const heading = document.createElement('h2');
      heading.textContent = name;
      content.append(category, heading);
      if (place.description) {
        const description = document.createElement('p');
        description.textContent = localize(place.description, language);
        content.append(description);
      }
      if (place.location?.precision === 'approximate') {
        const precision = document.createElement('p');
        precision.className = 'coordinates';
        precision.textContent = language === 'zh' ? '大致位置 · 非导航入口' : 'Approximate location · not a navigation entrance';
        content.append(precision);
      }
      if (place.preference === 'probably_skip' || place.preference === 'skip') {
        const preference = document.createElement('p');
        preference.textContent = language === 'zh' ? '此前偏好：可能跳过 / 不安排' : 'Earlier preference: probably skip / skip';
        content.append(preference);
      }
      const listing = place.links?.find(link => link.type === 'accommodation' && link.url?.startsWith('https://'));
      if (listing?.url) {
        const link = document.createElement('a');
        link.href = listing.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = language === 'zh' ? '查看住宿房源 ↗' : 'View accommodation listing ↗';
        content.append(link);
      }
      const coordinates = document.createElement('p');
      coordinates.className = 'coordinates';
      coordinates.textContent = `${place.coordinates.latitude.toFixed(6)}° N, ${place.coordinates.longitude.toFixed(6)}° E`;
      content.append(coordinates);
      if (place.source) {
        const link = document.createElement('a');
        link.href = place.source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = language === 'zh' ? '查看来源 ↗' : 'View source ↗';
        content.append(link);
      }
      const nearby=document.createElement('button');nearby.className='nearby-control';nearby.type='button';nearby.hidden=true;content.append(nearby);
      nearby.addEventListener('click',event=>{event.stopPropagation();spread(place.id);});
      const popup = new Popup({ offset: 42, maxWidth: '280px', closeButton: true, focusAfterOpen: false, closeOnClick: true })
        .setLngLat([place.coordinates.longitude, place.coordinates.latitude]).setDOMContent(content);
      const marker = new Marker({ element: button, anchor: 'bottom' })
        .setLngLat([place.coordinates.longitude, place.coordinates.latitude]).addTo(instance);
      const refresh=()=>{
        if(!popup.isOpen())return;
        const group=overlaps(place.id);nearby.hidden=group.length<2;
        nearby.textContent=language==='zh'?`${group.length>12?'放大查看':'展开附近地点'} · ${group.length}`:`${group.length>12?'Zoom into group':'Spread nearby places'} · ${group.length}`;
      };
      const open = (sticky: boolean) => {
        clearTimers();
        if (!sticky && pinned) return;
        if (active?.id !== place.id) closeActive();
        pinned = sticky;
        active = { popup, button, id: place.id };
        setPlaceArea(walkAreas[place.id]?place.id:null);
        const offset=marker.getOffset();popup.setLngLat(instance.unproject(instance.project(marker.getLngLat()).add(offset))); 
        if (!popup.isOpen()) popup.addTo(instance);
        refresh();
        if(sticky && walkAreas[place.id] && !expanded){
          const bounds=new LngLatBounds();walkAreas[place.id].ring.forEach(point=>bounds.extend(point));
          instance.fitBounds(bounds,{padding:{top:100,bottom:160,left:65,right:65},maxZoom:16,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:700});
        }
        button.classList.toggle('is-selected', sticky);
        if (sticky) setSelectedId(place.id);
      };
      content.addEventListener('focusin', () => clearTimeout(closeTimer));
      content.addEventListener('focusout', scheduleClose);
      popup.on('open', () => {
        const element = popup.getElement();
        element.onpointerenter = () => clearTimeout(closeTimer);
        element.onpointerleave = scheduleClose;

      });
      popup.on('close', () => {
        if (active?.id === place.id) { active = null; pinned = false; button.classList.remove('is-selected'); setSelectedId(null); setPlaceArea(null); }
      });
      button.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' || pinned) return;
        clearTimers();
        hoverTimer = setTimeout(() => open(false), 180);
      });
      button.addEventListener('pointerleave', scheduleClose);
      button.addEventListener('click', event => {
        event.stopPropagation();
        if (active?.id === place.id && pinned) { pinned = false; closeActive(); setSelectedId(null); }
        else open(true);
      });
      pinActions.current.set(place.id, () => {
        instance.flyTo({ center: [place.coordinates.longitude, place.coordinates.latitude], zoom: Math.max(12.5, instance.getZoom()), duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 });
        open(true);
      });
      entries.push({marker,button,place,open,refresh});
      return marker;
    });
    const refreshNearby=()=>entries.forEach(entry=>entry.refresh());
    instance.on('moveend',refreshNearby);
    return () => { instance.off('moveend',refreshNearby);instance.off('movestart',collapse);instance.off('resize',collapse);legs.remove();setSpreadCount(0);setPlaceArea(null);clearTimers(); pinned = false; closeActive(); markers.forEach(marker => marker.remove()); pinActions.current.clear(); };
  }, [visiblePlaces, language]);
  useEffect(() => {
    container.current?.querySelectorAll<HTMLElement>('.place-marker').forEach(button=>{
      button.classList.toggle('region-dimmed', Boolean(activeRegion && button.dataset.region!==activeRegion));
      button.classList.toggle('region-highlighted', Boolean(activeRegion && button.dataset.region===activeRegion));
    });
  }, [activeRegion, visiblePlaces, language]);
  function showPlaces() {
    if (!map.current || !visiblePlaces.length) return;
    const options = { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900 };
    if (visiblePlaces.length === 1) {
      const { longitude, latitude } = visiblePlaces[0].coordinates;
      map.current.flyTo({ center: [longitude, latitude], zoom: 11, ...options });
    } else {
      const bounds = new LngLatBounds();
      visiblePlaces.forEach(p => bounds.extend([p.coordinates.longitude, p.coordinates.latitude]));
      map.current.fitBounds(bounds, { padding: { top: 100, bottom: 85, left: 75, right: 85 }, maxZoom: 13, ...options });
    }
  }
  focusRegionAction.current=(id:string)=>setFilters(previous=>({...previous,q:'',regions:regionOptions.map(region=>region.id),focus:previous.focus===id?null:id}));
  function toggleFilter(group: 'regions' | 'types', id: string) {
    setFilters(previous => ({ ...previous, focus: group === 'regions' ? null : previous.focus, [group]: previous[group].includes(id) ? previous[group].filter(value => value !== id) : [...previous[group], id] }));
  }
  function resizeSidebar(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  return <div className={`app filter-app ${sidebarOpen ? '' : 'sidebar-collapsed'}`} style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
    <aside id="trip-sidebar" className="sidebar filter-sidebar" hidden={!sidebarOpen}>
      <div className="sidebar-heading"><a className="brand" href="#"><span className="brand-icon">九</span>{t.brand}</a><button className="close-sidebar" onClick={() => setSidebarOpen(false)} aria-label={w('收起侧栏', 'Collapse sidebar')}>‹</button></div>
      <div className="language-switch" role="group" aria-label={t.language}><button aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button><button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button></div>
      <div className="filter-title"><div><p className="eyebrow">{w('九州 · 旅行地图','KYUSHU · TRIP MAP')}</p><h1>{w('探索这段旅程','Explore the journey')}</h1></div><span className="result-count" role="status">{visiblePlaces.length} / {places.length}</span></div>
      <fieldset className="filter-group"><legend>{w('地区','Regions')}</legend><button className="all-filter" onClick={() => setFilters(f => ({ ...f, regions: regionOptions.map(r => r.id) }))}>{w('全部地区','All regions')}</button><div className="filter-chips">{regionOptions.map(region => <button key={region.id} aria-pressed={filters.regions.includes(region.id)} onClick={() => toggleFilter('regions',region.id)}>{region[language]}</button>)}</div></fieldset>
      <fieldset className="filter-group"><legend>{w('类别','Categories')}</legend><button className="all-filter" onClick={() => setFilters(f => ({ ...f, types: typeOptions.map(t => t.id) }))}>{w('全部类别','All categories')}</button><div className="type-filters">{typeOptions.map(type => <button key={type.id} aria-pressed={filters.types.includes(type.id)} onClick={() => toggleFilter('types',type.id)}><span className={`filter-icon ${type.id === 'accommodation' ? 'stay-key' : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerArt(type.icon) }}/><span>{type[language]}</span><span className="check-mark" aria-hidden="true">{filters.types.includes(type.id) ? '✓' : '+'}</span></button>)}</div></fieldset>
      <div className="filter-actions"><button onClick={showPlaces} disabled={!visiblePlaces.length}>{w('缩放至筛选结果','Fit results')}</button><button onClick={() => setFilters(allFilters())}>{w('重置筛选','Reset filters')}</button></div>
      {placesStatus === 'error' && <p role="alert">{w('地点加载失败，请刷新重试。','Places could not load. Please reload.')}</p>}
      {placesStatus === 'loading' && <p role="status">{w('正在加载地点…','Loading places…')}</p>}
      {placesStatus === 'ready' && !visiblePlaces.length && <p className="empty-results" role="status">{w('没有匹配的地点，请调整筛选或搜索。','No matching places. Adjust filters or search.')}</p>}
      <details className="results-list"><summary>{w('地点列表','Places')} <span>{visiblePlaces.length}</span></summary><p className="list-hint">{w('按地区、名称排序 · 点击定位','Sorted by region and name · select to locate')}</p><ul>{sortedPlaces.map(place => <li key={place.id}><button aria-pressed={selectedId === place.id} onClick={() => pinActions.current.get(place.id)?.()}><span className={`filter-icon ${place.category === 'accommodation' ? 'stay-key' : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerArt(place.category === 'accommodation' ? 'house' : poiTypes[place.poiType || 'natural_scenery'].icon) }}/><span><strong>{localize(place.name,language)}</strong><small>{regionOptions.find(r => r.id === place.regionId)?.[language]}</small></span><span aria-hidden="true">↗</span></button></li>)}</ul></details>
      <p className="sidebar-hint">{w('悬停预览 · 点击固定详情','Hover to preview · click to keep details open')}</p>
    </aside>
    {sidebarOpen && <div className="sidebar-resizer" role="separator" aria-label={w('调整侧栏宽度','Resize sidebar')} aria-orientation="vertical" aria-valuemin={280} aria-valuemax={520} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={resizeSidebar} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setSidebarWidth(Math.max(280, Math.min(520, event.clientX))); }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setSidebarWidth(width => Math.max(280, Math.min(520, width + (event.key === 'ArrowRight' ? 20 : -20)))); } }}/>} 
    <main className="map-area" aria-label={t.map}><div ref={container} className="map"/><button className="sidebar-toggle" aria-controls="trip-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(open => !open)}>{sidebarOpen ? '‹' : '☰'} <span>{w('筛选','Filters')}</span></button><div className="map-search"><label className="sr-only" htmlFor="place-search">{w('搜索地点','Search places')}</label><span aria-hidden="true">⌕</span><input id="place-search" type="search" value={filters.q} placeholder={w('搜索地点 · 中文 / English / 日本語','Search places · 中文 / English / 日本語')} onKeyDown={event=>{if(event.key==='Enter' && regionMatches.length){event.preventDefault();focusRegionAction.current(regionMatches[0].id);}}} onChange={event => setFilters(f => ({ ...f, focus:null, q: event.target.value }))}/>{filters.q && <button onClick={() => setFilters(f => ({ ...f, q: '' }))} aria-label={w('清除搜索','Clear search')}>×</button>}{regionMatches.length>0 && <div className="region-search-results" aria-label={w('地区搜索结果','Region search results')}>{regionMatches.map(region=><button key={region.id} onClick={()=>focusRegionAction.current(region.id)}><strong>{language==='zh'?region.zh:region.en}</strong><span>{w('地区 · 高亮地点','Region · highlight places')}</span></button>)}</div>}</div>{!shownArea && highlightedRegion && <section className="area-caption" aria-label={w('地区高亮','Region highlight')} onPointerEnter={holdRegionNote} onPointerLeave={leaveRegionNote} onFocusCapture={holdRegionNote} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))leaveRegionNote();}}><strong>{language==='zh'?highlightedRegion.zh:highlightedRegion.en}</strong><span>{w('高亮本地区地点 · 淡化其他地点','Region places highlighted · other places dimmed')}</span><div className="region-notes">{(regionNotes[highlightedRegion.id] || []).length ? <><h3>{w('地区笔记','Regional notes')}</h3>{regionNotes[highlightedRegion.id].map((note,index)=><p key={index}>{note[language]}</p>)}</> : <p>{w('地区笔记待补充。','Regional notes to come.')}</p>}</div>{filters.focus && <button onClick={()=>{setFilters(f=>({...f,focus:null}));setHoverArea(null);}}>{w('取消高亮','Clear highlight')}</button>}</section>}{shownArea && <section className="area-caption" aria-label={w('高亮区域','Highlighted area')}><strong>{language==='zh'?shownArea.zh:shownArea.en}</strong><span>{shownArea.kind==='region'?w('近似规划范围 · 含已保存地点','Approximate planning area · includes saved places'):w('近似游逛范围 · 非步行路线','Approximate exploration area · not a walking route')}</span><a href={shownArea.source} target="_blank" rel="noopener noreferrer">{w('参考地图 ↗','Map reference ↗')}</a>{filters.focus && <button onClick={()=>{setFilters(f=>({...f,focus:null}));setHoverArea(null);}}>{w('取消高亮','Clear highlight')}</button>}</section>}{spreadCount>0 && <button className="collapse-spread" onClick={()=>collapsePins.current()}>{w(`收起展开地点 (${spreadCount})`,`Collapse spread pins (${spreadCount})`)}</button>}<section className="places-tools" aria-label={language === 'zh' ? '地图地点' : 'Map places'}><details className="legend-details"><summary>{language === 'zh' ? '地点图例 · 5 类' : 'Legend · 5 types'}</summary><div className="place-legend">{Object.entries(poiTypes).map(([id, info]) => <span key={id}><i className="legend-pin" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerArt(info.icon) }}/>{info[language]}</span>)}<span><i className="legend-pin stay-key" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markerArt('house') }}/>{language === 'zh' ? '住宿' : 'Stay'}</span></div></details><label className="route-toggle"><input type="checkbox" checked={showRoute} onChange={event => setShowRoute(event.target.checked)}/><span>{language === 'zh' ? '驾车路线' : 'Driving routes'}</span></label><p className="route-note">{language === 'zh' ? '预计算路线 · 不含实时路况' : 'Precomputed routes · no live traffic'}</p><button onClick={showPlaces} disabled={!visiblePlaces.length}>{language === 'zh' ? `显示筛选地点 (${visiblePlaces.length})` : `Show filtered places (${visiblePlaces.length})`}</button>{placesStatus !== 'ready' && <p role="status">{placesStatus === 'error' ? (language === 'zh' ? '地点加载失败，请刷新重试。' : 'Places could not load. Please reload.') : (language === 'zh' ? '正在加载地点…' : 'Loading places…')}</p>}</section><div className="map-status" role="status">{status === 'loading' ? t.loading : status === 'error' ? t.error : t.ready}</div></main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
