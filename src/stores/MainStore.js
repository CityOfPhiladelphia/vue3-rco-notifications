import { defineStore, acceptHMRUpdate } from 'pinia';

export const useMainStore = defineStore("MainStore", {
  state: () => {
    return {
      appVersion: 'RCO Notifications for Zoning Applications',
      pageTitle: '',
      addressSearchRunning: false,
      datafetchRunning: false,
      publicPath: null,
      isMobileDevice: null,
      isMac: null,
      lastSearchMethod: 'address',
      addressSearchValue: '',
      lastClickCoords: [0,0],
      currentParcelGeocodeParameter: '',
      currentParcelAddress:'',
      // otherParcelGeocodeParameter: '',
      // otherParcelAddress:'',
      currentAddress: '',
      currentLang: null,
      currentNearbyDataType: null,
      currentNearbyTimeInterval: {},
      dataSourcesLoadedArray: [],
      clickedRow: [],
      clickedParcelRow: [],
      clickedMarkerId: null,
      hoveredStateBuilding: null,
      hoveredStateAddress: null,
      selectedParcelId: null,
      fullScreenMapEnabled: false,
      fullScreenTopicsEnabled: false,
      windowDimensions: {},
      showInformation: false,
    };
  },

  actions: {
    setCurrentAddress(address) {
      this.currentAddress = address;
    },
    setCurrentGeocodeParameter(value) {
      this.currentGeocodeParameter = value;
    },
    setLastSearchMethod(searchMethod) {
      this.lastSearchMethod = searchMethod;
    },
    setCurrentNearbyDataType(data) {
      this.currentNearbyDataType = data;
    },
    clearDataSourcesLoadedArray() {
      this.dataSourcesLoadedArray = [];
    },
    addToDataSourcesLoadedArray(data) {
      this.dataSourcesLoadedArray.push(data);
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot))
};