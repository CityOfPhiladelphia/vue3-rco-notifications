// the app's client id for the phila.gov API gateway - one id covers databridge-api and
// AIS search. Development-mode builds send it: the local dev server and the dev deploy
// (vite build --mode=development), whose origins the gateway does not recognize. The
// production build never does - the gateway recognizes www.phila.gov itself. Undefined
// there, so call sites omit the client_id param entirely
export const GATEWAY_CLIENT_ID = import.meta.env.MODE !== 'production' ? import.meta.env.VITE_GATEWAY_CLIENT_ID : undefined;
