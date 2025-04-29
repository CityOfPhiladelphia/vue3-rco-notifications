import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import { point } from '@turf/helpers';
import { useParcelsStore } from './ParcelsStore';

export const useMapStore = defineStore("MapStore", {
  state: () => {
    return {
      map: {},
      searchDistance: 250,
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      // currentTopicMapStyle: {},
      bufferForAddress: {},
      bufferForParcel: {},
      currentMarkersForTopic: [],
      addressMarker: null,
      addressParcel: null,
      initialized: false,
      draw: null,
      imageryOn: false,
      imagerySelected: '2023',
      cyclomediaOn: false,
      cyclomediaInitialized: false,
      cyclomediaRecordingsOn: false,
      cyclomediaCameraYaw: null,
      cyclomediaCameraHFov: null,
      cyclomediaCameraXyz: null,
      cyclomediaCameraLngLat: null,
      cyclomediaYear: null,
      clickedCyclomediaRecordingCoords: null,
      eagleviewOn: false,
      selectedRegmap: null,
      regmapOpacity: 0.5,
      zoningOpacity: 1,
      stormwaterOpacity: 1,
      labelLayers: [],
    };
  },
  actions: {
    setCyclomediaCameraYaw(yaw) {
      this.cyclomediaCameraYaw = yaw;
    },
    setCyclomediaCameraLngLat(lngLat, xyz) {
      this.cyclomediaCameraXyz = xyz;
      this.cyclomediaCameraLngLat = lngLat;
    },
    setMap(map) {
      if (import.meta.env.VITE_DEBUG) console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
    async fillBufferForParcel() {
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForParcel is running');
      const ParcelsStore = useParcelsStore();
      if (ParcelsStore.pwd.features && ParcelsStore.pwd.features.length > 0) {
        let parcel = useParcelsStore().pwd.features[0];
        this.bufferForParcel= buffer(parcel, this.searchDistance, {units: 'feet'});
      } else {
        this.bufferForParcel = buffer(point(this.currentAddressCoords), this.searchDistance, {units: 'feet'});
      }
    },
    async clearBufferForParcel() {
      this.bufferForParcel = { type: 'FeatureCollection', features: [] };
    }
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};