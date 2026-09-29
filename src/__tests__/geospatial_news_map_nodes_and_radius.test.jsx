import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/preact';
import { useEffect } from 'preact/hooks';
import { NewsMap } from '../features/news-blog/components/NewsMap';
import * as AuthModule from '../features/auth/hooks/useAuth';

// ─── MAPBOX & BASEMAP MOCKS ──────────────────────────────────────────────────

let activeMapMock = null;
let mapListeners = {};
let mapSources = {};
let mapLayers = {};
let markerInstances = [];
let popupInstances = [];

function createMockMapInstance() {
  mapListeners = {};
  mapSources = {};
  mapLayers = {};
  const canvasEl = document.createElement('canvas');

  const map = {
    on: vi.fn((event, cb) => {
      mapListeners[event] = mapListeners[event] || [];
      mapListeners[event].push(cb);
    }),
    off: vi.fn((event, cb) => {
      if (mapListeners[event]) {
        mapListeners[event] = mapListeners[event].filter(fn => fn !== cb);
      }
    }),
    once: vi.fn((event, cb) => {
      const wrapper = (...args) => {
        map.off(event, wrapper);
        cb(...args);
      };
      map.on(event, wrapper);
    }),
    isStyleLoaded: vi.fn(() => true),
    getSource: vi.fn((id) => mapSources[id] || null),
    addSource: vi.fn((id, source) => {
      const srcObj = {
        ...source,
        setData: vi.fn((newData) => {
          srcObj.data = newData;
        })
      };
      mapSources[id] = srcObj;
    }),
    addLayer: vi.fn((layer) => {
      mapLayers[layer.id] = layer;
    }),
    fitBounds: vi.fn(),
    resize: vi.fn(),
    getCanvas: vi.fn(() => canvasEl),
    trigger: (event, ...args) => {
      if (mapListeners[event]) {
        // Clone array to prevent issues if listeners modify array during iteration
        [...mapListeners[event]].forEach(cb => cb(...args));
      }
    }
  };

  return map;
}

vi.mock('../features/shared/components/BaseMap', () => ({
  BaseMap: ({ children, onMapLoad }) => {
    useEffect(() => {
      if (activeMapMock && onMapLoad) {
        onMapLoad(activeMapMock);
        activeMapMock.trigger('idle');
      }
    }, []);

    return (
      <div data-testid="mock-base-map" style={{ position: 'relative' }}>
        {children}
      </div>
    );
  }
}));

// Setup window.mapboxgl
beforeEach(() => {
  markerInstances = [];
  popupInstances = [];
  activeMapMock = createMockMapInstance();

  window.mapboxgl = {
    Popup: vi.fn().mockImplementation(function (options) {
      this.options = options;
      this.html = '';
      this.setHTML = vi.fn().mockImplementation((html) => {
        this.html = html;
        return this;
      });
      this.addTo = vi.fn().mockImplementation(() => {
        this.isOpen = true;
        return this;
      });
      this.remove = vi.fn().mockImplementation(() => {
        this.isOpen = false;
        return this;
      });
      this.getElement = vi.fn().mockReturnValue(document.createElement('div'));
      popupInstances.push(this);
    }),
    Marker: vi.fn().mockImplementation(function (el) {
      this.element = el;
      this.lngLat = null;
      this.popup = null;
      this.setLngLat = vi.fn().mockImplementation((coords) => {
        this.lngLat = coords;
        return this;
      });
      this.setPopup = vi.fn().mockImplementation((popup) => {
        this.popup = popup;
        return this;
      });
      this.addTo = vi.fn().mockImplementation(() => {
        this.isAdded = true;
        return this;
      });
      this.remove = vi.fn().mockImplementation(() => {
        this.isAdded = false;
        return this;
      });
      markerInstances.push(this);
    })
  };
});

// ─── SUPABASE CLIENT MOCK ───────────────────────────────────────────────────

