<script setup>

import { ref, computed } from 'vue';
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

const rcosTablePerPage = ref(5);

const rcosPaginationOptions = computed(() => {
  return {
    enabled: rcosTableData.value.rows.length > 5,
    mode: 'pages',
    perPage: rcosTablePerPage.value,
    position: 'top',
    dropdownAllowAll: false,
    nextLabel: '',
    prevLabel: '',
    rowsPerPageLabel: '# rows',
    ofLabel: 'of',
    pageLabel: 'page', // for 'pages' mode
    allLabel: 'All',
  }
});

const rcoPerPageChanged = (e) => {
  console.log('perPageChanged is running, e.currentPerPage:', e.currentPerPage);
  rcosTablePerPage.value = e.currentPerPage;
};

const propertiesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Property',
        field: 'parcel_address',
        html: true,
        // filterable: true,
        // sortable: true,
      },
      {
        label: 'Contact Mailing Address',
        field: 'mail_contact',
        html: true,
      },
    ],
    rows: opaProperties.value || [],
  }
});

const propertiesTablePerPage = ref(5);

const propertiesPaginationOptions = computed(() => {
  return {
    enabled: propertiesTableData.value.rows.length > 5,
    mode: 'pages',
    perPage: propertiesTablePerPage.value,
    position: 'top',
    dropdownAllowAll: false,
    nextLabel: '',
    prevLabel: '',
    rowsPerPageLabel: '# rows',
    ofLabel: 'of',
    pageLabel: 'page', // for 'pages' mode
    allLabel: 'All',
  }
});

const propertiesPerPageChanged = (e) => {
  console.log('perPageChanged is running, e.currentPerPage:', e.currentPerPage);
  propertiesTablePerPage.value = e.currentPerPage;
};

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
};

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
    v-show="route.name !== 'home' && route.name !== 'not-found' && address"
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
    v-show="route.name !== 'home' && route.name !== 'not-found'"
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
      <!-- v-show="rcosTableData.rows" -->
      <div
        class="horizontal-table"
      >
      <!-- v-if="route.name !== 'home' && route.name !== 'not-found' && propertiesTableData.rows && propertiesTableData.rows.length > 0" -->
        <vue-good-table
          id="rcos"
          :columns="rcosTableData.columns"
          :rows="rcosTableData.rows"
          :pagination-options="rcosPaginationOptions"
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
              class="button is-small is-primary export-button"
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
              :test="function() { console.log('test, props:', props); }()"
              :mode="'pages'"
              :total="props.total"
              :perPage="rcosTablePerPage"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
              @per-page-changed-left-panel="rcoPerPageChanged"
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
        <span v-else>({{ opaPropertiesLength }})</span>
      </h2>
      <div
        v-show="propertiesTableData.rows"
        class="horizontal-table"
      >
      <!-- v-if="route.name !== 'home' && route.name !== 'not-found' && propertiesTableData.rows && propertiesTableData.rows.length > 0" -->
        <vue-good-table
          id="properties"
          :columns="propertiesTableData.columns"
          :rows="propertiesTableData.rows"
          :pagination-options="propertiesPaginationOptions"
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
              class="button is-small is-primary export-button"
              @click="exportProperties()"
            >
              Export Properties
            </button>
          </template>

          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :perPage="propertiesTablePerPage"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
              @per-page-changed-left-panel="propertiesPerPageChanged"
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

.export-button {
  margin-right: 1rem;
}


@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px) {

  #rcos {
    td:nth-of-type(2) {
      min-height: 60px;
    }
    td:nth-of-type(4) {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "RCO"; }
    td:nth-of-type(2):before { content: "Meeting Address"; }
    td:nth-of-type(3):before { content: "Primary Contact"; }
    td:nth-of-type(4):before { content: "Preferred Method"; }
  }

  #properties {
    td:nth-of-type(2) {
      min-height: 80px;
    }

    td:nth-of-type(1):before { content: "Property"; }
    td:nth-of-type(2):before { content: "Contact Mailing Address"; }
  }

}

</style>