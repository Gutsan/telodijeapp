/**
 * Edge Function: sync-matches
 * 
 * Sincroniza partidos de Football-Data.org a Supabase.
 * Ejecuta server-side para evitar problemas de CORS.
 * 
 * Endpoint: POST /functions/v1/sync-matches
 * Input: Ninguno (auto-calcula rango de 7 días)
 * Output: { created, updated, errors, total }
 * 
 * @module supabase/functions/sync-matches
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ──────────────────────────────────────────────────────────────────
//  CONFIGURATION
// ──────────────────────────────────────────────────────────────────

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4'
const FOOTBALL_DATA_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY') || ''

// ──────────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────────

interface FootballDataMatch {
  id: number
  competition: {
    id: number
    name: string
    code: string
  }
  homeTeam: {
    id: number
    name: string
    shortName: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
  }
  utcDate: string
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED'
  score: {
    fullTime: {
      home: number | null
      away: number | null
    }
  }
}

interface FootballDataResponse {
  matches: FootballDataMatch[]
  resultSet?: {
    count: number
  }
}

// ──────────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────────

/**
 * Map Football-Data.org status to our status
 */
function mapStatus(status: FootballDataMatch['status']): 'scheduled' | 'live' | 'finished' {
  switch (status) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live'
    case 'FINISHED':
      return 'finished'
    case 'SCHEDULED':
    case 'TIMED':
    default:
      return 'scheduled'
  }
}

/**
 * CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ──────────────────────────────────────────────────────────────────
//  MAIN HANDLER
// ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate API key
    if (!FOOTBALL_DATA_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY not configured')
    }

    // 2. Calculate date range (7 days from today)
    const today = new Date()
    const toDate = new Date(today)
    toDate.setDate(today.getDate() + 7)

    const dateFrom = today.toISOString().split('T')[0]
    const dateTo = toDate.toISOString().split('T')[0]

    console.log(`Syncing matches from ${dateFrom} to ${dateTo}`)

    // 3. Fetch from Football-Data.org
    const apiRes = await fetch(
      `${FOOTBALL_DATA_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!apiRes.ok) {
      const errorText = await apiRes.text()
      throw new Error(`Football-Data.org API error ${apiRes.status}: ${errorText}`)
    }

    const apiData: FootballDataResponse = await apiRes.json()
    const matches = apiData.matches || []

    console.log(`Fetched ${matches.length} matches from Football-Data.org`)

    // 4. Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 5. Create sync log
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'matches',
        status: 'running',
      })
      .select()
      .single()

    // 6. Upsert each match
    let created = 0
    let updated = 0
    let errors = 0

    for (const match of matches) {
      try {
        const externalId = String(match.id)
        const status = mapStatus(match.status)

        const matchData = {
          external_id: externalId,
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          league: match.competition.name,
          match_date: match.utcDate,
          status,
          home_score: status === 'scheduled' ? null : (match.score.fullTime.home ?? null),
          away_score: status === 'scheduled' ? null : (match.score.fullTime.away ?? null),
        }

        // Check if match already exists
        const { data: existing } = await supabase
          .from('matches')
          .select('id, home_score, away_score, status')
          .eq('external_id', externalId)
          .single()

        if (existing) {
          // UPDATE only if score or status changed
          if (
            existing.home_score !== matchData.home_score ||
            existing.away_score !== matchData.away_score ||
            existing.status !== matchData.status
          ) {
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                status: matchData.status,
                home_score: matchData.home_score,
                away_score: matchData.away_score,
              })
              .eq('id', existing.id)

            if (updateError) {
              console.error(`Update error for match ${externalId}:`, updateError.message)
              errors++
            } else {
              updated++
            }
          }
        } else {
          // INSERT new match
          const { error: insertError } = await supabase
            .from('matches')
            .insert(matchData)

          if (insertError) {
            console.error(`Insert error for match ${externalId}:`, insertError.message)
            errors++
          } else {
            created++
          }
        }
      } catch (eventError) {
        console.error(`Event processing error:`, eventError)
        errors++
      }
    }

    // 7. Update sync log
    if (syncLog?.id) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'success',
          records_processed: matches.length,
          records_created: created,
          records_updated: updated,
          error_message: errors > 0 ? `${errors} events had errors` : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)
    }

    console.log(`Sync completed: ${created} created, ${updated} updated, ${errors} errors`)

    // 8. Return result
    return new Response(
      JSON.stringify({
        created,
        updated,
        errors,
        total: matches.length,
        dateFrom,
        dateTo,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Sync error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        created: 0,
        updated: 0,
        errors: 1,
        total: 0,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
