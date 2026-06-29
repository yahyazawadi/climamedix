import { useState, useEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';

const ARAB_CITIES = [
  { id: 'cairo', name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { id: 'riyadh', name: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { id: 'baghdad', name: 'بغداد', lat: 33.3152, lng: 44.3661 },
  { id: 'amman', name: 'عمان', lat: 31.9522, lng: 35.9331 },
  { id: 'beirut', name: 'بيروت', lat: 33.8938, lng: 35.5018 },
  { id: 'damascus', name: 'دمشق', lat: 33.5138, lng: 36.2765 },
  { id: 'jerusalem', name: 'القدس', lat: 31.7683, lng: 35.2137 },
  { id: 'tunis', name: 'تونس', lat: 36.8065, lng: 10.1815 },
  { id: 'algiers', name: 'الجزائر', lat: 36.7538, lng: 3.0588 },
  { id: 'rabat', name: 'الرباط', lat: 34.0209, lng: -6.8416 },
  { id: 'sanaa', name: 'صنعاء', lat: 15.3694, lng: 44.1910 },
  { id: 'muscat', name: 'مسقط', lat: 23.5859, lng: 58.4059 },
  { id: 'doha', name: 'الدوحة', lat: 25.2854, lng: 51.5310 },
  { id: 'manama', name: 'المنامة', lat: 26.2235, lng: 50.5876 },
  { id: 'kuwait', name: 'الكويت', lat: 29.3759, lng: 47.9774 },
  { id: 'tripoli', name: 'طرابلس', lat: 32.8872, lng: 13.1913 },
  { id: 'khartoum', name: 'الخرطوم', lat: 15.5007, lng: 32.5599 }
];

// Distance function to calculate if cities are close
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function ArabWorldMap({ lang = 'ar' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  useEffect(() => {
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
        const checkM = setInterval(() => {
          if (window.mapboxgl) {
            setMapboxLoaded(true);
            clearInterval(checkM);
          }
        }, 100);
        // Store interval to clear on unmount
        mapInstanceRef.current = { _checkInterval: checkM };
      }
    }

    return () => {
      if (mapInstanceRef.current?._checkInterval) {
        clearInterval(mapInstanceRef.current._checkInterval);
      }
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
      center: [28.0, 26.0], // Center on Arab world
      zoom: 3.2,
      projection: 'mercator',
      interactive: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      // Create GeoJSON lines between close cities
      const features = [];
      const MAX_DISTANCE = 1500; // km

      for (let i = 0; i < ARAB_CITIES.length; i++) {
        for (let j = i + 1; j < ARAB_CITIES.length; j++) {
          const cityA = ARAB_CITIES[i];
          const cityB = ARAB_CITIES[j];
          const dist = getDistance(cityA.lat, cityA.lng, cityB.lat, cityB.lng);
          
          if (dist < MAX_DISTANCE) {
            features.push({
              'type': 'Feature',
              'geometry': {
                'type': 'LineString',
                'coordinates': [
                  [cityA.lng, cityA.lat],
                  [cityB.lng, cityB.lat]
                ]
              }
            });
          }
        }
      }

      map.addSource('network-lines', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': features
        }
      });

      map.addLayer({
        'id': 'network-lines-layer',
        'type': 'line',
        'source': 'network-lines',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#4dff82',
          'line-width': 1.5,
          'line-opacity': 0.4,
          'line-dasharray': [2, 2]
        }
      });

      // Animate line dasharray to make them look like traveling data
      let step = 0;
      const animateDashArray = () => {
        if (!mapInstanceRef.current) return;
        step = (step + 1) % 4; // Length of dash array
        try {
          map.setPaintProperty('network-lines-layer', 'line-dasharray', [step, 4 - step]);
        } catch (e) {}
        requestAnimationFrame(animateDashArray);
      };
      animateDashArray();

      // Add markers
      ARAB_CITIES.forEach(city => {
        const el = document.createElement('div');
        el.className = 'arab-city-marker';
        el.style.width = '12px';
        el.style.height = '12px';
        
        el.style.backgroundColor = '#EEF6FC';
        el.style.border = '2px solid #2FAD78';
        el.style.boxShadow = '0 0 12px rgba(77, 255, 130, 0.8)';
        el.style.borderRadius = '50%';
        
        // Add a pulsing ring
        const ring = document.createElement('div');
        ring.style.width = '100%';
        ring.style.height = '100%';
        ring.style.borderRadius = '50%';
        ring.style.opacity = '0.6';
        ring.style.animation = 'mapRingPulse 2s infinite';
        ring.style.backgroundColor = '#4dff82';
        
        el.appendChild(ring);

        new window.mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .addTo(map);
      });
      
      // Theme modifications
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
                const textField = layer.layout['text-field'];
                if (Array.isArray(textField)) {
                  // Advanced string manipulation for Mapbox text format
                } else if (typeof textField === 'string') {
                   // simple string mapping
                }
                
                // Using Mapbox GL expression for find/replace
                map.setLayoutProperty(layer.id, 'text-field', [
                  'case',
                  ['==', ['get', 'name_en'], 'Israel'],
                  'Palestine',
                  ['==', ['get', 'name'], 'Israel'],
                  'Palestine',
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
    });
  }, [mapboxLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(11, 40, 73, 0.08)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mapRingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
      `}} />
    </div>
  );
}
