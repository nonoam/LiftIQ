#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# LiftIQ — prueba de aislamiento RLS contra la pila local de Supabase.
#
#   npx supabase start
#   npm run test:rls
#
# Registra dos usuarios reales vía la API de auth y comprueba que ninguno
# puede ver ni tocar los datos del otro. Si tocas 0002_rls.sql, vuelve a
# ejecutarlo: es la única red de seguridad que tenemos contra una fuga de
# datos entre cuentas.
#
# Nota: usa solo nombres ASCII en los cuerpos JSON. Git Bash en Windows
# corrompe los acentos al interpolarlos en curl y PostgREST responde
# "Empty or invalid json".
# ═══════════════════════════════════════════════════════════════════════
set -uo pipefail

API="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON="${SUPABASE_ANON_KEY:-}"

if [ -z "$ANON" ]; then
  ANON=$(npx --yes supabase@latest status -o json 2>/dev/null \
    | node -pe 'try{JSON.parse(require("fs").readFileSync(0,"utf8")).ANON_KEY||""}catch(e){""}')
fi
if [ -z "$ANON" ]; then
  echo "No se pudo obtener la anon key. ¿Está arrancado 'npx supabase start'?" >&2
  exit 1
fi

pass=0; fail=0
check() { # check <desc> <esperado> <obtenido>
  if [ "$2" = "$3" ]; then
    echo "  PASS  $1"; pass=$((pass+1))
  else
    echo "  FAIL  $1 (esperado=$2 obtenido=$3)"; fail=$((fail+1))
  fi
}

signup() {
  curl -s -X POST "$API/auth/v1/signup" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}"
}

api() { # api <token> <metodo> <path> [body]
  if [ -n "${4:-}" ]; then
    curl -s -X "$2" "$API/rest/v1/$3" \
      -H "apikey: $ANON" -H "Authorization: Bearer $1" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" -d "$4"
  else
    curl -s -X "$2" "$API/rest/v1/$3" -H "apikey: $ANON" -H "Authorization: Bearer $1"
  fi
}

count() {
  echo "$1" | node -pe 'try{const d=JSON.parse(require("fs").readFileSync(0,"utf8"));Array.isArray(d)?d.length:"ERROR:"+(d.message||"?")}catch(e){"ERROR"}'
}
field() {
  echo "$1" | node -pe "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));String((Array.isArray(d)?d[0]:d)?.$2 ?? '')}catch(e){''}"
}
rejected() { # espera un rechazo de la base de datos, no un 2xx
  echo "$1" | grep -qiE 'row-level security|violates check constraint|duplicate key' && echo true || echo false
}

STAMP=$(date +%s)-$$
A_JSON=$(signup "a_${STAMP}@test.local" "Password123!")
B_JSON=$(signup "b_${STAMP}@test.local" "Password123!")
A_TOK=$(field "$A_JSON" access_token); A_UID=$(field "$A_JSON" 'user?.id')
B_TOK=$(field "$B_JSON" access_token); B_UID=$(field "$B_JSON" 'user?.id')

if [ -z "$A_TOK" ] || [ -z "$B_TOK" ]; then
  echo "No se pudo registrar usuarios."; echo "A: $A_JSON"; echo "B: $B_JSON"; exit 1
fi
echo "Usuario A = $A_UID"
echo "Usuario B = $B_UID"

echo
echo "-- 1. El trigger crea el perfil --------------------------------"
check "A ve su propio perfil"          "1" "$(count "$(api "$A_TOK" GET 'profiles?select=id')")"
check "A no ve el perfil de B"         ""  "$(field "$(api "$A_TOK" GET "profiles?select=id&id=eq.$B_UID")" id)"

