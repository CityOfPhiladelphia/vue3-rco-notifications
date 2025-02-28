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

// RCOs
const rcosCompareFn = (a, b) => {
  if (a.ORGANIZATION_NAME < b.ORGANIZATION_NAME) {
    return -1;
  }
  if (a.ORGANIZATION_NAME > b.ORGANIZATION_NAME) {
    return 1;
  }
  return 0;
};
const rcos = computed(() => { if (RcoParcelsStore.rcos.features) return [ ...RcoParcelsStore.rcos.features ].sort(rcosCompareFn) });
const rcosLength = computed(() => rcos.value && rcos.value.length ? rcos.value.length : 0);


// RCO PARCELS
const rcoParcelsCompareFn = (a, b) => {
  if (a.address_std < b.address_std) {
    return -1;
  }
  if (a.address_std > b.address_std) {
    return 1;
  }
  return 0;
};
const opaProperties = computed(() => { if (RcoParcelsStore.opaPropertiesPublic.rows) return [ ...RcoParcelsStore.opaPropertiesPublic.rows ].sort(rcoParcelsCompareFn) });
const opaPropertiesLength = computed(() => opaProperties.value && opaProperties.value.length ? opaProperties.value.length : 0);

// const rcosTableData = computed(() => {
//   return {
//     columns: [
//       {
//         label: 'Organization Name',
//         field: 'properties.ORGANIZATION_NAME',
//         filterable: true,
//         sortable: true,
//       },
//       {
//         label: 'Email',
//         field: 'properties.PRIMARY_EMAIL',
//         filterable: true,
//         sortable: true,
//       },
//       {
//         label: 'Address',
//         field: 'properties.ORGANIZATION_ADDRESS',
//         filterable: true,
//         sortable: true,
//       },
//       {
//         label: 'Organization Name',
//         field: 'properties.PRIMARY_NAME',
//         filterable: true,
//         sortable: true,
//       },
//       {
//         label: 'Address',
//         field: 'properties.PRIMARY_ADDRESS',
//         filterable: true,
//         sortable: true,
//       },
//       {
//         label: 'Phone',
//         field: 'properties.PRIMARY_PHONE',
//         filterable: true,
//         sortable: true,
//       },
//     ],
//     rows: rcos.value,
//   }
// });

const rcosTableData = computed(() => {
  return {
    columns: [
      {
        label: 'RCO',
        field: 'properties.rco',
        html: true,
      },
      {
        label: 'Meeting Address',
        field: 'properties.MEETING_LOCATION_ADDRESS',
      },
      {
        label: 'Primary Contact',
        field: 'properties.contact',
        html: true,
      },
      {
        label: 'Preferred Method',
        field: 'properties.PREFFERED_CONTACT_METHOD',
      },
    ],
    rows: rcos.value || [],
  }
});

const propertiesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Address',
        field: 'parcel_address',
        html: true,
        // filterable: true,
        // sortable: true,
      },
      {
        label: 'Mailing Address',
        field: 'mail_contact',
        html: true,
      },
    ],
    rows: opaProperties.value || [],
  }
});

const exportRcos = () => {
  let csvContent = 'data:text/csv;charset=utf-8,Organization Name, Primary Email, Organization Address, Primary Name, Primary Address, Primary Phone\n';
  let encodedUri = encodeURI(csvContent);
  rcos.value.forEach(item => {
    let newCsvContent = '';
    newCsvContent += item.properties.ORGANIZATION_NAME.replaceAll(',', '') + ',';
    newCsvContent += item.properties.PRIMARY_EMAIL.replaceAll(',', '') + ',';
    newCsvContent += item.properties.ORGANIZATION_ADDRESS.replaceAll(',', '') + ',';
    newCsvContent += item.properties.PRIMARY_NAME.replaceAll(',', '') + ',';
    newCsvContent += item.properties.PRIMARY_ADDRESS.replaceAll(',', '') + ',';
    newCsvContent += item.properties.PRIMARY_PHONE.replaceAll(',', '');
    let newEncodedUri = encodeURI(newCsvContent).replaceAll('%0D', ' ').replaceAll('%0A', '') + '%0D';
    encodedUri += newEncodedUri;
  });
  console.log('csvContent:', csvContent, 'encodedUri:', encodedUri);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'rcos.csv');
  document.body.appendChild(link);
  link.click();
};

