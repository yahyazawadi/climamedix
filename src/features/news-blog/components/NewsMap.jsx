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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const hasInitialFitted = useRef(false);
  
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

  const fitAllCircles = useCallback((map, nodesList) => {
    if (!map || typeof map.fitBounds !== 'function' || !nodesList || nodesList.length === 0) return;

    let minLat = 90, maxLat = -90;
    let minLng = 180, maxLng = -180;
    let validCount = 0;

    nodesList.forEach(node => {
      const lat = Number(node.latitude);
      const lng = Number(node.longitude);
      const radius = Number(node.radius_km) || 0;
      if (isNaN(lat) || isNaN(lng)) return;

      validCount++;
      // 1 deg latitude ≈ 110.574 km
      const latOffset = radius / 110.574;
      // 1 deg longitude ≈ 111.320 * cos(lat) km
      const latRad = (lat * Math.PI) / 180;
      const lngOffset = radius / Math.max(0.1, 111.320 * Math.cos(latRad));

      minLat = Math.min(minLat, lat - latOffset);
      maxLat = Math.max(maxLat, lat + latOffset);
      minLng = Math.min(minLng, lng - lngOffset);
      maxLng = Math.max(maxLng, lng + lngOffset);
    });

    if (validCount === 0) return;

    if (typeof map.resize === 'function') {
      map.resize();
    }

    const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768;
    // Padding with head space at the top so circles have breathing room from the top edge
    const padding = isMobileView
      ? { top: 90, bottom: 45, left: 35, right: 35 }
      : { top: 90, bottom: 60, left: 60, right: 60 };

    try {
      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        {
          padding,
          maxZoom: 10,
          duration: 0
        }
      );
    } catch (err) {
      console.warn('fitBounds error:', err);
    }
  }, []);

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

  const [mapFullyReady, setMapFullyReady] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, [user]); // Re-fetch when user session is ready

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mapInstanceRef.current && nodes.length > 0) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            fitAllCircles(mapInstanceRef.current, nodes);
          }
        }, 100);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes, fitAllCircles]);

  const handleMapLoad = useCallback((map) => {
    mapInstanceRef.current = map;
    setMapboxLoaded(true);
    
    // Wait until Mapbox has completely finished rendering everything
    map.once('idle', () => {
      setMapFullyReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapFullyReady || !mapInstanceRef.current || nodes.length === 0) return;
    if (!hasInitialFitted.current) {
      hasInitialFitted.current = true;
      setTimeout(() => {
        if (mapInstanceRef.current) {
          fitAllCircles(mapInstanceRef.current, nodes);
        }
      }, 50);
    }
  }, [mapFullyReady, nodes, fitAllCircles]);

  useEffect(() => {
    if (!mapboxLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Set cursor based on mode
    if (isAddingMode || showForm) {
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
        if (isMobile) {
          setTimeout(() => {
            if (map && typeof map.flyTo === 'function') {
              map.resize();
              map.flyTo({
                center: [e.lngLat.lng, e.lngLat.lat],
                offset: [0, -100],
                duration: 400
              });
            }
          }, 100);
        }
      } else if (showForm) {
        setNewCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
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

  }, [mapboxLoaded, isAddingMode, showForm]);

  // Update markers and circles when nodes change
  useEffect(() => {
    // ONLY render nodes after the map is completely idle and ready
    if (!mapFullyReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const baseNodes = editingNodeId && newCoords ? nodes.filter(n => n.id !== editingNodeId) : nodes;

    const displayNodes = newCoords ? [...baseNodes, {
      id: 'draft',
      latitude: newCoords.lat,
      longitude: newCoords.lng,
      radius_km: Number(formData.radius_km) || 0,
      icon_type: formData.icon_type,
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      link: formData.link
    }] : nodes;

    const updateSource = () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: displayNodes.map(node => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [node.longitude, node.latitude] },
          properties: { ...node }
        }))
      };

      try {
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
              // Accurate radius calculation in meters mapped to pixels based on Web Mercator projection (512px tile at zoom 0)
              'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ['/', ['*', ['get', 'radius_km'], 1000], ['*', 78271.51696, ['cos', ['*', ['get', 'latitude'], Math.PI / 180]]]],
                22, ['*', ['/', ['*', ['get', 'radius_km'], 1000], ['*', 78271.51696, ['cos', ['*', ['get', 'latitude'], Math.PI / 180]]]], Math.pow(2, 22)]
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
      } catch (err) {
        console.warn('Mapbox style not ready, retrying...', err);
        setTimeout(updateSource, 200);
        return;
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

        let hideTimeout;

        el.addEventListener('pointerenter', (e) => {
          if (e.pointerType === 'mouse') {
            clearTimeout(hideTimeout);
            popup.addTo(map);
            
            // Allow user to move mouse into the popup without it closing
            const popupNode = popup.getElement();
            if (popupNode) {
              popupNode.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
              popupNode.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => popup.remove(), 150);
              });
            }
          }
        });

        el.addEventListener('pointerleave', (e) => {
          if (e.pointerType === 'mouse') {
            hideTimeout = setTimeout(() => {
              popup.remove();
            }, 150);
          }
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (canEdit && node.id !== 'draft') {
            popup.remove(); // Close the native popup if we are an admin opening the edit form
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

            if (isMobile) {
              // Smoothly pan camera so the node stays centered in the upper visible half of the map
              setTimeout(() => {
                if (map && typeof map.flyTo === 'function') {
                  map.resize();
                  map.flyTo({
                    center: [node.longitude, node.latitude],
                    offset: [0, -100],
                    zoom: Math.max(map.getZoom(), 4.5),
                    duration: 500
                  });
                }
              }, 100);
            }
          } else {
            if (popup.isOpen()) {
              popup.remove();
            } else {
              popup.addTo(map);
            }
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
  }, [nodes, mapboxLoaded, mapFullyReady, newCoords, formData, lang, canEdit]);

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
    <BaseMap 
      onMapLoad={handleMapLoad} 
      center={isMobile ? [38.5, 28.0] : [37.0, 28.5]} 
      zoom={isMobile ? 2.9 : 4}
      style={{
        width: '100%',
        height: isMobile ? (showForm ? '640px' : '460px') : '520px',
        borderRadius: isMobile ? '16px' : '24px',
        overflow: 'hidden',
        boxShadow: 'none',
        transition: 'height 0.3s ease'
      }}
    >
      {canEdit && (
        <div style={{ 
          position: 'absolute', top: '20px', left: '20px', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', direction: 'ltr'
        }}>
          <Button 
            onClick={() => {
              if (isAddingMode || showForm) {
                setIsAddingMode(false);
                setShowForm(false);
                setNewCoords(null);
                setEditingNodeId(null);
              } else {
                setIsAddingMode(true);
              }
            }}
            style={{ 
              background: (isAddingMode || showForm) ? '#ff4d4d' : '#15b47a', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              width: '50px', height: '50px', padding: 0, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={(isAddingMode || showForm) ? (lang === 'ar' ? 'إلغاء الإضافة' : 'Cancel') : (lang === 'ar' ? 'إنشاء عقدة جديدة' : 'Make New Node')}
          >
            {(isAddingMode || showForm) ? (
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
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'absolute', 
          top: isMobile ? '38%' : 0, 
          right: 0, 
          left: isMobile ? 0 : 'auto',
          bottom: 0, 
          width: isMobile ? '100%' : '420px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          background: 'rgba(11, 40, 73, 0.96)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.15)',
          borderTop: isMobile ? '2px solid rgba(21, 180, 122, 0.5)' : 'none',
          borderTopLeftRadius: isMobile ? '20px' : '0',
          borderTopRightRadius: isMobile ? '20px' : '0',
          boxShadow: isMobile ? '0 -10px 30px rgba(0,0,0,0.5)' : '-10px 0 30px rgba(0,0,0,0.3)',
          zIndex: 25, 
          padding: isMobile ? '16px 16px 24px 16px' : '30px',
          direction: lang === 'ar' ? 'rtl' : 'ltr',
          color: '#EEF6FC',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#4dff82', fontSize: '18px', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'إضافة حدث على الخريطة' : 'Add Map Event'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setNewCoords(null); setEditingNodeId(null); }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#EEF6FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1
              }}
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              &times;
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#cbd5e1' }}>{lang === 'ar' ? 'نصف القطر (كم)' : 'Radius (km)'}</label>
            <input type="number" value={formData.radius_km} onChange={e => setFormData({...formData, radius_km: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#cbd5e1' }}>{lang === 'ar' ? 'نوع الأيقونة' : 'Icon Type'}</label>
            <select value={formData.icon_type} onChange={e => setFormData({...formData, icon_type: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#0b2849', color: '#fff' }}>
              <option value="danger">{lang === 'ar' ? 'خطر' : 'Danger'}</option>
              <option value="warning">{lang === 'ar' ? 'تحذير' : 'Warning'}</option>
              <option value="info">{lang === 'ar' ? 'معلومة' : 'Info'}</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#cbd5e1' }}>{lang === 'ar' ? 'الوصف (عربي)' : 'Description (AR)'}</label>
            <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', minHeight: '60px', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#cbd5e1' }}>{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
            <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', minHeight: '60px', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#cbd5e1' }}>{lang === 'ar' ? 'رابط (اختياري)' : 'Link (optional)'}</label>
            <input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '15px' }}>
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
