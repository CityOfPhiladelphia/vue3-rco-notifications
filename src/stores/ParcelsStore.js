import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { fetchTableGeoJSON } from '@/util/databridge.js';

const PWD_TABLE = 'pwd_parcels_3857';
const PWD_FIELDS = 'parcelid, address, objectid';

export const useParcelsStore = defineStore('ParcelsStore', {
  state: () => {
    return {
      pwdChecked: {},
      pwd: {},
    };
  },
  actions: {
    async clearParcels() {
      this.pwdChecked = {};
      this.pwd = {};
    },
    async fillPwdParcelData() {
      const GeocodeStore = useGeocodeStore();
      const AddressLoaded = GeocodeStore.aisData.features
      if (!AddressLoaded) { return }
      const aisData = AddressLoaded[0];
      const pwdParcelNumber = aisData.properties.pwd_parcel_id;
      if (!pwdParcelNumber) {
        if (import.meta.env.VITE_DEBUG) console.log('no pwd parcel in AIS')
        await this.checkParcelDataByLngLat(aisData.geometry.coordinates[0], aisData.geometry.coordinates[1]);
        this.pwd = this.pwdChecked;
        return;
      }
      const data = await fetchTableGeoJSON({ table: PWD_TABLE, fields: PWD_FIELDS, where: `parcelid = '${pwdParcelNumber}'` });
      if (data) {
        this.pwd = data;
      } else {
        if (import.meta.env.VITE_DEBUG) console.warn('fillPwdParcelData - failed to fetch parcel data');
      }
    },

    async checkParcelDataByLngLat(lng, lat) {
      if (import.meta.env.VITE_DEBUG) console.log('checkParcelDataByLngLat, lng:', lng, 'lat:', lat);
      const data = await fetchTableGeoJSON({ table: PWD_TABLE, fields: PWD_FIELDS, point: { lng, lat } });
      if (data && data.features.length > 0) {
        this.pwdChecked = data;
      } else {
        if (import.meta.env.VITE_DEBUG) console.log('checkParcelDataByLngLat - no pwd parcel at this point');
        this.pwdChecked = {};
      }
    },
  },
})