const exportProperties = () => {
  let csvContent = 'data:text/csv;charset=utf-8,Property, Contact Mailing Address\n';
  let encodedUri = encodeURI(csvContent);
  opaProperties.value.forEach(item => {
    let newCsvContent = '';
    newCsvContent+=`${item.address_std.replaceAll(',', '').replaceAll('#', '')} Philadelphia PA ${item.zip_code},`;
    if (item.mailing_care_of) newCsvContent+=`${item.mailing_care_of.replaceAll(',', '').replaceAll('#', '')} `;
    if (item.mailing_address_1) newCsvContent+=`${item.mailing_address_1.replaceAll(',', '').replaceAll('#', '')} `;
    if (item.mailing_address_2) newCsvContent+=`${item.mailing_address_2.replaceAll(',', '').replaceAll('#', '')} `;
    if (item.mailing_street) newCsvContent+=`${item.mailing_street.replaceAll(',', '').replaceAll('#', '')} `;
    newCsvContent+=`${item.mailing_city_state} ${item.mailing_zip}`;
    let newEncodedUri = encodeURI(newCsvContent).replaceAll('%0D', ' ').replaceAll('%0A', '') + '%0D';
    console.log('newCsvContent:', newCsvContent, 'newEncodedUri:', newEncodedUri);
    encodedUri += newEncodedUri;
  });
  // console.log('encodedUri:', encodedUri);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'properties.csv');
  document.body.appendChild(link);
  link.click();
}

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

  <div
    v-if="route.name !== 'home' && route.name !== 'not-found'"
    id="topic-panel-content"
    class="topics"
  >
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        RCOs
        <font-awesome-icon
          v-if="RcoParcelsStore.loadingRcos"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ rcosLength }})</span>
      </h2>
      <div
        v-if="rcosTableData.rows"
        class="horizontal-table"
      >
      <!-- v-if="route.name !== 'home' && route.name !== 'not-found' && propertiesTableData.rows && propertiesTableData.rows.length > 0" -->
        <vue-good-table
          id="properties"
          :columns="rcosTableData.columns"
          :rows="rcosTableData.rows"
          :pagination-options="paginationOptions(rcosTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="RcoParcelsStore.loadingRcos">
              Loading RCOs... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No RCOs found for the selected building
            </div>
          </template>

          <template #table-actions>
            <button
              class="button is-small is-primary"
              @click="exportRcos()"
            >
              Export RCOs
            </button>
          </template>

          <!-- <template #table-row="props">
            <span v-if="props.column.label == 'Address'">
              <span style="font-weight: bold; color: blue;">{{props.row.address_std}}</span> 
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template> -->

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
      </div>
    </div>

    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Properties
        <font-awesome-icon
          v-if="RcoParcelsStore.loadingOpaPropertiesPublic"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ rcoParcelsLength }})</span>
      </h2>
      <div
        v-if="propertiesTableData.rows"
        class="horizontal-table"
      >
      <!-- v-if="route.name !== 'home' && route.name !== 'not-found' && propertiesTableData.rows && propertiesTableData.rows.length > 0" -->
        <vue-good-table
          id="properties"
          :columns="propertiesTableData.columns"
          :rows="propertiesTableData.rows"
          :pagination-options="paginationOptions(propertiesTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="RcoParcelsStore.loadingOpaPropertiesPublic">
              Loading properties... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No properties found for the selected building
            </div>
          </template>

          <template #table-actions>
            <button
              class="button is-small is-primary"
              @click="exportProperties()"
            >
              Export Properties
            </button>
          </template>

          <!-- <template #table-row="props">
            <span v-if="props.column.label == 'Address'">
              <span style="font-weight: bold; color: blue;">{{props.row.address_std}}</span> 
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template> -->

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
      </div>
    </div>
  </div>

</template>

<style>

.address-and-marker {
  margin-top: .5rem !important;
  margin-bottom: 0px !important;
}

</style>