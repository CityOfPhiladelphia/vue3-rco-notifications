import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import $config from '@/config';

import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useParcelsStore } from '@/stores/ParcelsStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import { useMapStore } from '@/stores/MapStore.js'
import { useRcoParcelsStore } from '@/stores/RcoParcelsStore';

import { useCondosStore } from '@/stores/CondosStore.js'

import useRouting from '@/composables/useRouting';
const { routeApp } = useRouting();

// this runs on address search and as part of datafetch()
const clearStoreData = async() => {
  if (import.meta.env.VITE_DEBUG) console.log('clearStoreData is running');
  const MainStore = useMainStore();
  MainStore.clearDataSourcesLoadedArray();

  // const ParcelsStore = useParcelsStore();
  // ParcelsStore.clearParcels();

  const MapStore = useMapStore();
  MapStore.clearBufferForParcel();

  const RcoParcelsStore = useRcoParcelsStore();
  RcoParcelsStore.clearAllPwdParcelsData();

  const CondosStore = useCondosStore();
  CondosStore.lastPageUsed = 1;
  CondosStore.condosData.pages = { page_1: { features: [] } };
}

const getGeocodeAndPutInStore = async(address) => {
  const GeocodeStore = useGeocodeStore();
  const ParcelsStore = useParcelsStore();
  const MainStore = useMainStore();
  await GeocodeStore.fillAisData(address);
  if (MainStore.lastSearchMethod == 'address' && !GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    if (import.meta.env.VITE_DEBUG) console.log('getGeocodeAndPutInStore, calling not-found');
    ParcelsStore.clearParcels();
    return;
  } else if (!GeocodeStore.aisData.features) {
    ParcelsStore.clearParcels();
    return;
  }
  let currentAddress;
  if (GeocodeStore.aisData.features[0].properties.street_address) {
    currentAddress = GeocodeStore.aisData.features[0].properties.street_address;
  } else if (GeocodeStore.aisData.features[0].street_address) {
    currentAddress = GeocodeStore.aisData.features[0].street_address;
  }
  MainStore.setCurrentAddress(currentAddress);
}

// this ONLY runs on map click
const getParcelsAndPutInStore = async(lng, lat) => {
  if (import.meta.env.VITE_DEBUG) console.log('getParcelsAndPutInStore is running');
  const MainStore = useMainStore();
  const ParcelsStore = useParcelsStore();
  let parcelLayer = 'pwd';
  await ParcelsStore.checkParcelDataByLngLat(lng, lat, 'pwd');
  await ParcelsStore.checkParcelDataByLngLat(lng, lat, 'dor');
  if (parcelLayer === 'dor' && !Object.keys(ParcelsStore.dorChecked).length) {
    return;
  } else if (parcelLayer === 'pwd' && !Object.keys(ParcelsStore.pwdChecked).length) {
    return;
  }
  ParcelsStore.pwd = ParcelsStore.pwdChecked;
  ParcelsStore.dor = ParcelsStore.dorChecked;

  // collects 4 things to attempt to geocode from the parcels clicked
  const otherParcelLayer = parcelLayer === 'pwd' ? 'dor' : 'pwd';
  const addressField = parcelLayer === 'pwd' ? 'ADDRESS' : 'ADDR_SOURCE';
  const otherAddressField = otherParcelLayer === 'pwd' ? 'ADDRESS' : 'ADDR_SOURCE';
  const geocodeParameterField = parcelLayer === 'pwd' ? 'PARCELID' : 'MAPREG';
  const otherGeocodeParameterField = otherParcelLayer === 'pwd' ? 'PARCELID' : 'MAPREG';
  
  // if (import.meta.env.VITE_DEBUG) console.log('parcelLayer:', parcelLayer);
  if (ParcelsStore[parcelLayer].features) {
    MainStore.currentParcelAddress = ParcelsStore[parcelLayer].features[0].properties[addressField];
    MainStore.currentParcelGeocodeParameter = ParcelsStore[parcelLayer].features[0].properties[geocodeParameterField]
  }
  if (ParcelsStore[otherParcelLayer].features) {
    MainStore.otherParcelAddress = ParcelsStore[otherParcelLayer].features[0].properties[otherAddressField];
    MainStore.otherParcelGeocodeParameter = ParcelsStore[otherParcelLayer].features[0].properties[otherGeocodeParameterField]
  }
}

