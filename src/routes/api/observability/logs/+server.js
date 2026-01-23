import {json} from '@sveltejs/kit';

/**
 * Query Supabase internal logs from _analytics schema
 *
 * Sources:
 * - kong (cloudflare.logs.prod) - API Gateway logs
 * - auth (gotrue.logs.prod) - Authentication logs
 * - postgres (postgres.logs) - Database logs
 * - storage (storage.logs.prod.2) - Storage service logs
 * - rest (postgREST.logs.prod) - PostgREST API logs
 * - realtime (realtime.logs.prod) - Realtime service logs
 * - functions (deno-relay-logs) - Edge Functions logs
 */

// Map source names to table UUIDs
const SOURCE_TABLES = {
  kong: 'c7f9be91_b10a_4374_9294_43bb068463d6',
  auth: '2f1bcd4a_132d_4b1e_b65b_1984e4f06bda',
  postgres: 'cfd09231_0f6c_40d6_8f1b_f1dcfc811b32',
  storage: '1145eae5_2da9_4835_8846_18e2c72406e4',
  rest: '8ad249aa_0ad4_401d_b64a_a847e031e692',
  realtime: 'a214b0a8_2ead_4b26_ae33_2e14533a23b6',
  functions: 'ba672c10_5dee_4ab7_b332_4a394b22a13f',
  pgbouncer: '917842e4_1cb5_4819_b83a_37ed714ccb53'
};

const SOURCE_LABELS = {
  kong: 'Kong API Gateway',
  auth: 'Auth (GoTrue)',
  postgres: 'PostgreSQL',
  storage: 'Storage',
  rest: 'PostgREST',
  realtime: 'Realtime',
  functions: 'Edge Functions',
  pgbouncer: 'PgBouncer'
};

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, url}) {
  const {supabaseProduction} = locals;

  if (!supabaseProduction) {
    return json({error: 'Not authenticated'}, {status: 401});
  }

  // Parse query params
  const source = url.searchParams.get('source') || 'kong';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
  const hours = Math.min(parseInt(url.searchParams.get('hours') || '1'), 24);
  const search = url.searchParams.get('search') || null;

  // Validate source
  if (!SOURCE_TABLES[source]) {
    return json({error: 'Invalid source', validSources: Object.keys(SOURCE_TABLES)}, {status: 400});
  }

  const tableUuid = SOURCE_TABLES[source];
  const tableName = `log_events_${tableUuid.replace(/-/g, '_')}`;

  try {
    // Calculate time boundary
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Query logs using raw SQL via RPC (since we need to query _analytics schema)
    // We use the service role through supabaseProduction
    const {data, error} = await supabaseProduction.rpc('query_analytics_logs', {
      p_table_name: tableName,
      p_since: since,
      p_limit: limit,
      p_search: search
    });

    if (error) {
      console.error('[Observability Logs] RPC error:', error);
      // Fall back to direct query if RPC doesn't exist
      return json({
        logs: [],
        source,
        sourceLabel: SOURCE_LABELS[source],
        error: 'Log query function not available',
        availableSources: Object.entries(SOURCE_LABELS).map(([key, label]) => ({key, label}))
      });
    }

    return json({
      logs: data || [],
      source,
      sourceLabel: SOURCE_LABELS[source],
      count: data?.length || 0,
      hours,
      availableSources: Object.entries(SOURCE_LABELS).map(([key, label]) => ({key, label}))
    });
  } catch (err) {
    console.error('[Observability Logs] Error:', err);
    return json({error: 'Failed to fetch logs'}, {status: 500});
  }
}
