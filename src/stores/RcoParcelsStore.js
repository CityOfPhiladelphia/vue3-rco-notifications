import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import { useMapStore } from '@/stores/MapStore.js'
import { useParcelsStore } from '@/stores/ParcelsStore.js'
import axios from 'axios';

import useTransforms from '@/composables/useTransforms';
const { rcoPrimaryContact, phoneNumber, date } = useTransforms();

export const useRcoParcelsStore = defineStore('RcoParcelsStore', {
  state: () => {
    return {
      rcos: {},
      loadingRcos: false,
      pwdParcelsByBlock: {},
      loadingPwdParcelsByBlock: false,
      pwdParcelsByBuffer: {},
      loadingPwdParcelsByBuffer: false,
      pwdParcelsMerged: [],
      loadingPwdParcelsMerged: false,
      opaPropertiesPublic: {},
      loadingOpaPropertiesPublic: false,
      units: {},
    };
  },
  actions: {
    async clearAllPwdParcelsData() {
      this.loadingPwdParcelsByBlock = true;
      this.pwdParcelsByBlock = {};
      this.loadingPwdParcelsByBuffer = true;
      this.pwdParcelsByBuffer = {};
      this.loadingPwdParcelsMerged = {};
      this.pwdParcelsMerged = { type: 'FeatureCollection', features: [] };
      this.loadingRcos = true;
      this.rcos = {};
      this.loadingOpaPropertiesPublic = true;
      this.opaPropertiesPublic = {};
      this.units = {};
    },
    evaluateDataForUnits(data) {
      var units = [], dataList = [];
      let groupedData = Object.groupBy(data.rows, a => a.pwd_parcel_id);
  
      for (let item in groupedData){
        groupedData[item].length > 1 ? units.push.apply(units,groupedData[item]) : dataList.push(groupedData[item][0]);
      }
      if (import.meta.env.VITE_DEBUG) console.log('base-client evaluateDataForUnits data:', data, 'groupedData:', groupedData, 'units:', units, 'dataList:', dataList);
  
      let bldgRecord = JSON.parse(JSON.stringify(data.rows[0]));
  
      if(units.length > 0) {
        units = Object.groupBy(units, a => a.pwd_parcel_id);
        data.rows = data.rows.filter(a => !Object.keys(units).includes(a.pwd_parcel_id));
      }
  
      // for (let unit in units) {
      //   if (import.meta.env.VITE_DEBUG) console.log('inside units loop, units:', units, 'units[unit]:', units[unit], 'typeof(units[unit]):', typeof(units[unit]));
      //   if (typeof(units[unit]) === 'function') {
      //     break;
      //   }
      //   for (let i in bldgRecord) {
      //     bldgRecord[i] = "";
      //   }
      //   let bldgRecordPush = JSON.parse(JSON.stringify(bldgRecord));
      //   bldgRecordPush.owner_1 = "Condominium (" + units[unit].length + " Units)";
      //   bldgRecordPush.owner_2 = null;
      //   bldgRecordPush.location = units[unit][0].location;
      //   bldgRecordPush.condo = true;
      //   bldgRecordPush.pwd_parcel_id = units[unit][0].pwd_parcel_id;
      //   data.rows.push(bldgRecordPush);
      // }
      this.units = units;
      this.opaPropertiesPublic = Object.groupBy(dataList, a => a.pwd_parcel_id);
    },
    async fillOpaPropertiesPublic() {
      try {
        // if (import.meta.env.VITE_DEBUG) console.log('fillOpaPropertiesPublic is running');
        const opaSet = this.pwdParcelsMerged.features.map((feature) => feature.properties.parcel_id).join("','");
        if (import.meta.env.VITE_DEBUG) console.log('opaSet:', opaSet);
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+pwd_parcel_id+in+(%27${opaSet}%27)`);
        // const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+parcel_number+in+(%27${opaSet}%27)`);
        if (response.ok) {
          let data = await response.json();
          // if (import.meta.env.VITE_DEBUG) console.log('data:', data);
          data.rows.forEach(item => {
            // if (import.meta.env.VITE_DEBUG) console.log('item:', item);
            item.parcel_address = `${item.address_std}<br>PHILADELPHIA, PA ${item.zip_code}`;

            item.mail_contact = '';
            if (item.mailing_care_of) item.mail_contact +=`${item.mailing_care_of}<br>`;
            if (item.mailing_address_1) item.mail_contact+=`${item.mailing_address_1}<br>`;
            if (item.mailing_address_2) item.mail_contact+=`${item.mailing_address_2}<br>`;
            if (item.mailing_street) item.mail_contact += `${item.mailing_street}<br>`;
            item.mail_contact += `${item.mailing_city_state} ${item.mailing_zip}`;//  ${phoneNumber(item.properties.PRIMARY_PHONE)}<br><a target='_blank' href='mailto:${item.properties.PRIMARY_EMAIL}'>${item.properties.PRIMARY_EMAIL}</a>`;
          });
          this.opaPropertiesPublic = data;
          this.loadingOpaPropertiesPublic = false;
        } else {
          if (import.meta.env.VITE_DEBUG) console.warn('opaData - await resolved but HTTP status was not successful')
          this.loadingOpaPropertiesPublic = false;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('opaData - await never resolved, failed to fetch address data')
        this.loadingOpaPropertiesPublic = false;
      }
    },
    async fillRcoDataByParcelBounds() {
      const GeocodeStore = useGeocodeStore();
      const ParcelsStore = useParcelsStore();
      let params = {
        'where': '1=1',
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'inSr': 4326,
        'returnGeometry': true,
        'spatialRel': 'esriSpatialRelIntersects',
      };
      let xyCoords;
      let xyCoordsReduced = [];
      
      if (ParcelsStore.pwd.features && ParcelsStore.pwd.features.length > 0) {
        xyCoords = ParcelsStore.pwd.features[0].geometry.coordinates[0];
        for (let i = 0; i < xyCoords.length; i++) {
        let newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
        xyCoordsReduced.push(newXyCoordReduced);
      }
        params.geometry = JSON.stringify({ "rings": [xyCoordsReduced], "spatialReference": { "wkid": 4326 }});
        params.geometryType = 'esriGeometryPolygon';
      } else if (GeocodeStore.aisData.features && GeocodeStore.aisData.features.length > 0) {
        xyCoords = [GeocodeStore.aisData.features[0].geometry.coordinates];
        for (let i = 0; i < xyCoords.length; i++) {
          let newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        }
        params.geometry = JSON.stringify({ "x": xyCoordsReduced[0][0], "y": xyCoordsReduced[0][1], "spatialReference": { "wkid": 4326 }});
        params.geometryType = 'esriGeometryPoint';
      }

      if (import.meta.env.VITE_DEBUG) console.log('fillRcoDataByParcelBounds, xyCoordsReduced:', xyCoordsReduced);
      const MainStore = useMainStore();
      try {
        const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Zoning_RCO/FeatureServer/0/query`, { params });
        if (response.status !== 200) {
          if (import.meta.env.VITE_DEBUG) console.warn('fillRcoDataByParcelBounds - await resolved but HTTP status was not successful')
        }
        if (response.data.features.length > 0) {
          let data = await response.data;

          data.features.sort((a, b) => {
            if (a.properties.ORGANIZATION_NAME < b.properties.ORGANIZATION_NAME) {
              return -1;
            }
            if (a.properties.ORGANIZATION_NAME > b.properties.ORGANIZATION_NAME) {
              return 1;
            }
            return 0;
          });
          // if (import.meta.env.VITE_DEBUG) console.log('data:', data);
          data.features.forEach(item => {
            // if (import.meta.env.VITE_DEBUG) console.log('item:', item);
            item.properties.rco = `<b>${item.properties.ORGANIZATION_NAME}</b><br>${item.properties.ORGANIZATION_ADDRESS}`;
            item.properties.contact = `${rcoPrimaryContact(item.properties.PRIMARY_NAME)}<br>${phoneNumber(item.properties.PRIMARY_PHONE)}<br><a target='_blank' href='mailto:${item.properties.PRIMARY_EMAIL}'>${item.properties.PRIMARY_EMAIL}</a>`;
            if (item.properties.MEETING_LOCATION_ADDRESS && item.properties.MEETING_LOCATION_ADDRESS.includes('Virtual: ')) {
              item.properties.meeting_address = item.properties.MEETING_LOCATION_ADDRESS.split('Virtual: ')[0] + `Virtual: <a target="_blank" href="${item.properties.MEETING_LOCATION_ADDRESS.split('Virtual: ')[1]}">${item.properties.MEETING_LOCATION_ADDRESS.split('Virtual: ')[1]}</a>`;
            } else {
              item.properties.meeting_address = item.properties.MEETING_LOCATION_ADDRESS;
            }

          })
          this.rcos = data;
          this.loadingRcos = false;
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('in else');
          this.rcos = {};
          this.loadingRcos = false;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error(`fillRcoDataByParcelBounds await never resolved, failed to fetch pwd parcel data by lng/lat`)
        this.rcos = {};
        this.loadingRcos = false;
      }
    },
    async mergePwdParcels() {
      let parcelsArray = [];
      if (!this.pwdParcelsByBlock.features) {
        parcelsArray = this.pwdParcelsByBuffer.features;
      } else {
        let parcelsSet = new Set([...this.pwdParcelsByBlock.features, ...this.pwdParcelsByBuffer.features]);
        parcelsArray = [...parcelsSet];
      }
      if (import.meta.env.VITE_DEBUG) console.log('parcelsArray:', parcelsArray);
      if (parcelsArray.length > 0) {
        this.pwdParcelsMerged = { type: 'FeatureCollection', features: parcelsArray };
      } else {
        this.pwdParcelsMerged = { type: 'FeatureCollection', features: [] };
      }
      this.loadingPwdParcelsMerged = false;
    },
    async fillPwdParcelDataByBlock() {
      const GeocodeStore = useGeocodeStore();
      const block = GeocodeStore.aisBlockData;
      if (import.meta.env.VITE_DEBUG) console.log('block:', block);
      if (!block.features) return;
      const blockPwd = block.features.filter((feature) => feature.properties.pwd_parcel_id);
      const parcelIds = blockPwd.map((feature) => feature.properties.pwd_parcel_id).join("','");
      let params = {
        'where': `parcel_id in ('${parcelIds}')`,
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'inSr': 4326,
        'returnGeometry': true,
      };
      if (import.meta.env.VITE_DEBUG) console.log('parcelIds:', parcelIds);
      try {
        const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS_TEST/FeatureServer/0/query`, { params });
        if (response.status !== 200) {
          if (import.meta.env.VITE_DEBUG) console.warn('fillPwdParcelDataByBlock - await resolved but HTTP status was not successful')
        }
        if (response.data.features.length > 0) {
          let data = await response.data;
          this.pwdParcelsByBlock = data;
          this.loadingPwdParcelsByBlock = false;
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('in else');
          this.pwdParcelsByBlock = {};
          this.loadingPwdParcelsByBlock = false;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error(`fillPwdParcelDataByBlock await never resolved, failed to fetch pwd parcel data by lng/lat`)
        this.pwdParcelsByBlock = {};
        this.loadingPwdParcelsByBlock = false;
      }
    },
    async fillPwdParcelDataByBuffer() {
      const MapStore = useMapStore();
      const buffer = MapStore.bufferForParcel;
      const xyCoords = buffer.geometry.coordinates[0];
      if (import.meta.env.VITE_DEBUG) console.log('fillPwdParcelDataByBuffer xyCoords:', xyCoords, 'xyCoords.length:', xyCoords.length);
      // const xyCoordsReduced = xyCoords;
      let xyCoordsReduced = [];
      // let xyCoordsReduced = [[ parseFloat(xyCoords[0][0].toFixed(9)), parseFloat(xyCoords[0][1].toFixed(9)) ]];
      // var i;

      for (let i = 0; i < xyCoords.length; i++) {
        let newXyCoordReduced;
        if (xyCoords.length > 20 && i%3 == 0) {
          if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'xyCoords.length:', xyCoords.length, 'i%3:', i%3);
          newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        } else if (xyCoords.length <= 20) {
          if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'xyCoords[i]:', xyCoords[i]);
          newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        }
      }
      // xyCoordsReduced.push([ parseFloat(xyCoords[0][0].toFixed(9)), parseFloat(xyCoords[0][1].toFixed(9)) ]);

      if (import.meta.env.VITE_DEBUG) console.log('fillPwdParcelDataByBuffer xyCoordsReduced:', xyCoordsReduced, 'MapStore.bufferForParcel.geometry:', MapStore.bufferForParcel.geometry);
      let params = {
        'where': '1=1',
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'inSr': 4326,
        'returnGeometry': true,
        'geometry': JSON.stringify({ "rings": [xyCoordsReduced], "spatialReference": { "wkid": 4326 }}),
        'geometryType': 'esriGeometryPolygon',
        'spatialRel': 'esriSpatialRelIntersects',
        // 'spatialRel': 'esriSpatialRelIntersects',
      };
      const MainStore = useMainStore();
      try {
        const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS_TEST/FeatureServer/0/query`, { params });
        if (response.status !== 200) {
          if (import.meta.env.VITE_DEBUG) console.warn('fillPwdParcelDataByBuffer - await resolved but HTTP status was not successful')
        }
        if (response.data.features.length > 0) {
          let data = await response.data;
          this.pwdParcelsByBuffer = data;
          this.loadingPwdParcelsByBuffer = false;
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('in else');
          this.pwdParcelsByBuffer = {};
          this.loadingPwdParcelsByBuffer = false;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error(`fillPwdParcelDataByBuffer await never resolved, failed to fetch pwd parcel data by lng/lat`)
        this.pwdParcelsByBuffer = {};
        this.loadingPwdParcelsByBuffer = false;
      }
    },
  },
})