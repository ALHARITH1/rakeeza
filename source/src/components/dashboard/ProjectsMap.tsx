import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { ProjectHealthRow, healthColors, healthLabels, HealthLevel } from './healthMetrics';

const safeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

interface Props {
  rows: ProjectHealthRow[];
}

/**
 * Interactive map of current project sites.
 * Each site is a coloured dot reflecting its workflow health; clicking a dot
 * selects that project across the whole platform.
 */
export const ProjectsMap: React.FC<Props> = ({ rows }) => {
  const { selectedProjectId, setSelectedProjectId, highContrast } = usePlatform();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
    }).setView([23.9, 44.5], 5);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    // Leaflet needs a size recalculation once the flex layout settles
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Base tiles (swap for high-contrast mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileRef.current?.remove();
    const url = highContrast
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    tileRef.current = L.tileLayer(url, {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
  }, [highContrast]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    rows.forEach((r) => {
      const p = r.project;
      const color = healthColors[r.level];
      const isSelected = p.id === selectedProjectId;
      bounds.push([p.lat, p.lng]);

      // Pulsing halo for selected / critical sites
      if (isSelected || r.level === 'delayed') {
        L.marker([p.lat, p.lng], {
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<span class="infra-pulse" style="--c:${color}"></span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }).addTo(layer);
      }

      const dot = L.circleMarker([p.lat, p.lng], {
        radius: isSelected ? 11 : 8,
        color: isSelected ? '#ffffff' : '#0f172a',
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: 0.95
      }).addTo(layer);

      dot.bindTooltip(safeHtml(p.location.split(' - ')[0]), { direction: 'top', offset: [0, -8] });
      dot.bindPopup(
        `<div dir="rtl" style="font-family:Cairo,sans-serif;min-width:220px">
          <div style="font-weight:800;font-size:12px;margin-bottom:4px">${safeHtml(p.name)}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${safeHtml(p.location)}</div>
          <div style="display:flex;gap:6px;align-items:center;font-size:11px;margin-bottom:4px">
            <span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block"></span>
            <b>${healthLabels[r.level]}</b>
          </div>
          <div style="font-size:11px">الإنجاز: <b>${p.physicalProgress}%</b> (المخطط ${p.plannedProgress}%)</div>
          <div style="font-size:11px">SPI <b>${r.spi.toFixed(2)}</b> · CPI <b>${r.cpi.toFixed(2)}</b></div>
          <div style="font-size:11px">تنبيهات مفتوحة: <b>${r.alerts.length}</b></div>
        </div>`
      );
      dot.on('click', () => setSelectedProjectId(p.id as any));
    });

    if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 8 });
  }, [rows, selectedProjectId, setSelectedProjectId]);

  const legend: HealthLevel[] = ['on_track', 'near_completion', 'at_risk', 'delayed'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col">
      <style>{`
        .infra-pulse{position:absolute;inset:0;border-radius:50%;background:var(--c);opacity:.35;animation:infraPulse 1.8s ease-out infinite}
        @keyframes infraPulse{0%{transform:scale(.4);opacity:.6}100%{transform:scale(1.4);opacity:0}}
        .leaflet-container{background:#0b1220;font-family:Cairo,sans-serif}
      `}</style>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>خريطة مواقع المشاريع وحالة سير العمل</span>
        </h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
          {legend.map((l) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-900" style={{ background: healthColors[l] }} />
              {healthLabels[l]}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-80 rounded-lg overflow-hidden border border-slate-800 relative z-0" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
        {rows.map((r) => (
          <button
            key={r.project.id}
            onClick={() => setSelectedProjectId(r.project.id as any)}
            className={`text-right p-2 rounded-lg border text-[11px] transition flex items-center gap-2 ${
              r.project.id === selectedProjectId ? 'border-amber-500/60 bg-amber-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: healthColors[r.level] }} />
            <span className="min-w-0">
              <span className="block font-bold text-slate-200 truncate">{r.project.location.split(' - ')[0]}</span>
              <span className="block text-slate-400">{healthLabels[r.level]} · {r.project.physicalProgress}%</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
