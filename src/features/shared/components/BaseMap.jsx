import { useState, useEffect, useRef } from 'preact/hooks';

export function BaseMap({ 
  onMapLoad, 
  center = [35.0, 31.0], 
  zoom = 4, 
  interactive = true,
  style = { width: '100%', height: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(11, 40, 73, 0.08)' },
  children 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  useEffect(() => {
    let scriptInterval;
    let link = document.querySelector('link[href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    if (window.mapboxgl) {
      setMapboxLoaded(true);
    } else {
      let script = document.querySelector('script[src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
        script.onload = () => setMapboxLoaded(true);
        document.head.appendChild(script);
      } else {
        scriptInterval = setInterval(() => {
          if (window.mapboxgl) {
            setMapboxLoaded(true);
            clearInterval(scriptInterval);
          }
        }, 100);
      }
    }

    return () => {
      if (scriptInterval) clearInterval(scriptInterval);
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapboxLoaded || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      projection: 'mercator',
      interactive,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    map.on('style.load', () => {
      const mapTheme = {
        water_layer: "#014C6D",
        land_layer: "#2FAD78",
        text_labels: "#EEF6FC",
        text_halo_shadows: "#08294A",
        borders_and_roads: "#014C6D",
        critical_markers: "#4dff82",
        safe_markers: "#EEF6FC"
      };

      const mapStyle = map.getStyle();
      if (mapStyle && mapStyle.layers) {
        mapStyle.layers.forEach(layer => {
          if (layer.id.includes('water')) {
            if (layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', mapTheme.water_layer);
              map.setPaintProperty(layer.id, 'fill-opacity', 1);
            } else if (layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', mapTheme.water_layer);
            }
          } else {
            if (layer.type === 'background') {
              map.setPaintProperty(layer.id, 'background-color', mapTheme.land_layer);
              map.setPaintProperty(layer.id, 'background-opacity', 1);
            } else if (layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', mapTheme.land_layer);
              map.setPaintProperty(layer.id, 'fill-opacity', 1);
            } else if (layer.type === 'hillshade' || layer.type === 'raster') {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            } else if (layer.type === 'symbol') {
              if (layer.paint && layer.paint['text-color']) {
                map.setPaintProperty(layer.id, 'text-color', mapTheme.text_labels);
              }
              if (layer.paint && layer.paint['text-halo-color']) {
                map.setPaintProperty(layer.id, 'text-halo-color', mapTheme.text_halo_shadows);
                map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
              }
              if (layer.layout && layer.layout['text-field']) {
                map.setLayoutProperty(layer.id, 'text-field', [
                  'case',
                  ['==', ['get', 'name_en'], 'Israel'], 'Palestine',
                  ['==', ['get', 'name'], 'Israel'], 'Palestine',
                  ['get', 'name_en']
                ]);
              }
            } else if (layer.type === 'line' && (layer.id.includes('road') || layer.id.includes('boundary') || layer.id.includes('admin'))) {
              map.setPaintProperty(layer.id, 'line-color', mapTheme.borders_and_roads);
              map.setPaintProperty(layer.id, 'line-width', 1.5);
            }
          }
        });
      }

      // Add a scale control to the map so users can verify distances accurately
      map.addControl(new window.mapboxgl.ScaleControl({ maxWidth: 150, unit: 'metric' }), 'bottom-right');

      if (onMapLoad) {
        onMapLoad(map);
      }
    });

    // In BaseMap, we just provide the loaded map reference
  }, [mapboxLoaded, center, zoom, interactive, onMapLoad]);

  return (
    <div style={{ position: 'relative', ...style }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mapRingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-popup-content { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
      `}} />
      {children}
    </div>
  );
}
