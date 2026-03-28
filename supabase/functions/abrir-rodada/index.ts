// Supabase Edge Function — abrir-rodada
// Abre automaticamente a rodada atual e adiciona admins como confirmados.
// Pode ser disparada por pg_cron (via pg_net) ou manualmente pelo admin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Busca a rodada mais recente com status 'aguardando'
    const { data: rodada, error: rodadaError } = await supabase
      .from('rodadas')
      .select('id')
      .eq('status', 'aguardando')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rodadaError) throw rodadaError

    if (!rodada) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Nenhuma rodada aguardando encontrada' }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Abre a rodada
    const { error: updateError } = await supabase
      .from('rodadas')
      .update({ status: 'aberta' })
      .eq('id', rodada.id)

    if (updateError) throw updateError

    // 3. Busca admins aprovados e os insere como confirmados (mesma lógica do frontend)
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('papel', 'admin')
      .eq('status', 'aprovado')
      .order('created_at', { ascending: true })

    if (adminsError) throw adminsError

    for (let i = 0; i < (admins ?? []).length; i++) {
      await supabase.from('presencas').upsert(
        { rodada_id: rodada.id, usuario_id: admins[i].id, posicao: i + 1, status: 'confirmado' },
        { onConflict: 'rodada_id,usuario_id', ignoreDuplicates: true }
      )
    }

    // 4. Envia push notification para todos os usuários
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '⚽ Lista aberta!',
        body: 'A lista da rodada está aberta. Confirme sua presença!',
      }),
    })

    return new Response(
      JSON.stringify({ success: true, rodadaId: rodada.id, adminsAdded: admins?.length ?? 0 }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('abrir-rodada error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
