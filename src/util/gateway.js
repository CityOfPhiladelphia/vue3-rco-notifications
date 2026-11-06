// the app's client id for the phila.gov API gateway - one id covers databridge-api and
// AIS search. Only the local dev server sends it: the gateway recognizes the deployed
// origin (www.phila.gov) itself and can't do that for localhost, which every app shares.
// Undefined in any build, so call sites omit the client_id param entirely
export const GATEWAY_CLIENT_ID = import.meta.env.DEV ? import.meta.env.VITE_GATEWAY_CLIENT_ID : undefined;
