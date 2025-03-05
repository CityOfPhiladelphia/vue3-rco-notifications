<script setup>
if (import.meta.env.VITE_DEBUG == 'true') console.log('App.vue setup is running in debug mode');

import isMobileDevice from './util/is-mobile-device';
import isMac from './util/is-mac'; // this can probably be removed from App.vue, and only run in main.js

import i18nFromFiles from './i18n/i18n.js';
const languages = i18nFromFiles.i18n.languages;

// STORES
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();

if (!import.meta.env.VITE_PUBLICPATH) {
  MainStore.publicPath = '/';
} else {
  MainStore.publicPath = import.meta.env.VITE_PUBLICPATH;
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_PUBLICPATH:', import.meta.env.VITE_PUBLICPATH, 'MainStore.publicPath:', MainStore.publicPath);

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { onMounted, computed, getCurrentInstance, watch } from 'vue';

// COMPONENTS
import LeftPanel from '@/components/LeftPanel.vue';
import MapPanel from '@/components/MapPanel.vue';

const instance = getCurrentInstance();
// if (import.meta.env.VITE_DEBUG == 'true') console.log('instance:', instance);
const locale = computed(() => instance.appContext.config.globalProperties.$i18n.locale);
// if (import.meta.env.VITE_DEBUG == 'true') console.log('locale:', locale);

onMounted(async () => {
  // MainStore.appVersion = import.meta.env.VITE_VERSION;
  MainStore.isMobileDevice = isMobileDevice();
  MainStore.isMac = isMac();
  await router.isReady()
  if (import.meta.env.VITE_DEBUG == 'true') console.log('App onMounted, route.params.address:', route.params.address);
  if (route.name === 'not-found') {
    router.push({ name: 'home' });
  }

  const main = document.getElementById('main');
  main.scrollTop = -main.scrollHeight;

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();
});

const footerLinks = [
  {
    type: 'native',
    href: 'https://phila.formstack.com/forms/atlas_feedback_form',
    text: 'Feedback',
    target: '_blank',
  },
];

const handleWindowResize = () => {
  console.log('handleWindowResize');
  const rootElement = document.getElementById('app');
  const rootStyle = window.getComputedStyle(rootElement);
  const rootWidth = rootStyle.getPropertyValue('width');
  const rootHeight = rootStyle.getPropertyValue('height');
  const rootWidthNum = parseInt(rootWidth.replace('px', ''));
  const rootHeightNum = parseInt(rootHeight.replace('px', ''));

  const dim = {
    width: rootWidthNum,
    height: rootHeightNum,
  };
  MainStore.windowDimensions = dim;

  let header = document.querySelector("#app-header");
  let headerOffsetHeight = header.offsetHeight;
  // console.log('rootHeightNum:', rootHeightNum, 'headerOffsetHeight:', headerOffsetHeight);

  let topicsHolder = document.querySelector("#topics-holder-widescreen");
  topicsHolder.style.setProperty('height', `${rootHeightNum - headerOffsetHeight - 44}px`);
}

const fullScreenTopicsEnabled = computed(() => {
  return MainStore.fullScreenTopicsEnabled;
});

const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
});

watch(
  () => MainStore.currentLang,
  (newLang, oldLang) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch MainStore.currentLang:', newLang, oldLang, 'locale.value:', locale.value);
    if (newLang != locale.value) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('setting locale:', newLang);
      // const instance = getCurrentInstance();
      if (import.meta.env.VITE_DEBUG == 'true') console.log('instance:', instance);
      if (instance) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('instance:', instance);
        if (newLang) {
          instance.appContext.config.globalProperties.$i18n.locale = newLang;
        } else {
          instance.appContext.config.globalProperties.$i18n.locale = 'en-US';
        }
      }
    }
  }
)

watch(
  () => locale.value,
  (newLocale, oldLocale) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch locale:', newLocale, oldLocale);
    let startQuery = { ...route.query };
    if (newLocale === MainStore.currentLang) {
      return;
    } else if (newLocale && newLocale != 'en-US') {
      MainStore.currentLang = newLocale;
      router.push({ query: { ...startQuery, 'lang': newLocale }});
    } else {
      MainStore.currentLang = null;
      delete startQuery['lang'];
      router.push({ query: { ...startQuery }});
    }
  }
)

