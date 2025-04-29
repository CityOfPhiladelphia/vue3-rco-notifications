import { ref } from 'vue';

export default function useTables() {

  const paginationOptions = (tableLength, perPage) => {
    if (import.meta.env.VITE_DEBUG) console.log('paginationOptions, tableLength', tableLength);
    return {
      enabled: tableLength > 5,
      mode: 'pages',
      perPage: perPage,
      position: 'top',
      dropdownAllowAll: false,
      nextLabel: '',
      prevLabel: '',
      rowsPerPageLabel: '# rows',
      ofLabel: 'of',
      pageLabel: 'page', // for 'pages' mode
      allLabel: 'All',
    }
  };

  return {
    paginationOptions,
  }

}