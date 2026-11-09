import { GATEWAY_CLIENT_ID } from '@/util/gateway.js';

// databridge-api on the phila.gov API gateway, called directly with its table-style
// query (table / where / fields / limit). Ported from vue3-atlas src/util/databridge.js
export const DATABRIDGE_URL = 'https://api-prod.phila.gov/databridge-api/v1/get';

// the gateway rejects any URL longer than ~2,100 characters with an empty 500, so an
// IN list is sent in batches of this many ids (~13 encoded characters each). The same
// limit applies to the request the backend builds for itself, where an omitted fields
// param expands to the table's full column list: 100 ids of opa_properties_public_pde
// pass with 15 named fields and fail with all 80, so callers always name their fields
export const IDS_PER_REQUEST = 100;

// databridge serializes timestamps as real UTC (since 2026-10-23), spelled two ways:
// '2026-09-02T13:30:00+00:00' on table= (PostgREST) and '2026-09-02T13:30:00.000Z' on
// sql= (Carto V3). Both are rewritten to carto's spelling - a trailing Z, no milliseconds -
// without changing the instant. A bare reading with no zone at all ('2026-09-02T09:30:00',
// a table the gateway hasn't converted) is still the Philadelphia clock, read as local
// time and relabeled to real UTC.
const UTC_TIMESTAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{3})?(?:Z|\+00:00)$/;
const LOCAL_CLOCK_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
function normalizeTimestamps(properties) {
  for (const key of Object.keys(properties)) {
    const value = properties[key];
    if (typeof value !== 'string') {
      continue;
    }
    const utc = value.match(UTC_TIMESTAMP);
    if (utc) {
      properties[key] = `${utc[1]}Z`;
    } else if (LOCAL_CLOCK_TIMESTAMP.test(value)) {
      properties[key] = new Date(value).toISOString().replace('.000Z', 'Z');
    }
  }
  return properties;
}

// fetches EVERY row of a table-style query, however many: walks the API's keyset
// pagination (append AND objectid > <last id seen> - pages come back objectid-ascending,
// gap- and duplicate-free) until a short page ends the set. The gateway caps a single
// reply at 1,000 rows, so complete sets arrive in a few pages.
// Returns the rows, or null on any failure (bad response OR network/gateway error)
export async function fetchTableAllRows({ table, where, fields, pageSize = 999 }) {
  const rows = [];
  let lastId = null;
  for (;;) {
    const cursor = `objectid > ${lastId}`;
    const pageWhere = lastId === null ? where : where ? `(${where}) AND ${cursor}` : cursor;
    const params = new URLSearchParams({ table, limit: pageSize });
    if (pageWhere) {
      params.set('where', pageWhere);
    }
    if (fields) {
      // the fields param wants bare commas - 'col1, col2' reads ' col2' as a column
      params.set('fields', fields.replace(/\s/g, ''));
    }
    if (GATEWAY_CLIENT_ID) {
      params.set('client_id', GATEWAY_CLIENT_ID);
    }
    let data;
    try {
      const response = await fetch(`${DATABRIDGE_URL}?${params}`);
      if (!response.ok) {
        return null;
      }
      data = await response.json();
    } catch {
      return null;
    }
    const features = data && data.data && data.data.features;
    if (!features) {
      return null;
    }
    features.forEach((f) => rows.push(normalizeTimestamps(f.properties)));
    if (features.length < pageSize) {
      return rows;
    }
    lastId = features[features.length - 1].properties.objectid;
  }
}

// fetches every row whose column is in ids, in parallel batches short enough for the
// gateway's URL limit. Returns the combined rows, or null if any batch failed
export async function fetchTableRowsByIds({ table, column, ids, fields }) {
  const batches = [];
  for (let i = 0; i < ids.length; i += IDS_PER_REQUEST) {
    const list = ids.slice(i, i + IDS_PER_REQUEST).map((id) => `'${id}'`).join(',');
    batches.push(fetchTableAllRows({ table, where: `${column} IN (${list})`, fields }));
  }
  const results = await Promise.all(batches);
  if (results.some((rows) => rows === null)) {
    return null;
  }
  return results.flat();
}
