<script setup>

import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const GeocodeStore = useGeocodeStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const MainStore = useMainStore();
import { useCondosStore } from '@/stores/CondosStore.js'
const CondosStore = useCondosStore();

import FullScreenTopicsToggleTab from '@/components/FullScreenTopicsToggleTab.vue';
import AddressSearchControl from '@/components/AddressSearchControl.vue';

import Topic from '@/components/Topic.vue';
import AtlasIntro from '@/components/intros/AtlasIntro.vue';
import CityAtlasIntro from '@/components/intros/CityAtlasIntro.vue';
import VotingIntro from '@/components/intros/VotingIntro.vue';
import Property from '@/components/topics/Property.vue';
import Condos from '@/components/topics/Condos.vue';
import Deeds from '@/components/topics/Deeds.vue';
import LI from '@/components/topics/LI.vue';
import Zoning from '@/components/topics/Zoning.vue';
import Voting from '@/components/topics/Voting.vue';
import NearbyActivity from '@/components/topics/nearbyActivity/NearbyActivity.vue';
import City311 from '@/components/topics/cityAtlas/City311.vue';
import Stormwater from '@/components/topics/cityAtlas/Stormwater.vue';
import Districts from '@/components/topics/cityAtlas/Districts.vue';

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

</script>

<template>
  <full-screen-topics-toggle-tab
    v-show="!MainStore.fullScreenMapEnabled"
  />
      
  <!-- FRONT PAGE CONTENT -->
  <CityAtlasIntro v-if="route.name == 'home' && version == 'cityatlas'" />
  <VotingIntro v-else-if="route.name == 'topic' && route.params.topic.toLowerCase() == 'voting'"/>
  <AtlasIntro v-else-if="route.name == 'home'" />

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

  <!-- IF AN ADDRESS IS LOADED, SHOW THE TOPICS  -->
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

</template>

<style>

.address-and-marker {
  margin-top: .5rem !important;
  margin-bottom: 0px !important;
}

</style>