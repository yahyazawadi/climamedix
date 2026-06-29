import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../shared/components/Button';
import { BaseMap } from '../../shared/components/BaseMap';

export function NewsMap({ lang = 'ar' }) {
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [nodes, setNodes] = useState([]);
  
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission('edit:news_map');

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [newCoords, setNewCoords] = useState(null);
  const [formData, setFormData] = useState({
    radius_km: 50,
    icon_type: 'danger',
    description_ar: '',
    description_en: '',
    link: ''
  });

  const fetchNodes = async () => {
    const { data, error } = await supabase.from('news_map_nodes').select('*');
    if (error) {
      console.error('Error fetching nodes:', error);
    }
    if (data) {
      // Ensure numeric fields are actually numbers, since Postgres numeric can return as string
      const parsedData = data.map(n => ({
        ...n,
        latitude: Number(n.latitude),
        longitude: Number(n.longitude),
        radius_km: Number(n.radius_km)
      }));
      console.log('Fetched nodes from DB:', parsedData);
      setNodes(parsedData);
    } else {
      console.log('No data returned from DB.');
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleMapLoad = useCallback((map) => {
    mapInstanceRef.current = map;
    setMapboxLoaded(true);
  }, []);

  useEffect(() => {
    if (!mapboxLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Set cursor based on mode
    if (isAddingMode) {
      const cursorSvg = encodeURIComponent(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`);
      map.getCanvas().style.cursor = `url('data:image/svg+xml;utf8,${cursorSvg}') 12 24, crosshair`;
    } else {
      map.getCanvas().style.cursor = '';
    }

    // Handle clicks for adding nodes
    const clickHandler = (e) => {
      if (isAddingMode) {
        setNewCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        setShowForm(true);
        setIsAddingMode(false);
      }
    };

    map.on('click', clickHandler);
    
    // Cleanup event listener to avoid duplicates
    return () => {
      map.off('click', clickHandler);
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = '';
      }
    };

  }, [mapboxLoaded, isAddingMode]);

  // Update markers and circles when nodes change
  useEffect(() => {
    if (!mapboxLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const displayNodes = newCoords ? [...nodes, {
      id: 'draft',
      latitude: newCoords.lat,
      longitude: newCoords.lng,
      radius_km: Number(formData.radius_km) || 0,
      icon_type: formData.icon_type,
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      link: formData.link
    }] : nodes;

    // Make sure we have the source before updating data
    const updateSource = () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: displayNodes.map(node => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [node.longitude, node.latitude] },
          properties: { ...node }
        }))
      };

      if (map.getSource('news-nodes')) {
        map.getSource('news-nodes').setData(geojsonData);
      } else {
        map.addSource('news-nodes', { type: 'geojson', data: geojsonData });
        
        // Add circle layer for radius
        map.addLayer({
          id: 'news-nodes-radius',
          type: 'circle',
          source: 'news-nodes',
          paint: {
            // Rough approximation: scale radius visually
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              2, ['/', ['get', 'radius_km'], 10],
              6, ['*', ['get', 'radius_km'], 1],
              10, ['*', ['get', 'radius_km'], 5]
            ],
            'circle-color': [
              'match', ['get', 'icon_type'],
              'danger', '#ff4d4d',
              'warning', '#ffcc00',
              '#EEF6FC' // default / info
            ],
            'circle-opacity': 0.3,
            'circle-stroke-width': 1,
            'circle-stroke-color': [
              'match', ['get', 'icon_type'],
              'danger', '#ff4d4d',
              'warning', '#ffcc00',
              '#EEF6FC'
            ]
          }
        });
      }

      // Add HTML markers for icons and popups
      displayNodes.forEach(node => {
        let markerColor = '#EEF6FC';
        let pulseColor = 'rgba(238, 246, 252, 0.4)';
        let borderColor = '#2FAD78';

        if (node.icon_type === 'danger') {
          markerColor = '#ff4d4d';
          pulseColor = 'rgba(255, 77, 77, 0.4)';
          borderColor = '#fff';
        } else if (node.icon_type === 'warning') {
          markerColor = '#ffcc00';
          pulseColor = 'rgba(255, 204, 0, 0.4)';
          borderColor = '#fff';
        }

        const el = document.createElement('div');
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; cursor: pointer;">
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: ${pulseColor}; animation: mapRingPulse 2s infinite; opacity: 0.4;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${markerColor}; border: 2px solid ${borderColor}; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 10;"></div>
          </div>
        `;

        let absoluteLink = node.link;
        if (absoluteLink && !absoluteLink.startsWith('http://') && !absoluteLink.startsWith('https://')) {
          absoluteLink = 'https://' + absoluteLink;
        }

        const popupHTML = `
          <div style="padding: 10px; max-width: 250px; text-align: ${lang === 'ar' ? 'right' : 'left'};" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
            <h4 style="margin: 0 0 8px 0; color: #0b2849;">${node.icon_type.toUpperCase()} - ${node.radius_km}km ${node.id === 'draft' ? '(Preview)' : ''}</h4>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">
              ${lang === 'ar' && node.description_ar ? node.description_ar : node.description_en || '...'}
            </p>
            ${node.link ? `<a href="${absoluteLink}" target="_blank" style="color: #15b47a; font-weight: bold; text-decoration: none;">${lang === 'ar' ? 'اقرأ المزيد' : 'Read more'}</a>` : ''}
          </div>
        `;

        const popup = new window.mapboxgl.Popup({ offset: 25, focusAfterOpen: false, closeButton: false }).setHTML(popupHTML);

        const marker = new window.mapboxgl.Marker(el)
          .setLngLat([node.longitude, node.latitude])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', (e) => {
          if (canEdit && node.id !== 'draft') {
            setFormData({
              radius_km: node.radius_km,
              icon_type: node.icon_type,
              description_ar: node.description_ar || '',
              description_en: node.description_en || '',
              link: node.link || ''
            });
            setEditingNodeId(node.id);
            setNewCoords({ lat: node.latitude, lng: node.longitude });
            setShowForm(true);
            setIsAddingMode(false);
          }
        });

        // Just show the popup without stealing focus if it's the draft
        if (node.id === 'draft') {
          popup.addTo(map);
        }

        markersRef.current.push(marker);
      });
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once('style.load', updateSource);
    }
  }, [nodes, mapboxLoaded, newCoords, formData, lang, canEdit]);

  const handleSaveNode = async () => {
    if (!newCoords) return;
    
    if (editingNodeId) {
      const { error } = await supabase.from('news_map_nodes').update({
        radius_km: formData.radius_km,
        icon_type: formData.icon_type,
        description_ar: formData.description_ar,
        description_en: formData.description_en,
        link: formData.link
      }).eq('id', editingNodeId);

      if (!error) {
        setShowForm(false);
        setNewCoords(null);
        setEditingNodeId(null);
        fetchNodes();
      } else {
        alert('Error updating node: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('news_map_nodes').insert([{
        latitude: newCoords.lat,
        longitude: newCoords.lng,
        radius_km: formData.radius_km,
        icon_type: formData.icon_type,
        description_ar: formData.description_ar,
        description_en: formData.description_en,
        link: formData.link,
        created_by: user?.id
      }]);

      if (!error) {
        setShowForm(false);
        setNewCoords(null);
        fetchNodes();
      } else {
        alert('Error saving node: ' + error.message);
      }
    }
  };

  const handleDeleteNode = async () => {
    if (!editingNodeId) return;
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه العقدة؟' : 'Are you sure you want to delete this node?')) {
      const { error } = await supabase.from('news_map_nodes').delete().eq('id', editingNodeId);
      if (!error) {
        setShowForm(false);
        setNewCoords(null);
        setEditingNodeId(null);
        fetchNodes();
      } else {
        alert('Error deleting node: ' + error.message);
      }
    }
  };

  return (
    <BaseMap onMapLoad={handleMapLoad} center={[35.0, 31.0]} zoom={4}>
      {canEdit && (
        <div style={{ 
          position: 'absolute', top: '20px', left: '20px', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', direction: 'ltr'
        }}>
          <Button 
            onClick={() => setIsAddingMode(!isAddingMode)}
            style={{ 
              background: isAddingMode ? '#ff4d4d' : '#15b47a', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              width: '50px', height: '50px', padding: 0, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={isAddingMode ? (lang === 'ar' ? 'إلغاء الإضافة' : 'Cancel') : (lang === 'ar' ? 'إنشاء عقدة جديدة' : 'Make New Node')}
          >
            {isAddingMode ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            )}
          </Button>
          {isAddingMode && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.9)', padding: '10px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', direction: lang === 'ar' ? 'rtl' : 'ltr', color: '#0b2849' }}>
              {lang === 'ar' ? 'انقر على الخريطة لتحديد الموقع' : 'Click on the map to set location'}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'absolute', top: 0, right: 0, 
          bottom: 0, width: '420px',
          background: 'rgba(11, 40, 73, 0.95)', backdropFilter: 'blur(10px)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          zIndex: 20, padding: '30px',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
          direction: lang === 'ar' ? 'rtl' : 'ltr',
          color: '#EEF6FC',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginTop: 0, color: '#4dff82' }}>
            {lang === 'ar' ? 'إضافة حدث على الخريطة' : 'Add Map Event'}
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>{lang === 'ar' ? 'نصف القطر (كم)' : 'Radius (km)'}</label>
            <input type="number" value={formData.radius_km} onChange={e => setFormData({...formData, radius_km: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>{lang === 'ar' ? 'نوع الأيقونة' : 'Icon Type'}</label>
            <select value={formData.icon_type} onChange={e => setFormData({...formData, icon_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#0b2849', color: '#fff' }}>
              <option value="danger">{lang === 'ar' ? 'خطر' : 'Danger'}</option>
              <option value="warning">{lang === 'ar' ? 'تحذير' : 'Warning'}</option>
              <option value="info">{lang === 'ar' ? 'معلومة' : 'Info'}</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>{lang === 'ar' ? 'الوصف (عربي)' : 'Description (AR)'}</label>
            <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', minHeight: '60px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
            <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', minHeight: '60px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>{lang === 'ar' ? 'رابط (اختياري)' : 'Link (optional)'}</label>
            <input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '20px' }}>
            <Button onClick={handleSaveNode} style={{ flex: 1, background: '#15b47a' }}>{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
            {editingNodeId && (
              <Button onClick={handleDeleteNode} style={{ flex: 1, background: '#ff4d4d' }}>{lang === 'ar' ? 'حذف' : 'Delete'}</Button>
            )}
            <Button variant="secondary" onClick={() => { setShowForm(false); setNewCoords(null); setEditingNodeId(null); }} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
    </BaseMap>
  );
}
