import { GATEWAY_CLIENT_ID } from '@/util/gateway.js';

// AIS /search on the phila.gov API gateway. Ported from vue3-atlas src/util/ais.js
const AIS_URL = 'https://api-prod.phila.gov/ais/v1';

function buildFlags(flags) {
  const params = new URLSearchParams();
  if (flags.includeUnits) {
    params.set('include_units', 'true');
  }
  if (flags.opaOnly) {
    params.set('opa_only', 'true');
  }
  if (flags.page) {
    params.set('page', flags.page);
  }
  return params;
}

// AIS /search. Returns the parsed response, or null when AIS has no match for
// the query (a 404 is an answer, not a failure).
export async function fetchAisSearch(query, flags = {}) {
  const encoded = encodeURIComponent(query);
  const params = buildFlags(flags);
  if (GATEWAY_CLIENT_ID) {
    params.set('client_id', GATEWAY_CLIENT_ID);
  }
  // partitions the gateway's response cache by origin: ais-v1 echoes the request
  // Origin into Access-Control-Allow-Origin, but its cache ignores the Vary: Origin
  // it declares - an entry cached for one origin CORS-blocks every other origin for
  // the cache TTL (~1h). remove when the gateway CORS policy is origin-independent
  params.set('cache_origin', location.hostname);
  const response = await fetch(`${AIS_URL}/search/${encoded}?${params}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

// the phrase AIS /search reads as a block query ("1200 block MARKET ST") for the
// hundred-block containing an address. The gateway's AIS has no separate /block/
// endpoint; its /search runs a block search when the phrase carries the word "block"
export function blockPhrase(addressLow, streetFull) {
  const hundredBlock = Math.floor(addressLow / 100) * 100;
  return `${hundredBlock} block ${streetFull}`;
}
