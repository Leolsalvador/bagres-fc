// Parser + matcher pra importar a lista colada do WhatsApp (texto cru)
// e casar cada nome com um perfil aprovado já cadastrado no app.

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

// "Victor (Boco)" -> "boco"
function extractNickname(nome) {
  const m = (nome || '').match(/\(([^)]+)\)/)
  return m ? normalize(m[1]) : null
}

// "Victor (Boco)" -> "victor"
function baseName(nome) {
  return normalize((nome || '').replace(/\([^)]*\)/g, ''))
}

// ── Parser do texto colado ──────────────────────────────────
// Reconhece linhas numeradas ("1. Nome✅"), detecta a seção de goleiros
// (linha contendo "goleiro") e extrai convidados no formato "Nome (quemConvidou)".
export function parseWhatsappList(text) {
  const lines = (text || '').split('\n').map(l => l.trim())
  const main = []
  const goleiros = []
  let section = 'main'

  for (const line of lines) {
    if (!line) continue
    if (/goleiro/i.test(line)) { section = 'goleiro'; continue }

    const m = line.match(/^(\d+)[.\-)]\s*(.*)$/)
    if (!m) continue

    const pos = parseInt(m[1], 10)
    let rest = m[2].trim().replace(/[✅❌✔️☑️🧤⚽]/g, '').trim()
    if (!rest) continue // slot numerado sem nome (ex: goleiro ainda vazio)

    let rawName = rest
    let guestOf = null
    const paren = rest.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    if (paren) {
      rawName = paren[1].trim()
      guestOf = paren[2].trim()
    }
    if (!rawName) continue

    const entry = { pos, rawName, guestOf }
    if (section === 'goleiro') goleiros.push(entry)
    else main.push(entry)
  }

  return { main, goleiros }
}

// ── Matching de nome -> perfil cadastrado ───────────────────
// Retorna { profile, confidence } — confidence: 'high' | 'medium' | 'low' | 'none'
export function matchProfile(rawName, profiles) {
  const query = normalize(rawName)
  if (!query) return { profile: null, confidence: 'none' }

  const exact = profiles.find(p => baseName(p.nome) === query)
  if (exact) return { profile: exact, confidence: 'high' }

  const byNickname = profiles.find(p => extractNickname(p.nome) === query)
  if (byNickname) return { profile: byNickname, confidence: 'high' }

  const firstWordMatches = profiles.filter(p => baseName(p.nome).split(' ')[0] === query)
  if (firstWordMatches.length === 1) return { profile: firstWordMatches[0], confidence: 'medium' }

  const wordMatches = profiles.filter(p => baseName(p.nome).split(' ').includes(query))
  if (wordMatches.length === 1) return { profile: wordMatches[0], confidence: 'medium' }

  const substrMatches = profiles.filter(p => {
    const bn = baseName(p.nome)
    return bn.includes(query) || query.includes(bn)
  })
  if (substrMatches.length === 1) return { profile: substrMatches[0], confidence: 'low' }

  return { profile: null, confidence: 'none' }
}
