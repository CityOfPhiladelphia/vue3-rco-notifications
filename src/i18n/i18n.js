
import en from './en-us';
import es from './es';

let i18n = {
  i18n: {
    enabled: true,
    banner: false,
    selector: true,
    topics: [ 'voting' ],
    languages: [
      {
        language: 'en-US',
        title: 'English',
      },
      {
        language: 'es',
        title: 'Español',
      },
    ],
    footer: true,
    data: {
      locale: 'en-US',
      messages: {
        'en-US': en,
        es: es,
      },
    },
  },
};

// console.log('atlas i18n.js, i18n:', i18n);

export default i18n;
