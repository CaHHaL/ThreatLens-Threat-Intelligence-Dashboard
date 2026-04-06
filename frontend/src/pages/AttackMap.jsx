import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useWebSocket } from '../hooks/useWebSocket';
import {
    Crosshair, Shield, Activity, Globe, Zap,
    MapPin, AlertTriangle, Database, Info, Layers
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const TARGET_LAT = 28.6139; // New Delhi Simulation Target
const TARGET_LON = 77.2090;

const geoJsonUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// Improved Arc Animator with fading effects and better styling
function ArcAnimator({ target, source, color, map }) {
    useEffect(() => {
        if (!map || !source || !target) return;

        const latlngs = [
            [source.lat, source.lon],
            [target.lat, target.lon]
        ];

        // Draw the curved arc
        const line = L.polyline(latlngs, {
            color: color,
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10',
            className: 'attack-arc-anim'
        }).addTo(map);

        // Source marker with glow
        const startMarker = L.circleMarker([source.lat, source.lon], {
            radius: 5,
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            className: 'source-ping-glow'
        }).addTo(map);

        const timer = setTimeout(() => {
            if (map.hasLayer(line)) map.removeLayer(line);
            if (map.hasLayer(startMarker)) map.removeLayer(startMarker);
        }, 4000);

        return () => {
            clearTimeout(timer);
            if (map.hasLayer(line)) map.removeLayer(line);
            if (map.hasLayer(startMarker)) map.removeLayer(startMarker);
        };
    }, [map, source, target, color]);
    return null;
}

export default function AttackMap() {
    const { events, connectionStatus } = useWebSocket();
    const [geoData, setGeoData] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [activeArcs, setActiveArcs] = useState([]);

    // Compute stats from session events
    const stats = useMemo(() => {
        return events.reduce((acc, ev) => {
            if (ev.type === 'new_ioc' && ev.data?.geo?.country_code) {
                acc.total++;
                const cCode = ev.data.geo.country_code;
                acc.countries[cCode] = (acc.countries[cCode] || 0) + 1;
                if (ev.data.geo.attack_type) {
                    const aType = ev.data.geo.attack_type;
                    acc.types[aType] = (acc.types[aType] || 0) + 1;
                }
            }
            return acc;
        }, { total: 0, countries: {}, types: {} });
    }, [events]);

    // Handle incoming events for arc animation
    useEffect(() => {
        const ev = events[0];
        if (ev && ev.type === 'new_ioc' && ev.data?.geo?.lat) {
            let color = '#38bdf8'; // Default Sky Blue
            const t = ev.data.geo.attack_type;
            if (t === 'HTTP exploit') color = '#ef4444'; // Red
            if (t === 'malware C2') color = '#a855f7';   // Purple
            if (t === 'scanner') color = '#eab308';      // Amber
            if (t === 'brute force') color = '#f97316';  // Orange

            const newArc = {
                id: Date.now() + Math.random(),
                source: { lat: ev.data.geo.lat, lon: ev.data.geo.lon },
                color: color
            };

            setActiveArcs(prev => [newArc, ...prev].slice(0, 30));
        }
    }, [events]);

    // Load country boundaries
    useEffect(() => {
        fetch(geoJsonUrl).then(res => res.json()).then(data => setGeoData(data));

        // Add custom CSS for animations
        const style = document.createElement('style');
        style.innerHTML = `
            .attack-arc-anim {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: drawArc 1.5s ease-out forwards;
                filter: drop-shadow(0 0 5px currentColor);
            }
            @keyframes drawArc {
                to { stroke-dashoffset: 0; }
            }
            .source-ping-glow {
                animation: sourcePulse 2s ease-out infinite;
                filter: blur(2px);
            }
            @keyframes sourcePulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(3); opacity: 0; }
            }
            .target-ping {
                animation: targetScan 2s infinite;
            }
            @keyframes targetScan {
               0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
               70% { box-shadow: 0 0 0 20px rgba(14, 165, 233, 0); }
               100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
            }
            .leaflet-container { background: #030712 !important; }
            .leaflet-grab { cursor: crosshair !important; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const topCountryEntry = Object.entries(stats.countries).sort((a, b) => b[1] - a[1])[0];
    const topTypeEntry = Object.entries(stats.types).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="relative w-full h-full flex overflow-hidden group/page bg-[#030712]">

            {/* --- Overlay UI HUD Panels --- */}

            {/* Top-Left: Radar & Live Stats */}
            <div className="absolute top-6 left-6 z-[400] w-80 animate-fade-in pointer-events-none">
                <div className="glass-card @container p-6 bg-slate-950/80 backdrop-blur-3xl border-white/5 pointer-events-auto relative overflow-hidden group">
                    {/* Corner decorative elements */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sky-400 opacity-40" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sky-400 opacity-40" />

                    <header className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 shadow-lg shadow-sky-500/5">
                                <Crosshair size={18} className="animate-rotate-slow" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase mt-0.5 leading-none">Interceptor</h2>
                                <p className="text-[10px] font-mono text-slate-500 font-bold uppercase mt-1">Live_Radar_Scan</p>
                            </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Live' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                    </header>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-1">Session_Detections</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-mono font-black text-white leading-none tracking-tighter">{stats.total}</p>
                                <span className="text-xs font-black text-sky-500 animate-pulse font-mono tracking-widest">LIVE_SYNC</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 flex flex-col group/item transition-all hover:bg-white/4">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Globe size={10} /> Active_Source_Origin</p>
                                <p className="text-sm font-black text-sky-400 font-mono tracking-[0.1em]">{topCountryEntry ? `${topCountryEntry[0].toUpperCase()} -> DE_M01` : 'SCANNING_GEO...'}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 flex flex-col group/item transition-all hover:bg-white/4">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Shield size={10} /> Primary_Vector</p>
                                <p className="text-sm font-black text-rose-500 uppercase tracking-tight">{topTypeEntry ? topTypeEntry[0] : 'CLASSIFYING...'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Vector Legend */}
                    <div className="mt-8 grid grid-cols-2 gap-y-3 gap-x-2 border-t border-white/5 pt-5 opacity-80">
                        <div className="flex items-center gap-2.5 text-[9px] text-slate-500 font-black uppercase tracking-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> EXPLOIT
                        </div>
                        <div className="flex items-center gap-2.5 text-[9px] text-slate-500 font-black uppercase tracking-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> MALWARE_C2
                        </div>
                        <div className="flex items-center gap-2.5 text-[9px] text-slate-500 font-black uppercase tracking-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" /> BRUTE_FORCE
                        </div>
                        <div className="flex items-center gap-2.5 text-[9px] text-slate-500 font-black uppercase tracking-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" /> SCANNER
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom-Right: Target Information HUD */}
            <div className="absolute bottom-6 right-6 z-[400] w-72 pointer-events-none">
                <div className="glass-card p-5 bg-[#030712]/60 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.5)] pointer-events-auto">
                    <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-4">
                        <MapPin size={16} className="text-sky-500" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">Defense_Endpoint_Target</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">Identified_Host</span>
                            <span className="text-sky-400 font-mono tracking-widest">PROX-EDGE-01</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">Region_Scope</span>
                            <span className="text-white font-mono tracking-widest uppercase">Asia/Calcutta</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">Coordinates</span>
                            <span className="text-white font-mono tracking-widest">28.61N 77.21E</span>
                        </div>

                        <div className="pt-2">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)] animate-shimmer" style={{ width: '100%' }} />
                            </div>
                            <p className="text-[8px] text-center mt-2 font-black text-sky-900 uppercase tracking-[0.5em]">System_Hardening_Mode_Enabled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Navigation Controls (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center h-10 px-6 gap-6 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto select-none">
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                    <Layers size={14} /> Layers
                </button>
                <div className="w-px h-3 bg-white/10" />
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                    <Zap size={14} /> Realtime
                </button>
                <div className="w-px h-3 bg-white/10" />
                <button className="flex items-center gap-2 text-[10px] font-black text-sky-500 uppercase tracking-widest">
                    <Activity size={14} /> Analytics_v4.2
                </button>
            </div>

            {/* --- The Map Layer --- */}
            <div className="flex-1 isolation-isolate relative z-0 animate-fade-in" style={{ animationDuration: '1.5s' }}>
                <MapContainer
                    center={[20, 10]}
                    zoom={3}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    ref={setMapInstance}
                    dragging={true}
                    doubleClickZoom={false}
                    scrollWheelZoom={true}
                >
                    {/* Dark Theme Map Tiles */}
                    <TileLayer
                        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap &copy; CartoDB"
                    />

                    {/* Country Outlines for subtle depth */}
                    {geoData && (
                        <GeoJSON
                            data={geoData}
                            style={() => ({
                                color: '#1e293b',
                                weight: 1,
                                fillColor: '#0d1117',
                                fillOpacity: 0.2
                            })}
                        />
                    )}

                    {/* Target Endpoint Marker */}
                    <Marker position={[TARGET_LAT, TARGET_LON]} icon={L.divIcon({
                        className: 'target-endpoint-icon',
                        html: `
                          <div class="relative w-12 h-12 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                            <div class="absolute inset-0 bg-sky-500/20 rounded-full animate-ping" style="animation-duration: 3s;"></div>
                            <div class="absolute inset-2 bg-sky-500/30 rounded-full animate-pulse" style="animation-duration: 2s;"></div>
                            <div class="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] relative z-10"></div>
                            <div class="absolute -inset-1 border border-white/20 rounded-full target-ping"></div>
                          </div>
                        `,
                        iconSize: [0, 0],
                        iconAnchor: [0, 0]
                    })} />

                    {/* Dynamic Attack Arcs */}
                    {mapInstance && activeArcs.map(arc => (
                        <ArcAnimator
                            key={arc.id}
                            map={mapInstance}
                            source={arc.source}
                            target={{ lat: TARGET_LAT, lon: TARGET_LON }}
                            color={arc.color}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Visual Overlays / Scanlines */}
            <div className="fixed inset-0 pointer-events-none z-[1] opacity-5 bg-gradient-to-b from-transparent via-sky-500/20 to-transparent"
                style={{ height: '2px', top: '10%', animation: 'scanLine 8s linear infinite' }} />

            <style>{`
              @keyframes scanLine {
                from { top: -5%; }
                to { top: 105%; }
              }
            `}</style>
        </div>
    );
}
