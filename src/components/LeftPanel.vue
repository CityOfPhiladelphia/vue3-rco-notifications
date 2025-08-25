<script setup>

import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const GeocodeStore = useGeocodeStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const MainStore = useMainStore();
import { useRcoParcelsStore } from '@/stores/RcoParcelsStore.js'
const RcoParcelsStore = useRcoParcelsStore();

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';

import FullScreenTopicsToggleTab from '@/components/FullScreenTopicsToggleTab.vue';
import AddressSearchControl from '@/components/AddressSearchControl.vue';

import RCOIntro from '@/components/intros/RCOIntro.vue';

import { useRoute } from 'vue-router';

import useScrolling from '@/composables/useScrolling';
const { handleRcoRowClick, handleParcelRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import * as bulmaToast from 'bulma-toast'

bulmaToast.setDefaults({
  position: 'top-center',
  type: 'is-success',
  dismissible: true,
  closeOnClick: true,
  zIndex: 9999,
});

const route = useRoute();
const address = computed(() => MainStore.currentAddress);
const hoveredStateAddress = computed(() => { return MainStore.hoveredStateAddress; });
const hoveredStateBuilding = computed(() => { return MainStore.hoveredStateBuilding; });

// RCOs
const rcosCompareFn = (a, b) => {
  if (a.organization_name < b.organization_name) {
    return -1;
  }
  if (a.organization_name > b.organization_name) {
    return 1;
  }
  return 0;
};
const rcos = computed(() => { if (RcoParcelsStore.rcos.features) return [ ...RcoParcelsStore.rcos.features ].sort(rcosCompareFn) });
const rcosLength = computed(() => rcos.value && rcos.value.length ? rcos.value.length : 0);
const rcoNames = computed(() => {
  if (rcos.value && rcos.value.length) {
    return rcos.value.map(item => item.properties.organization_name).join(', ');
  }
  return '';
});

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
        field: 'properties.meeting_location_address',
      },
      {
        label: 'Primary Contact',
        field: 'properties.contact',
        html: true,
      },
      {
        label: 'Preferred Method',
        field: 'properties.preffered_contact_method',
      },
    ],
    rows: rcos.value || [],
  }
});

const rcosTablePerPage = ref(5);