watch(
  () => MainStore.pageTitle,
  (newPageTitle) => {
    document.title = newPageTitle;
  }
)
const appTitle = computed(() => {
  return 'RCO Notifications for Zoning Applications';
})

const navLinks1 = {
  button: "Instructions", //trigger
  links: [
    {
      type: 'native',
      href: "https://www.phila.gov/media/20230928121817/PCPC.RCO-Notice_-Instructions-for-Applicants-Appellants.pdf",
      text: "Instructions for Applicants",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20230928121724/PCPC.RCO-Notice_-Instructions-for-RCOs.pdf",
      text: "Instructions for RCOs",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20201210150923/PCPC.RCO_.APPLICANT-NOTIFICATION_TEMPLATES.pdf",
      text: "Template for Applicants (.PDF)",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20201210150858/PCPC.RCO_.APPLICANT-NOTIFICATION_TEMPLATES.docx",
      text: "Template for Applicants (.DOCX)",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20190816134749/Meeting_Summary_Template.pdf",
      text: "Meeting Summary Form for RCOs",
      target: '_blank',
    }
  ]
}

const navLinks2 = {
  button: "Contact Lists", //trigger
  links: [
    {
      type: 'native',
      href: "https://www.phila.gov/media/20240813132724/PCPC-City-Council-RCO-Contacts-8.13.24.pdf",
      text: "Council Contacts",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20240828084407/PCPC.Accepted-RCOs.8.28.24.pdf",
      text: "List of RCOs",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://openmaps.phila.gov/",
      text: "Map of RCOs",
      target: '_blank',
    },
  ]
}

const navLinks3 = {
  button: "Legislation & Regulation", //trigger
  links: [
    {
      type: 'native',
      href: "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-288947",
      text: "Philadelphia City Code (§ 14-303, Subsections (11A) and (12))",
      target: '_blank',
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20230317091911/March-2023-PCPC-Regulations.pdf",
      text: "PCPC Regulations (Section 12)",
      target: "_blank",
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20190816135120/Applicant-Rights-and-Responsibilities.pdf",
      text: "Applicant Rights and Responsibilities",
      target: "_blank",
    },
    {
      type: 'native',
      href: "https://www.phila.gov/media/20190417143814/RCO-Rights-and-Responsibilities-5.pdf",
      text: "RCO Rights and Responsibilities",
      target: "_blank",
    },
  ]
}

const mobileNavLinks = navLinks1.links.concat(navLinks2.links, navLinks3.links, footerLinks);

</script>

<template>
  <a
    href="#main"
    class="skip-to-main-content-link"
  >Skip to main content</a>

  <app-header
    :app-title="appTitle"
    app-link="/"
    :is-sticky="true"
    :is-fluid="true"
  >

    <template #dropdown-nav>
      <dropdown-nav :nav="navLinks1" />
      <dropdown-nav :nav="navLinks2" />
      <dropdown-nav :nav="navLinks3" />
    </template>

    <template #mobile-nav>
      <mobile-nav :links="mobileNavLinks" />
    </template>
    
  </app-header>

  <!-- MAIN CONTENT -->
  <main
    id="main"
    class="main invisible-scrollbar"
  >
    <!-- TOPIC PANEL ON LEFT -->
    <div
      v-if="!MainStore.isMobileDevice && MainStore.windowDimensions.width > 768 && !fullScreenMapEnabled"
      id="topics-holder-widescreen"
      class="topics-holder"
      :class="fullScreenTopicsEnabled ? 'topics-holder-full' : ''"
    >
      <left-panel />
    </div>

    <!-- MAP PANEL ON RIGHT - right now only contains the address input -->
    <div
      v-show="!fullScreenTopicsEnabled"
      class="map-panel-holder"
      :class="fullScreenMapEnabled ? 'topics-holder-full' : ''"
    >
      <map-panel />
    </div>

    <div
      v-if="MainStore.isMobileDevice || MainStore.windowDimensions.width <= 768"
      id="topics-holder-mobile"
      class="topics-holder"
    >
      <left-panel />
    </div>
  </main>

  <!-- FOOTER -->
  <app-footer
    :is-sticky="true"
    :is-hidden-mobile="true"
    :links="footerLinks"
  />
</template>

<style>



</style>