echo
echo "-- 2. Catalogo global vs ejercicios propios --------------------"
GLOBALS=$(count "$(api "$A_TOK" GET 'exercises?select=id&owner_id=is.null')")
check "A ve el catalogo global (>80)"  "true" "$([ "$GLOBALS" -gt 80 ] 2>/dev/null && echo true || echo false)"
CUSTOM_ID=$(field "$(api "$A_TOK" POST 'exercises' "{\"name\":\"Curl secreto de A\",\"muscle_group\":\"biceps\",\"equipment\":\"dumbbell\",\"is_custom\":true,\"owner_id\":\"$A_UID\"}")" id)
check "A crea un ejercicio propio"     "true" "$([ -n "$CUSTOM_ID" ] && echo true || echo false)"
check "B NO ve el ejercicio de A"      "0" "$(count "$(api "$B_TOK" GET "exercises?select=id&id=eq.$CUSTOM_ID")")"
check "B NO puede crear a nombre de A" "true" "$(rejected "$(api "$B_TOK" POST 'exercises' "{\"name\":\"Robo\",\"muscle_group\":\"biceps\",\"equipment\":\"dumbbell\",\"is_custom\":true,\"owner_id\":\"$A_UID\"}")")"
check "Nadie puede crear un global"    "true" "$(rejected "$(api "$A_TOK" POST 'exercises' "{\"name\":\"Global falso\",\"muscle_group\":\"core\",\"equipment\":\"other\"}")")"
check "Custom sin dueno rechazado"     "true" "$(rejected "$(api "$A_TOK" POST 'exercises' "{\"name\":\"Huerfano\",\"muscle_group\":\"core\",\"equipment\":\"other\",\"is_custom\":true}")")"

echo
echo "-- 3. Sesion de entreno de A -----------------------------------"
BENCH=$(field "$(api "$A_TOK" GET 'exercises?select=id&name=eq.Press%20de%20banca%20con%20barra')" id)
check "El seed trae el press de banca" "true" "$([ -n "$BENCH" ] && echo true || echo false)"
SESS_ID=$(field "$(api "$A_TOK" POST 'workout_sessions' "{\"user_id\":\"$A_UID\",\"name\":\"Empuje\"}")" id)
check "A crea sesion"                  "true" "$([ -n "$SESS_ID" ] && echo true || echo false)"
SE_ID=$(field "$(api "$A_TOK" POST 'session_exercises' "{\"session_id\":\"$SESS_ID\",\"user_id\":\"$A_UID\",\"exercise_id\":\"$BENCH\",\"position\":0}")" id)
check "A anade ejercicio a la sesion"  "true" "$([ -n "$SE_ID" ] && echo true || echo false)"
check "A registra una serie con RIR"   "2" "$(field "$(api "$A_TOK" POST 'workout_sets' "{\"session_exercise_id\":\"$SE_ID\",\"user_id\":\"$A_UID\",\"set_number\":1,\"weight_kg\":80,\"reps\":8,\"rir\":2}")" rir)"

echo
echo "-- 4. Aislamiento entre usuarios -------------------------------"
check "B no ve sesiones de A"          "0" "$(count "$(api "$B_TOK" GET 'workout_sessions?select=id')")"
check "B no ve series de A"            "0" "$(count "$(api "$B_TOK" GET 'workout_sets?select=id')")"
check "B no ve session_exercises de A" "0" "$(count "$(api "$B_TOK" GET 'session_exercises?select=id')")"
check "B NO cuelga serie de sesion ajena" "true" "$(rejected "$(api "$B_TOK" POST 'workout_sets' "{\"session_exercise_id\":\"$SE_ID\",\"user_id\":\"$B_UID\",\"set_number\":9,\"weight_kg\":999,\"reps\":1,\"rir\":0}")")"
api "$B_TOK" DELETE "workout_sessions?id=eq.$SESS_ID" > /dev/null
check "B NO borra la sesion de A"      "1" "$(count "$(api "$A_TOK" GET "workout_sessions?select=id&id=eq.$SESS_ID")")"
check "A sigue viendo su serie"        "1" "$(count "$(api "$A_TOK" GET 'workout_sets?select=id')")"

echo
echo "-- 5. Reglas de negocio ----------------------------------------"
check "Solo una sesion abierta"        "true" "$(rejected "$(api "$A_TOK" POST 'workout_sessions' "{\"user_id\":\"$A_UID\",\"name\":\"Otra abierta\"}")")"
check "RIR > 10 rechazado"             "true" "$(rejected "$(api "$A_TOK" POST 'workout_sets' "{\"session_exercise_id\":\"$SE_ID\",\"user_id\":\"$A_UID\",\"set_number\":2,\"reps\":5,\"rir\":11}")")"
check "Peso negativo rechazado"        "true" "$(rejected "$(api "$A_TOK" POST 'workout_sets' "{\"session_exercise_id\":\"$SE_ID\",\"user_id\":\"$A_UID\",\"set_number\":3,\"weight_kg\":-5,\"reps\":5}")")"

echo
echo "-- 6. Vistas derivadas -----------------------------------------"
api "$A_TOK" PATCH "workout_sessions?id=eq.$SESS_ID" \
  "{\"finished_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"duration_seconds\":3600}" > /dev/null
LAST=$(api "$A_TOK" GET "v_exercise_last_performance?select=*&exercise_id=eq.$BENCH")
check "A tiene 'ultima vez' del press" "1"  "$(count "$LAST")"
check "  con 1 serie efectiva"         "1"  "$(field "$LAST" working_sets)"
check "  y peso maximo 80"             "80" "$(field "$LAST" top_weight_kg)"
check "  y las series en jsonb"        "8"  "$(field "$LAST" 'sets[0].reps')"
check "B no ve la 'ultima vez' de A"   "0"  "$(count "$(api "$B_TOK" GET 'v_exercise_last_performance?select=*')")"
SUM=$(api "$A_TOK" GET "v_session_summary?select=*&session_id=eq.$SESS_ID")
check "Resumen: volumen 80x8 = 640"    "640" "$(field "$SUM" total_volume_kg)"
check "B no ve resumenes de A"         "0"   "$(count "$(api "$B_TOK" GET 'v_session_summary?select=*')")"

echo
echo "================================================"
echo "   PASS: $pass    FAIL: $fail"
echo "================================================"
[ "$fail" -eq 0 ]