const rcosPaginationOptions = computed(() => {
  return {
    enabled: false,
    // enabled: rcosTableData.value.rows.length > 5,
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

const propertiesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Property',
        field: 'parcel_address',
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
  if (import.meta.env.VITE_DEBUG) console.log('perPageChanged is running, e.currentPerPage:', e.currentPerPage);
  propertiesTablePerPage.value = e.currentPerPage;
};

const copyRcos = () => {
  if (import.meta.env.VITE_DEBUG) console.log('copyRcos is running, rcoNames:', rcoNames.value);
  navigator.clipboard.writeText(rcoNames.value);
  bulmaToast.toast({
    message: `copied all RCO names to clipboard`,
    type: 'is-success',
  })
};

const exportRcos = () => {
  let csvContent = 'data:text/csv;charset=utf-8,Organization Name, Primary Email, Organization Address, Primary Name, Primary Address, Primary Phone\n';
  let encodedUri = encodeURI(csvContent);
  rcos.value.forEach(item => {
    let newCsvContent = '';
    if (item.properties.organization_name) newCsvContent += item.properties.organization_name.replaceAll(',', '');
    newCsvContent += ',';
    if (item.properties.primary_email) newCsvContent += item.properties.primary_email.replaceAll(',', '');
    newCsvContent += ',';
    if (item.properties.organization_address) newCsvContent += item.properties.organization_address.replaceAll(',', '');
    newCsvContent += ',';
    if (item.properties.primary_name) newCsvContent += item.properties.primary_name.replaceAll(',', '');
    newCsvContent += ',';
    if (item.properties.primary_address) newCsvContent += item.properties.primary_address.replaceAll(',', '');
    newCsvContent += ',';
    if (item.properties.primary_phone) newCsvContent += item.properties.primary_phone.replaceAll(',', '');
    let newEncodedUri = encodeURI(newCsvContent).replaceAll('%0D', ' ').replaceAll('%0A', '') + '%0D';
    encodedUri += newEncodedUri;
  });
  if (import.meta.env.VITE_DEBUG) console.log('csvContent:', csvContent, 'encodedUri:', encodedUri);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'rcos.csv');
  document.body.appendChild(link);
  link.click();
};

const exportProperties = () => {
  let csvContent = 'data:text/csv;charset=utf-8,ADDRESS, CITY, STATE, ZIP\n';
  let encodedUri = encodeURI(csvContent);
  opaProperties.value.forEach(item => {
    let newCsvContent = '';
    if (item.address_std) newCsvContent+=`${item.address_std.replaceAll(',', '').replaceAll('#', '')}, Philadelphia, PA, ${item.zip_code},`;
    let newEncodedUri = encodeURI(newCsvContent).replaceAll('%0D', ' ').replaceAll('%0A', '') + '%0D';
    if (import.meta.env.VITE_DEBUG) console.log('newCsvContent:', newCsvContent, 'newEncodedUri:', newEncodedUri);
    encodedUri += newEncodedUri;
  });
  // if (import.meta.env.VITE_DEBUG) console.log('encodedUri:', encodedUri);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'properties.csv');
  document.body.appendChild(link);
  link.click();
};

const councilDistrict = computed(() => {
  if (GeocodeStore.aisData && GeocodeStore.aisData.features) {
    return GeocodeStore.aisData.features[0].properties.council_district_2024;
  }
  return '';
});

const clickedRow = computed(() => {
  return MainStore.clickedRow;
})

watch(
  () => clickedRow.value,
  (newClickedRow) => {
    if (import.meta.env.VITE_DEBUG) console.log('watch clickedRow.value, newClickedRow:', newClickedRow);
    navigator.clipboard.writeText(newClickedRow.id);
    bulmaToast.toast({
    message: `copied "${newClickedRow.id}" to clipboard`,
    type: 'is-success',
  })
  }
)

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
      <div class="subject">
        SUBJECT: {{ address }}
      </div>
      <div>
        COUNCIL DISTRICT: {{ councilDistrict }}
      </div>
    </div>

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
        Affected RCOs
        <font-awesome-icon
          v-if="RcoParcelsStore.loadingRcos"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ rcosLength }})</span>
      </h2>
      <div
        class="horizontal-table"
      >
        <vue-good-table
          id="rcos"
          :columns="rcosTableData.columns"
          :rows="rcosTableData.rows"
          :pagination-options="rcosPaginationOptions"
          style-class="table rco-table"
          @row-click="handleRcoRowClick($event, 'organization_name', 'RCO')"
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
              class="button is-small is-primary copy-button"
              @click="copyRcos()"
            >
              Copy RCO Names
            </button>
            <button
              class="button is-small is-primary export-button"
              @click="exportRcos()"
            >
              Export RCOs
            </button>
          </template>

          <template #table-row="props">
            <span v-if="props.column.label == 'Meeting Address'">
              <div style="word-break: break-word" v-html="props.row.properties.meeting_address"></div> 
            </span>
          </template>

        </vue-good-table>
      </div>
    </div>

    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Properties to be notified
        <font-awesome-icon
          v-if="RcoParcelsStore.loadingOpaPropertiesPublic"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ opaPropertiesLength }})</span>
      </h2>
      <vue-good-table
        id="properties"
        :columns="propertiesTableData.columns"
        :rows="propertiesTableData.rows"
        :row-style-class="row => hoveredStateAddress === row.parcel_number ? 'active-hover ' + row.parcel_number : 'inactive ' + row.parcel_number"
        :pagination-options="propertiesPaginationOptions"
        style-class="table rco-table"
        @row-mouseenter="handleRowMouseover($event, 'pwd_parcel_id', 'parcel_number')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleParcelRowClick($event, 'pwd_parcel_id', 'pwdParcel')"
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

</template>

<style>

.subject {
  font-weight: bold;
  font-size: 1.2rem;
  /* margin-bottom: .25rem !important; */
}

.export-button, .copy-button {
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