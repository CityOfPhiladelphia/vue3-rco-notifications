<script setup>

import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const GeocodeStore = useGeocodeStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const MainStore = useMainStore();
import { useRcoParcelsStore } from '@/stores/RcoParcelsStore.js'
const RcoParcelsStore = useRcoParcelsStore();

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

import FullScreenTopicsToggleTab from '@/components/FullScreenTopicsToggleTab.vue';
import AddressSearchControl from '@/components/AddressSearchControl.vue';

import RCOIntro from '@/components/intros/RCOIntro.vue';

import { useRoute } from 'vue-router';

const version = import.meta.env.VITE_VERSION;

const route = useRoute();

const address = computed(() => MainStore.currentAddress);
const dataSourcesLoadedArray = computed(() => MainStore.dataSourcesLoadedArray);

const zipCode = computed(() => {
  if (GeocodeStore.aisData && GeocodeStore.aisData.features) {
    return GeocodeStore.aisData.features[0].properties.zip_code + '-' + GeocodeStore.aisData.features[0].properties.zip_4;
  }
  return '';
});

const addressesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Address',
        field: 'address',
        filterable: true,
        sortable: true,
      },
      {
        label: 'RCO',
        field: 'rco',
        filterable: true,
        sortable: true,
      },
      {
        label: 'Civic Association',
        field: 'civic_association',
        filterable: true,
        sortable: true,
      },
      {
        label: 'Ward',
        field: 'ward',
        filterable: true,
        sortable: true,
      },
      {
        label: 'Division',
        field: 'division',
        filterable: true,
        sortable: true,
      },
    ],
    rows: RcoParcelsStore.opaPropertiesPublic.rows,
  }
});

</script>

<template>
  <full-screen-topics-toggle-tab
    v-show="!MainStore.fullScreenMapEnabled"
  />
      
  <!-- FRONT PAGE CONTENT -->
  <RCOIntro v-if="route.name == 'home'" />

  <!-- ADDRESS NOT FOUND CONTENT -->
  <div
    v-if="route.name == 'not-found'"
    id="topic-panel-no-topics"
    class="section"
  >
    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
    <div :class="MainStore.fullScreenTopicsEnabled ? 'topic-panel-half': ''">
      <h1 class="subtitle is-3">We couldn't find that address.</h1>
      <p class="subtitle is-4">Are you sure everything was spelled correctly?</p>
      <p>Here are some examples of things you can search for:</p>
      <ul class="bullet-list">
        <li>1234 Market St</li>
        <li>1001 Pine Street #201</li>
        <li>12th & Market</li>
        <li>883309050 (an OPA number with no hyphens or other characters)</li>
        <li>001S070144 (a DOR number with no hyphens of other characters)</li>
      </ul>
    </div>
  </div>

  <!-- IF AN ADDRESS IS LOADED, SHOW THE DATA  -->
  <div
    v-if="route.name !== 'home' && route.name !== 'not-found' && address"
    class="address-holder"
  >
    <div>
      <h1 class="address-and-marker subtitle is-3">
        <font-awesome-icon :icon="['fas', 'map-marker-alt']" /><div class="address">
          {{ address }}
        </div>
      </h1>
    </div>
    <div>PHILADELPHIA, PA {{ zipCode }}</div>

    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
  </div>

  <vue-good-table
    v-if="route.name !== 'home' && route.name !== 'not-found' && addressesTableData.rows.length > 0"
    id="addresses"
    :columns="addressesTableData.columns"
    :rows="addressesTableData.rows"
    :pagination-options="paginationOptions(addressesTableData.rows.length)"
    style-class="table"
  >
    <template #emptystate>
      <div v-if="RcoParcelsStore.loadingRcoParcels">
        Loading addresses... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </div>
      <div v-else>
        No addresses found for the selected building
      </div>
    </template>
    <template #pagination-top="props">
      <custom-pagination-labels
        :mode="'pages'"
        :total="props.total"
        :perPage="5"
        @page-changed="props.pageChanged"
        @per-page-changed="props.perPageChanged"
      >
      </custom-pagination-labels>
    </template>
  </vue-good-table>

</template>

<style>

.address-and-marker {
  margin-top: .5rem !important;
  margin-bottom: 0px !important;
}

</style>