// it should only show an address at the top that has been found in AIS for the top line address, so, if map clicked, it
// goes through all of the clicked parcel info, running it against AIS until it gets a match
const checkParcelInAis = async() => {
  // if (import.meta.env.VITE_DEBUG) console.log('checkParcelInAis starting');
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.checkAisData(MainStore.currentParcelGeocodeParameter);
  if (GeocodeStore.aisDataChecked.features) {
    MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
  } else {
    // if (import.meta.env.VITE_DEBUG) console.log('checkParcelInAis, noAisData currentParcelGeocodeParameter');
    await GeocodeStore.checkAisData(MainStore.otherParcelGeocodeParameter);
    if (GeocodeStore.aisDataChecked.features) {
      MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
    } else {
      // if (import.meta.env.VITE_DEBUG) console.log('checkParcelInAis, noAisData otherParcelGeocodeParameter');
      await GeocodeStore.checkAisData(MainStore.currentParcelAddress);
      if (GeocodeStore.aisDataChecked.features) {
        MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
      } else {
        // if (import.meta.env.VITE_DEBUG) console.log('checkParcelInAis, noAisData currentParcelAddress');
        await GeocodeStore.checkAisData(MainStore.otherParcelAddress);
        if (GeocodeStore.aisDataChecked.features) {
          MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
        } else {
          // if (import.meta.env.VITE_DEBUG) console.log('checkParcelInAis, noAisData otherParcelAddress');
        }
      }
    }
  }
}

