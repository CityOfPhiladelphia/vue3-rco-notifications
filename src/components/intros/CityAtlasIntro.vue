<script setup>

import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import AddressSearchControl from '@/components/AddressSearchControl.vue';

</script>

<template>
  <div
    id="topic-panel-no-topics"
    class="section"
  >
    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
    <div :class="MainStore.fullScreenTopicsEnabled ? 'topic-panel-half': ''">
      <h1 class="subtitle is-3">
        CityAtlas connects you with information about any address in the city.
      </h1>
      <p class="subtitle is-4">
        Here are some things you can do with CityAtlas:
      </p>
      <ul class="bullet-list">
        <li>Research real estate information including property values, zoning, and document archives</li>
        <li>Get the history of permits, licenses, and inspections at any address</li>
        <li>Easily access high-resolution street-level and aerial imagery</li>
        <li>View activity around an address, including vacancy, crime, 311 service requests, and more</li>
        <li>Explore historical imagery and maps</li>
      </ul>
      <br>
      <p>To get started, click anywhere on the map, or type an address, intersection, property assessment account number, or Department of Records Map Registry number into the search box.</p>
    </div>
  </div>
</template>