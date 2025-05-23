import { useMainStore } from '@/stores/MainStore';

export default function useScrolling() {

  const handleRcoRowClick = (e, id, type) => {
    // if (import.meta.env.VITE_DEBUG) console.log('handleRcoRowClick, e:', e, 'e.row.lat:', e.row.lat, 'id:', id);
    let clickedRow = {
      type: type,
      id: e.row.properties[id],
      lngLat: [],
    };
    if (e.row.lat) {
      clickedRow.lngLat = [e.row.lng, e.row.lat];
    } else if (e.row.geometry) {
      clickedRow.lngLat = e.row.geometry.coordinates;
    }
    const MainStore = useMainStore();
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
    if (!MainStore.isMobileDevice && MainStore.windowDimensions.width > 768) {
      MainStore.clickedRow = clickedRow;
    }
  }

  const handleParcelRowClick = (e) => {
    // if (import.meta.env.VITE_DEBUG) console.log('handleParcelRowClick, e:', e, 'e.row.geocode_lat:', e.row.geocode_lat);
    const MainStore = useMainStore();
    MainStore.clickedParcelRow = [e.row.geocode_lon, e.row.geocode_lat];
  }

  const handleRowMouseover = (e, buildingId, addressId) => {
    const MainStore = useMainStore();
    // if (import.meta.env.VITE_DEBUG) console.log('handleRowMouseover, e:', e);
    MainStore.hoveredStateBuilding = e.row[buildingId];
    MainStore.hoveredStateAddress = e.row[addressId];
  }
  const handleRowMouseleave = () => {
    const MainStore = useMainStore();
    MainStore.hoveredStateBuilding = '';
    MainStore.hoveredStateAddress = '';
  }

  const isElementInViewport = (el) => {
    if (import.meta.env.VITE_DEBUG) console.log('isElementInViewport, el:', el);
    const rect = el.getBoundingClientRect();
    if (import.meta.env.VITE_DEBUG) console.log('bounding box', rect);
    const visibility = {
      // TODO the 108 below is account for the combined height of the
      // app header and address header. this is not a good long-term
      // solution - instead, use the `bottom` value of the address header's
      // bounding rect. however, this should only fire on small devices,
      // which would require again hard-coding screen breakpoints from
      // standards or some other magic, which might not a huge
      // improvement in terms of decoupling logic and presentation. hmm.
      top: rect.top >= 108,
      left: rect.left >= 0,
      bottom: rect.bottom <= (window.innerHeight || document.documentElement.clientHeight),
      right: rect.right <= (window.innerWidth || document.documentElement.clientWidth),
    };
    // return if all sides are visible
    return Object.values(visibility).every(val => val);
  }

  return {
    handleRcoRowClick,
    handleParcelRowClick,
    handleRowMouseover,
    handleRowMouseleave,
    isElementInViewport,
  }

}