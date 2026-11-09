import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { fetchAisSearch } from '@/util/ais.js';

export const useCondosStore = defineStore('CondosStore', {
  state: () => {
    return {
      condosData: {
        page_count: 0,
        total_size: 0,
        pages: {
          page_1: { features: [] },
        },
      },
      dataPageFilled: null,
      lastPageUsed: 1,
      loadingCondosData: false,
    };
  },
  actions: {
    async fillCondoData(address, page = 1) {
      if (import.meta.env.VITE_DEBUG) console.log('fillCondoData is running, address', address, 'page:', page);
      try {
        const GeocodeStore = useGeocodeStore();
        const AddressLoaded = GeocodeStore.aisData.features
        if (!AddressLoaded) { return }
        const aisData = AddressLoaded[0];
        const data = await fetchAisSearch(address, { includeUnits: true, opaOnly: true, page });
        // if (import.meta.env.VITE_DEBUG) console.log('condos data:', data);
        if (data) {
          if (import.meta.env.VITE_DEBUG) console.log('Condos - await resolved and HTTP status is successful')
          this.dataPageFilled = page;
          if (data.features.length > 0) {
            let newData = {
              // page_count: data.page_count,
              // total_size: data.total_size,
              features: [],
            }
            // if (import.meta.env.VITE_DEBUG) console.log('in condo-list, data:', data, 'state:', state);
            for (let feature of data.features) {
              // if (import.meta.env.VITE_DEBUG) console.log('feature.properties.address_low_frac:', feature.properties.address_low_frac, 'aisData.properties.address_low_frac:', aisData.properties.address_low_frac, 'feature.properties.street_address:', feature.properties.street_address, 'aisData.properties.street_address:', aisData.properties.street_address);
              if (feature.properties.address_low_frac !== aisData.properties.address_low_frac || feature.properties.street_address === aisData.properties.street_address) {
                // return;
                data.total_size = data.total_size - 1;
              } else {
                newData.features.push(feature);
              }
            }
            if (page === 1) {
              this.condosData.page_count = data.page_count;
              this.condosData.total_size = data.total_size;
            }
            this.condosData.pages['page_'+page] = newData;
          }
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('Condos - await resolved but no data features')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('Condos - await never resolved, failed to fetch condo data')
      }
    },
  }
})