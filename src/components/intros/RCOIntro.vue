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
      <div>
        The Philadelphia Zoning Code includes provisions to ensure that neighbors of proposed developments
        are notified and have an opportunity to provide input regarding zoning decisions that may impact
        them. This is accomplished through a system of notification and through notification to near
        neighbors and public meetings that are held in communities and convened by Registered Community
        Organizations (RCOs).<br /><br />
        This website is a tool to assist applicants with their Zoning Board of Adjustment (ZBA) community
        notification process as well as giving more information to community members and interested
        residents.
        <br><br>
        This tool provides four pieces of information:
        <br><br>
        <ol class="intro-list">
          <li>Addresses of near neighbors that need to be notified.</li>
          <li>Names and contact information for RCOs.</li>
          <li>Contact information for other entities, such as the local Council District, Zoning Board of
              Adjustment (ZBA) and Philadelphia City Planning Commission (PCPC) that need to be notified
              through this process.</li>
          <li>Templates for documents that applicants and RCOs are to use throughout this process.</li>
        </ol>
        <br><br>
        To complete the notification process per
        <a class="clickable"
            href="https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-205502#JD_14-303(11A)"
            target="_blank">Section 14-303(12) of the Philadelphia Code</a>,
        read the detailed instructions <a class="clickable"
            href="https://www.phila.gov/media/20190816134122/Applicant_Detailed_Instructions.pdf"
            target="_blank">here</a>, then click through to the map.
        To see these instructions again, click the “info” icon at the top right of the search box.
        <br /><br />
        For questions or comments, email <a class="clickable"
            href="mailto:RCO.Notification@phila.gov">RCO.Notification@phila.gov</a>.
      </div>
    </div>
  </div>
</template>