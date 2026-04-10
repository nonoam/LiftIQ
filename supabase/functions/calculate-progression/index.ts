// LiftIQ — Progression Suggestion Edge Function
// Triggered by: POST /functions/v1/calculate-progression
// Body: { exercise_id: string, user_id?: string }
// Auth: service role key (called from backend) OR user JWT

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressionRequest {
  exercise_id: string;
  user_id?: string;
}

interface SessionBest {
  session_id: string;
  started_at: string;
  best_1rm: number;
  max_weight: number;
  total_sets: number;
  max_reps: number;
}

// 1RM via Epley formula
function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// Round to nearest 2.5kg increment
function roundToIncrement(value: number, increment = 2.5): number {
  return Math.round(value / increment) * increment;
}

// Detect plateau: last N weeks with no 1RM improvement
function detectPlateau(weeklyBests: { week: string; best1rm: number }[], weeks = 3): boolean {
  if (weeklyBests.length < weeks) return false;
  const recent = weeklyBests.slice(-weeks);
  const first = recent[0]?.best1rm ?? 0;
  return recent.every((w) => w.best1rm <= first * 1.02); // < 2% improvement
}

// ─── Progression Algorithms ───────────────────────────────────────────────────

function linearProgression(lastBest: SessionBest, experience: string): {
  weight: number; repsMin: number; repsMax: number; sets: number;
} {
  const increment = experience === 'beginner' ? 2.5 : experience === 'intermediate' ? 2.5 : 1.25;
  return {
    weight: roundToIncrement(lastBest.max_weight + increment),
    repsMin: Math.max(lastBest.max_reps - 2, 5),
    repsMax: lastBest.max_reps,
    sets: lastBest.total_sets,
  };
}

function doubleProgression(lastBest: SessionBest, targetRepsMax: number): {
  weight: number; repsMin: number; repsMax: number; sets: number;
} {
  // If hit upper rep target → increase weight, reset reps to lower bound
  if (lastBest.max_reps >= targetRepsMax) {
    return {
      weight: roundToIncrement(lastBest.max_weight + 2.5),
      repsMin: Math.max(targetRepsMax - 4, 5),
      repsMax: Math.max(targetRepsMax - 2, 6),
      sets: lastBest.total_sets,
    };
  }
  // Same weight, aim for +1 rep
  return {
    weight: lastBest.max_weight,
    repsMin: lastBest.max_reps + 1,
    repsMax: targetRepsMax,
    sets: lastBest.total_sets,
  };
}