// this is called on every route change, including address searches, initial app load, and back button clicks
// when it is called, it may have some of the data it needs already in the store (after a geocode), or it may need to fetch everything (e.g. initial app load)
const dataFetch = async(to, from) => {
  if (import.meta.env.VITE_DEBUG) console.log('dataFetch is starting, to:', to, 'from:', from, 'to.params.address:', to.params.address, 'from.params.address:', from.params.address);
  const MainStore = useMainStore();
  MainStore.datafetchRunning = true;
  const GeocodeStore = useGeocodeStore();
  const ParcelsStore = useParcelsStore();
  // const dataSourcesLoadedArray = MainStore.dataSourcesLoadedArray;
  if (to.name === 'not-found') {
    MainStore.datafetchRunning = false;
    return;
  }
  
  let address;
  if (to.params.address) { address = to.params.address } else if (to.query.address) { address = to.query.address }

  if (import.meta.env.VITE_DEBUG) console.log('address:', address, 'to.params.address:', to.params.address, 'from.params.address:', from.params.address, 'GeocodeStore.aisData.normalized:', GeocodeStore.aisData.normalized);
  
  let routeAddressChanged;
  if (from.params.address) {
    routeAddressChanged = to.params.address.trim() !== from.params.address.trim();
  } else {
    routeAddressChanged = to.params.address !== from.params.address;
  }

  // In the config, there is a list called "addressDoubles" of addresses we know of that are used by multiple properties.
  // An exception has to be made for them, in the case that someone clicks from one of them to the other.
  if ($config.addressDoubles.includes(address) || routeAddressChanged) {
    // if there is no geocode or the geocode does not match the address in the route, get the geocode
    if (!GeocodeStore.aisData.normalized || GeocodeStore.aisData.normalized && GeocodeStore.aisData.normalized !== address) {
      if (import.meta.env.VITE_DEBUG) console.log('in datafetch, routeAddressChanged:', routeAddressChanged, 'right before geocode, GeocodeStore.aisData:', GeocodeStore.aisData);
      await clearStoreData();
      if (GeocodeStore.aisDataChecked.features) {
        GeocodeStore.aisData = GeocodeStore.aisDataChecked;
        GeocodeStore.aisDataChecked = {};
      } else {
        await getGeocodeAndPutInStore(address);
      }
    }
    if (import.meta.env.VITE_DEBUG) console.log('in datafetch, after geocode, GeocodeStore.aisData:', GeocodeStore.aisData);

    await GeocodeStore.fillAisBlockData(address);

    // if this was NOT started by a map click, get the parcels
    if (MainStore.lastSearchMethod !== 'mapClick') {
      if (import.meta.env.VITE_DEBUG) console.log('dataFetch, inside if routeAddressChanged:', routeAddressChanged);
      await ParcelsStore.fillPwdParcelData();
      // await ParcelsStore.fillDorParcelData();
    }
  }
  
  // check for condos
  const CondosStore = useCondosStore();
  CondosStore.loadingCondosData = true;
  await CondosStore.fillCondoData(address);
  CondosStore.loadingCondosData = false;

  // buffer around the parcel
  const MapStore = useMapStore();
  await MapStore.fillBufferForParcel();

  // get neighboring parcels
  const RcoParcelsStore = useRcoParcelsStore();
  await RcoParcelsStore.fillRcoDataByParcelBounds();
  await RcoParcelsStore.fillPwdParcelDataByBlock();
  await RcoParcelsStore.fillPwdParcelDataByBuffer();
  await RcoParcelsStore.mergePwdParcels();
  await RcoParcelsStore.fillOpaPropertiesPublic();

  MainStore.lastSearchMethod = null;
  MainStore.datafetchRunning = false;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLICPATH),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/components/NotFound.vue')
    },
    {
      path: '/',
      name: 'home',
      component: App,
      props: true,
    },
    {
      path: '/:address',
      name: 'address',
      component: App,
    },
    {
      path: '/not-found',
      name: 'not-found',
      component: App,
    },
    {
      path: '/search',
      name: 'search',
      component: App,
      beforeEnter: async (to, from) => {
        const { address, lat, lng } = to.query;
        if (import.meta.env.VITE_DEBUG) console.log('search route beforeEnter, to.query:', to.query, 'from:', from, 'address:', address);
        const MainStore = useMainStore();
        const GeocodeStore = useGeocodeStore();
        const ParcelsStore = useParcelsStore();
        MainStore.addressSearchRunning = true;
        if (MainStore.datafetchRunning) {
          return false;
        } else if (address && address !== '') {
          if (import.meta.env.VITE_DEBUG) console.log('search route beforeEnter, address:', address);
          MainStore.setLastSearchMethod('address');
          await clearStoreData();
          await getGeocodeAndPutInStore(address);
          routeApp(router, to);
        } else if (lat && lng) {
          MainStore.setLastSearchMethod('mapClick');
          await getParcelsAndPutInStore(lng, lat);
          if (!Object.keys(ParcelsStore.pwdChecked).length && !Object.keys(ParcelsStore.dorChecked).length) {
            MainStore.addressSearchRunning = false;
            return false;
          }
          await checkParcelInAis();
          routeApp(router, to);
        } else {
          return false;
        }
      },
    }
  ]
})

router.afterEach(async (to, from) => {
  if (import.meta.env.VITE_DEBUG) console.log('router afterEach to:', to, 'from:', from);
  const MainStore = useMainStore();
  // if (to.query.lang !== from.query.lang) {
  //   MainStore.currentLang = to.query.lang;
  // }
  if (to.hash == '#information') {
    MainStore.showInformation = true;
  } else {
    MainStore.showInformation = false;
  }
  if (to.name !== 'not-found' && to.name !== 'search' && to.name !== 'home') {
    MainStore.addressSearchRunning = false;
    await dataFetch(to, from);
    let pageTitle = MainStore.appVersion;
    for (let param of Object.keys(to.params)) {
      pageTitle += ' | ' + to.params[param];
    }
    MainStore.pageTitle = pageTitle;
  } else if (to.name == 'not-found') {
    MainStore.currentAddress = null;
    MainStore.currentParcelGeocodeParameter = null;
    MainStore.currentParcelAddress = null;
    MainStore.otherParcelAddress = null;
    MainStore.otherParcelGeocodeParameter = null;
  }
});

export default router
