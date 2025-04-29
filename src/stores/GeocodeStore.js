import { defineStore } from 'pinia';

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
        const response = await fetch(`https://api.phila.gov/ais_ps/v1/search/${encodeURIComponent(parameter)}?include_units=false`)
        if (response.ok) {
          if (import.meta.env.VITE_DEBUG) console.log('check AIS - await resolved and HTTP status is successful')
          this.aisDataChecked = await response.json()
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
        const response = await fetch(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(address)}?include_units=false`)
        if (response.ok) {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved and HTTP status is successful')
          const data = await response.json()
          this.aisData = data
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved but HTTP status was not successful')
          this.aisData = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('Address - await never resolved, failed to fetch address data')
      }
    },
    async fillAisBlockData(address) {
      try {
        if (import.meta.env.VITE_DEBUG) console.log('Address - fillAisData is running, address:', address)
        const response = await fetch(`https://api.phila.gov/ais_ps/v1/block/${encodeURIComponent(address)}?include_units=false`)
        if (response.ok) {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved and HTTP status is successful')
          const data = await response.json()
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