let mockDbNodes = [];
let insertCalls = [];
let updateCalls = [];
let deleteCalls = [];
let shouldFailInsert = false;

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: vi.fn().mockImplementation(() => {
        return Promise.resolve({ data: [...mockDbNodes], error: null });
      }),
      insert: vi.fn().mockImplementation((rows) => {
        if (shouldFailInsert) {
          return Promise.resolve({ data: null, error: { message: 'Database connection failed' } });
        }
        insertCalls.push(...rows);
        rows.forEach((r, i) => {
          mockDbNodes.push({ id: `node-new-${Date.now()}-${i}`, ...r });
        });
        return Promise.resolve({ data: rows, error: null });
      }),
      update: vi.fn().mockImplementation((updates) => {
        return {
          eq: vi.fn().mockImplementation((field, val) => {
            updateCalls.push({ updates, field, val });
            mockDbNodes = mockDbNodes.map(n => n[field] === val ? { ...n, ...updates } : n);
            return Promise.resolve({ data: null, error: null });
          })
        };
      }),
      delete: vi.fn().mockImplementation(() => {
        return {
          eq: vi.fn().mockImplementation((field, val) => {
            deleteCalls.push({ field, val });
            mockDbNodes = mockDbNodes.filter(n => n[field] !== val);
            return Promise.resolve({ data: null, error: null });
          })
        };
      })
    })
  }
}));

// ─── HELPER RENDER ──────────────────────────────────────────────────────────

function setupAuth(role = 'admin') {
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
    user: { id: 'admin-usr-1', email: 'admin@climamedix.org' },
    hasPermission: (perm) => {
      if (role === 'admin' || role === 'superadmin') return true;
      if (perm === 'edit:news_map') return false;
      return false;
    },
    disabledPermissions: []
  });
}

