import { defineStore } from 'pinia';
import { fetchAisSearch, blockPhrase } from '@/util/ais.js';

export const useGeocodeStore = defineStore("GeocodeStore", {
  state: () => {
    return {
      aisDataChecked: {},
      aisData: {},
      aisBlockData: {},
    };
  },

  actions: {
    async checkAisData(parameter) {
      try {
        if (import.meta.env.VITE_DEBUG) console.log('checkAisData is running, parameter:', parameter);
        const data = await fetchAisSearch(parameter);
        if (data) {
          if (import.meta.env.VITE_DEBUG) console.log('check AIS - await resolved and HTTP status is successful')
          this.aisDataChecked = data
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('check AIS - await resolved but HTTP status was not successful')
          this.aisDataChecked = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('check AIS - await never resolved, failed to fetch address data')
      }
    },
    async fillAisData(address) {
      try {
        if (import.meta.env.VITE_DEBUG) console.log('Address - fillAisData is running, address:', address)
        const data = await fetchAisSearch(address);
        if (data) {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved and HTTP status is successful')
          this.aisData = data
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved but HTTP status was not successful')
          this.aisData = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('Address - await never resolved, failed to fetch address data')
      }
    },
    // every address on the geocoded address's hundred-block
    async fillAisBlockData() {
      try {
        const geocoded = this.aisData.features && this.aisData.features[0];
        if (!geocoded) {
          this.aisBlockData = {}
          return;
        }
        const phrase = blockPhrase(geocoded.properties.address_low, geocoded.properties.street_full);
        if (import.meta.env.VITE_DEBUG) console.log('Address - fillAisBlockData is running, phrase:', phrase)
        const data = await fetchAisSearch(phrase);
        if (data) {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved and HTTP status is successful')
          this.aisBlockData = data
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved but HTTP status was not successful')
          this.aisBlockData = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('Address - await never resolved, failed to fetch address data')
      }
    },
  },
  getters: {
  },

});