function undulatingProgression(sessionIndex: number, lastBest: SessionBest): {
  weight: number; repsMin: number; repsMax: number; sets: number;
} {
  // Rotate: strength (3-5) → hypertrophy (8-12) → endurance (15-20)
  const phase = sessionIndex % 3;
  const phases = [
    { repsMin: 3, repsMax: 5,  factor: 1.0  },  // strength
    { repsMin: 8, repsMax: 12, factor: 0.75 },  // hypertrophy
    { repsMin: 15, repsMax: 20, factor: 0.6  },  // endurance
  ];
  const p = phases[phase]!;
  return {
    weight: roundToIncrement(lastBest.max_weight * p.factor),
    repsMin: p.repsMin,
    repsMax: p.repsMax,
    sets: lastBest.total_sets,
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const body: ProgressionRequest = await req.json();
    if (!body.exercise_id) {
      return new Response(JSON.stringify({ error: 'exercise_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    userId = userId ?? body.user_id ?? null;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch user profile for progression type and experience
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('progression_type, experience_level')
      .eq('id', userId)
      .single();

    const progressionType = profile?.progression_type ?? 'linear';
    const experience = profile?.experience_level ?? 'intermediate';

    // 2. Fetch last 12 sessions for this exercise
    const { data: historyRows, error: histError } = await supabaseClient
      .from('user_exercise_history')
      .select('session_id, started_at, weight_kg, reps, estimated_1rm, set_volume_kg')
      .eq('user_id', userId)
      .eq('exercise_id', body.exercise_id)
      .order('started_at', { ascending: false })
      .limit(120); // up to 12 sessions × 10 sets each

    if (histError) throw histError;
    if (!historyRows || historyRows.length === 0) {
      return new Response(JSON.stringify({
        message: 'Not enough history to generate suggestion',
        exercise_id: body.exercise_id,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Aggregate by session
    const sessionMap = new Map<string, SessionBest>();
    for (const row of historyRows) {
      const rm = epley1RM(row.weight_kg ?? 0, row.reps ?? 0);
      const existing = sessionMap.get(row.session_id);
      if (!existing) {
        sessionMap.set(row.session_id, {
          session_id: row.session_id,
          started_at: row.started_at,
          best_1rm: rm,
          max_weight: row.weight_kg ?? 0,
          total_sets: 1,
          max_reps: row.reps ?? 0,
        });
      } else {
        existing.best_1rm = Math.max(existing.best_1rm, rm);
        existing.max_weight = Math.max(existing.max_weight, row.weight_kg ?? 0);
        existing.total_sets += 1;
        existing.max_reps = Math.max(existing.max_reps, row.reps ?? 0);
      }
    }

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    const lastSession = sessions[sessions.length - 1]!;
    const sessionCount = sessions.length;

    // 4. Weekly 1RM for plateau detection
    const weeklyMap = new Map<string, number>();
    sessions.forEach((s) => {
      const week = new Date(s.started_at).toISOString().slice(0, 10);
      const existing = weeklyMap.get(week) ?? 0;
      weeklyMap.set(week, Math.max(existing, s.best_1rm));
    });
    const weeklyBests = Array.from(weeklyMap.entries()).map(([week, best1rm]) => ({ week, best1rm }));
    const plateauDetected = detectPlateau(weeklyBests, 3);
    const consecutiveWeeks = plateauDetected ? 3 : 0;
    const deloadSuggested = detectPlateau(weeklyBests, 4);

    // 5. Generate suggestion based on progression type
    let suggestion: { weight: number; repsMin: number; repsMax: number; sets: number };
    let reasoning = '';

    if (plateauDetected) {
      // Plateau override: suggest variation or deload
      if (deloadSuggested) {
        suggestion = {
          weight: roundToIncrement(lastSession.max_weight * 0.85),
          repsMin: lastSession.max_reps + 2,
          repsMax: lastSession.max_reps + 4,
          sets: Math.max(lastSession.total_sets - 1, 2),
        };
        reasoning = `Deload recommended after ${consecutiveWeeks}+ weeks of no progress. Reduce weight to ~85% of last session.`;
      } else {
        // Suggest rep increase or slight deload
        suggestion = {
          weight: lastSession.max_weight,
          repsMin: lastSession.max_reps + 2,
          repsMax: lastSession.max_reps + 4,
          sets: lastSession.total_sets,
        };
        reasoning = `Plateau detected over ${consecutiveWeeks} weeks. Maintain weight but increase reps to create new stimulus.`;
      }
    } else if (progressionType === 'linear') {
      suggestion = linearProgression(lastSession, experience);
      reasoning = `Linear progression: add ${experience === 'beginner' ? 2.5 : 2.5}kg from last session (${lastSession.max_weight}kg).`;
    } else if (progressionType === 'double') {
      const targetMax = experience === 'beginner' ? 12 : 10;
      suggestion = doubleProgression(lastSession, targetMax);
      reasoning = `Double progression: ${lastSession.max_reps >= targetMax ? 'hit rep target, increasing weight' : 'aim for more reps before adding weight'}.`;
    } else {
      // undulating
      suggestion = undulatingProgression(sessionCount, lastSession);
      const phase = sessionCount % 3;
      const phaseNames = ['strength (3-5 reps)', 'hypertrophy (8-12 reps)', 'endurance (15-20 reps)'];
      reasoning = `Undulating periodization: ${phaseNames[phase]} phase based on ${sessionCount} sessions logged.`;
    }

    // 6. Write prediction to DB
    const { data: prediction, error: writeError } = await supabaseClient
      .from('progress_predictions')
      .insert({
        user_id: userId,
        exercise_id: body.exercise_id,
        suggested_weight_kg: suggestion.weight,
        suggested_reps_min: suggestion.repsMin,
        suggested_reps_max: suggestion.repsMax,
        suggested_sets: suggestion.sets,
        progression_type: progressionType,
        is_deload_suggested: deloadSuggested,
        plateau_detected: plateauDetected,
        consecutive_weeks_no_progress: consecutiveWeeks,
        confidence_score: Math.min(0.95, 0.5 + (sessionCount * 0.05)),
        reasoning,
        based_on_sessions: sessionCount,
      })
      .select()
      .single();

    if (writeError) throw writeError;

    return new Response(JSON.stringify({ prediction }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[calculate-progression]', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
