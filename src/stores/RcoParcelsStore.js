import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import { useMapStore } from '@/stores/MapStore.js'
import axios from 'axios';

export const useRcoParcelsStore = defineStore('RcoParcelsStore', {
  state: () => {
    return {
      rco: {},
      opaPropertiesPublic: {},
      units: {},
    };
  },
  actions: {
    evaluateDataForUnits(data) {
      var units = [], dataList = [];
      let groupedData = Object.groupBy(data.rows, a => a.pwd_parcel_id);
  
      for (let item in groupedData){
        groupedData[item].length > 1 ? units.push.apply(units,groupedData[item]) : dataList.push(groupedData[item][0]);
      }
      console.log('base-client evaluateDataForUnits data:', data, 'groupedData:', groupedData, 'units:', units, 'dataList:', dataList);
  
      let bldgRecord = JSON.parse(JSON.stringify(data.rows[0]));
  
      if(units.length > 0) {
        units = Object.groupBy(units, a => a.pwd_parcel_id);
        data.rows = data.rows.filter(a => !Object.keys(units).includes(a.pwd_parcel_id));
      }
  
      // for (let unit in units) {
      //   console.log('inside units loop, units:', units, 'units[unit]:', units[unit], 'typeof(units[unit]):', typeof(units[unit]));
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
        const opaSet = this.rco.features.map((feature) => feature.properties.PARCEL_ID).join("','");
        // const OpaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        // select * from opa_properties_public_pde where parcel_number IN("+ input +")";
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+pwd_parcel_id+in+(%27${opaSet}%27)`);
        // const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+parcel_number+in+(%27${opaSet}%27)`);
        // const response = await fetch(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(opaSet)}?opa_only=true&include_units=true`)
        if (response.ok) {
          let data = await response.json();
          // data = this.evaluateDataForUnits(data);
          this.opaPropertiesPublic = data;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('opaData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('opaData - await never resolved, failed to fetch address data')
      }
    },
    async fillRcoParcelDataByBuffer() {
      const MapStore = useMapStore();
      const buffer = MapStore.bufferForParcel;
      const xyCoords = buffer.geometry.coordinates[0];
      let xyCoordsReduced = [[ parseFloat(xyCoords[0][0].toFixed(6)), parseFloat(xyCoords[0][1].toFixed(6)) ]];
      var i;

      for (i = 0; i < xyCoords.length; i++) {
        if (i%3 == 0) {
          let newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        }
      }
      xyCoordsReduced.push([ parseFloat(xyCoords[0][0].toFixed(6)), parseFloat(xyCoords[0][1].toFixed(6)) ]);

      if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelDataByLngLat MapStore.bufferForParcel.geometry:', MapStore.bufferForParcel.geometry);
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
      };
      const MainStore = useMainStore();
      try {
        const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS/FeatureServer/0/query`, { params });
        if (response.status !== 200) {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillRcoParcelDataByBuffer - await resolved but HTTP status was not successful')
        }
        if (response.data.features.length > 0) {
          let data = await response.data;
          this.rco = data;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('in else');
          this.rco = {};
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error(`fillRcoParcelDataByBuffer await never resolved, failed to fetch pwd parcel data by lng/lat`)
        this.rco = {};
      }
    },
  },
})