describe('Geospatial NewsMap: Interactive Points & Radius Circle Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldFailInsert = false;
    mockDbNodes = [
      {
        id: 'node-amman',
        latitude: 31.95,
        longitude: 35.91,
        radius_km: 45,
        icon_type: 'danger',
        description_ar: 'موجة حرارية شديدة في عمان',
        description_en: 'Severe heatwave in Amman',
        link: 'https://climamedix.org/heatwave'
      },
      {
        id: 'node-cairo',
        latitude: 30.04,
        longitude: 31.23,
        radius_km: 90,
        icon_type: 'warning',
        description_ar: 'عاصفة ترابية في القاهرة',
        description_en: 'Dust storm alert in Cairo',
        link: 'climamedix.org/dust-storm' // Link without protocol to test prepend
      }
    ];
    insertCalls = [];
    updateCalls = [];
    deleteCalls = [];
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Initial Map Load, GeoJSON Source & Radius Layers
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Map Engine Initialization, GeoJSON & Radius Layer', () => {
    it('initializes map, adds GeoJSON source and circle-radius layer for loaded nodes', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(mapSources['news-nodes']?.data?.features).toHaveLength(2);
      });

      const source = mapSources['news-nodes'];
      expect(source.type).toBe('geojson');
      expect(source.data.type).toBe('FeatureCollection');

      // Verify coordinate mapping to GeoJSON Point
      expect(source.data.features[0].geometry.coordinates).toEqual([35.91, 31.95]);
      expect(source.data.features[0].properties.radius_km).toBe(45);
      expect(source.data.features[0].properties.icon_type).toBe('danger');

      // Verify circle radius layer configuration
      const radiusLayer = mapLayers['news-nodes-radius'];
      expect(radiusLayer).toBeDefined();
      expect(radiusLayer.type).toBe('circle');
      expect(radiusLayer.paint['circle-opacity']).toBe(0.3);
      expect(radiusLayer.paint['circle-radius']).toEqual([
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        0, ['/', ['*', ['get', 'radius_km'], 1000], ['*', 78271.51696, ['cos', ['*', ['get', 'latitude'], Math.PI / 180]]]],
        22, ['*', ['/', ['*', ['get', 'radius_km'], 1000], ['*', 78271.51696, ['cos', ['*', ['get', 'latitude'], Math.PI / 180]]]], Math.pow(2, 22)]
      ]);
    });

    it('calculates geographic bounds and calls fitBounds with radius padding offset', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(activeMapMock.fitBounds).toHaveBeenCalled();
      });

      const [bounds, options] = activeMapMock.fitBounds.mock.calls[0];
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;

      // Amman is 35.91, Cairo is 31.23 -> minLng should be < 31.23 (offset with radius)
      expect(minLng).toBeLessThan(31.23);
      expect(maxLng).toBeGreaterThan(35.91);
      expect(minLat).toBeLessThan(30.04);
      expect(maxLat).toBeGreaterThan(31.95);

      expect(options.maxZoom).toBe(10);
      expect(options.duration).toBe(0);
      expect(options.padding).toEqual({ top: 90, bottom: 60, left: 60, right: 60 });
    });

    it('creates HTML marker elements with pulse rings for each point', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      // Markers should have setLngLat called with [lng, lat]
      expect(markerInstances[0].setLngLat).toHaveBeenCalledWith([35.91, 31.95]);
      expect(markerInstances[1].setLngLat).toHaveBeenCalledWith([31.23, 30.04]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Interactive Point Placement & Radius Preview (Add Mode)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Click-to-Place Point & Real-Time Radius Preview', () => {
    it('sets custom crosshair cursor and instruction banner when Add Node is clicked', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      fireEvent.click(container.querySelector('button[title="إنشاء عقدة جديدة"]'));

      await waitFor(() => {
        expect(screen.getByText('انقر على الخريطة لتحديد الموقع')).toBeInTheDocument();
      });
      expect(activeMapMock.getCanvas().style.cursor).toContain('data:image/svg+xml');
    });

    it('clicking map in Add Mode captures coordinates, opens drawer form and previews draft point with radius', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      // 1. Enter add mode
      fireEvent.click(container.querySelector('button[title="إنشاء عقدة جديدة"]'));

      // 2. Wait for mode to activate
      await waitFor(() => {
        expect(screen.getByText('انقر على الخريطة لتحديد الموقع')).toBeInTheDocument();
      });

      // 3. Simulate user clicking on the map at Riyadh (Lat: 24.71, Lng: 46.67)
      act(() => {
        activeMapMock.trigger('click', {
          lngLat: { lat: 24.71, lng: 46.67 }
        });
      });

      // 4. Form drawer opens
      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      // 5. Draft point is injected into map source with initial 50km radius
      await waitFor(() => {
        const source = mapSources['news-nodes'];
        const draftFeature = source.data.features.find(f => f.properties.id === 'draft');
        expect(draftFeature).toBeDefined();
        expect(draftFeature.geometry.coordinates).toEqual([46.67, 24.71]);
        expect(draftFeature.properties.radius_km).toBe(50);
      });
    });

    it('adjusting radius input updates draft circle radius in real time', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      fireEvent.click(container.querySelector('button[title="إنشاء عقدة جديدة"]'));

      await waitFor(() => {
        expect(screen.getByText('انقر على الخريطة لتحديد الموقع')).toBeInTheDocument();
      });

      act(() => {
        activeMapMock.trigger('click', {
          lngLat: { lat: 24.71, lng: 46.67 }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      // Change radius from 50 to 125 km
      const radiusInput = container.querySelector('input[type="number"]');
      fireEvent.change(radiusInput, { target: { value: '125' } });

      await waitFor(() => {
        const source = mapSources['news-nodes'];
        const draft = source.data.features.find(f => f.properties.id === 'draft');
        expect(draft.properties.radius_km).toBe(125);
      });
    });

    it('saving new point calls Supabase insert with coordinates, radius and metadata', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      fireEvent.click(container.querySelector('button[title="إنشاء عقدة جديدة"]'));

      await waitFor(() => {
        expect(screen.getByText('انقر على الخريطة لتحديد الموقع')).toBeInTheDocument();
      });

      act(() => {
        activeMapMock.trigger('click', {
          lngLat: { lat: 24.71, lng: 46.67 }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(container.querySelector('input[type="number"]'), { target: { value: '80' } });
      fireEvent.change(container.querySelector('select'), { target: { value: 'warning' } });
      
      const textareas = container.querySelectorAll('textarea');
      fireEvent.change(textareas[0], { target: { value: 'موجة غبارية في الرياض' } });
      fireEvent.change(textareas[1], { target: { value: 'Dust storm in Riyadh' } });

      fireEvent.change(container.querySelector('input[type="url"]'), { target: { value: 'https://climamedix.org/riyadh-dust' } });

      // Click Save
      fireEvent.click(screen.getByText('حفظ'));

      await waitFor(() => {
        expect(insertCalls).toHaveLength(1);
      });

      expect(insertCalls[0]).toEqual({
        latitude: 24.71,
        longitude: 46.67,
        radius_km: '80',
        icon_type: 'warning',
        description_ar: 'موجة غبارية في الرياض',
        description_en: 'Dust storm in Riyadh',
        link: 'https://climamedix.org/riyadh-dust',
        created_by: 'admin-usr-1'
      });

      // Drawer closes after save
      expect(screen.queryByText('إضافة حدث على الخريطة')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Existing Point Editing, Radius Adjustment & Deletion
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Edit Existing Node & Deletion Workflow', () => {
    it('clicking an existing marker opens edit form prefilled with node values', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      // Simulate clicking the Amman marker's HTML element
      const ammanMarker = markerInstances[0];
      act(() => {
        fireEvent.click(ammanMarker.element);
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      // Radius is prefilled with 45
      expect(container.querySelector('input[type="number"]').value).toBe('45');
      // Description AR is prefilled
      const textareas = container.querySelectorAll('textarea');
      expect(textareas[0].value).toBe('موجة حرارية شديدة في عمان');
      // Delete button appears in edit mode
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });

    it('updating radius and saving edits sends Supabase update query', async () => {
      setupAuth('admin');
      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      // Click Amman marker
      act(() => {
        fireEvent.click(markerInstances[0].element);
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      // Change radius from 45 to 65
      fireEvent.change(container.querySelector('input[type="number"]'), { target: { value: '65' } });

      // Click Save
      fireEvent.click(screen.getByText('حفظ'));

      await waitFor(() => {
        expect(updateCalls).toHaveLength(1);
      });

      expect(updateCalls[0].val).toBe('node-amman');
      expect(updateCalls[0].updates.radius_km).toBe('65');
    });

    it('deleting a node asks for confirmation and calls Supabase delete', async () => {
      setupAuth('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      // Click Amman marker
      act(() => {
        fireEvent.click(markerInstances[0].element);
      });

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('حذف'));

      expect(window.confirm).toHaveBeenCalledWith('هل أنت متأكد من حذف هذه العقدة؟');
      await waitFor(() => {
        expect(deleteCalls).toHaveLength(1);
        expect(deleteCalls[0].val).toBe('node-amman');
      });
    });

    it('cancelling deletion confirmation does not call Supabase delete', async () => {
      setupAuth('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      act(() => {
        fireEvent.click(markerInstances[0].element);
      });

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('حذف'));

      expect(window.confirm).toHaveBeenCalled();
      expect(deleteCalls).toHaveLength(0);
    });

    it('clicking cancel button in drawer closes form without saving', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      act(() => {
        fireEvent.click(markerInstances[0].element);
      });

      await waitFor(() => {
        expect(screen.getByText('إلغاء')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('إلغاء'));

      expect(screen.queryByText('إضافة حدث على الخريطة')).toBeNull();
      expect(updateCalls).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Popups & Mouse Hover Interactions
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Hover Popups & URL Handling', () => {
    it('prepends https:// to relative URLs in node popups', async () => {
      setupAuth('admin');
      render(<NewsMap lang="en" />);

      await waitFor(() => {
        expect(popupInstances.length).toBeGreaterThanOrEqual(2);
      });

      // Node Cairo had link 'climamedix.org/dust-storm' -> should be prepended with https://
      const cairoPopup = popupInstances[1];
      expect(cairoPopup.html).toContain('https://climamedix.org/dust-storm');
      expect(cairoPopup.html).toContain('Read more');
    });

    it('opens popup on mouseenter and closes on pointerleave after timeout', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(markerInstances.length).toBeGreaterThanOrEqual(2);
      });

      const marker = markerInstances[0];
      const markerEl = marker.element;

      // Mouseenter
      fireEvent.pointerEnter(markerEl, { pointerType: 'mouse' });
      expect(marker.popup.addTo).toHaveBeenCalledWith(activeMapMock);

      // Pointerleave
      fireEvent.pointerLeave(markerEl, { pointerType: 'mouse' });

      await waitFor(() => {
        expect(marker.popup.remove).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Responsiveness & Error Resilience
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Mobile Responsiveness & Error Scenarios', () => {
    it('adapts padding on mobile window resize', async () => {
      setupAuth('admin');
      render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(activeMapMock.fitBounds).toHaveBeenCalled();
      });

      // Simulate resize to mobile (width 500)
      window.innerWidth = 500;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        const calls = activeMapMock.fitBounds.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[1].padding).toEqual({ top: 90, bottom: 45, left: 35, right: 35 });
      }, { timeout: 1000 });
    });

    it('displays alert message when Supabase insert throws an error', async () => {
      setupAuth('admin');
      shouldFailInsert = true;
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { container } = render(<NewsMap lang="ar" />);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      fireEvent.click(container.querySelector('button[title="إنشاء عقدة جديدة"]'));

      await waitFor(() => {
        expect(screen.getByText('انقر على الخريطة لتحديد الموقع')).toBeInTheDocument();
      });

      act(() => {
        activeMapMock.trigger('click', { lngLat: { lat: 25.0, lng: 45.0 } });
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة حدث على الخريطة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('حفظ'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error saving node: Database connection failed');
      });
    });
  });
});
