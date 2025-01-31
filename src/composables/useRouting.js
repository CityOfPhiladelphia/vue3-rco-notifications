import { useMainStore } from '@/stores/MainStore';

export default function useRouting() {
  const routeApp = (router, route) => {
    
    const MainStore = useMainStore();
    let startQuery = { ...route.query };
    delete startQuery['address'];
    delete startQuery['lat'];
    delete startQuery['lng'];
    if (import.meta.env.VITE_DEBUG) console.log('routeApp, router:', router, 'route:', route, 'startQuery:', startQuery);
    if (MainStore.currentAddress) {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address because MainStore has address');
      router.push({ name: 'address', params: { address: MainStore.currentAddress }, query: { ...startQuery } });
    } else {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to not-found because no address or topic');
      MainStore.addressSearchRunning = false;
      router.push({ name: 'not-found', query: { ...startQuery } });
    }
  }
  return {
    routeApp
  }
}