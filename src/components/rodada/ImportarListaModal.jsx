import { useState, useEffect } from 'react'
import { X, ClipboardPaste, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchApprovedProfiles, insertPresenca, insertGuestPresenca } from '@/lib/api'
import { parseWhatsappList, matchProfile } from '@/lib/listImport'

const CONFIDENCE_STYLE = {
  high:   'border-primary/40 bg-primary/5',
  medium: 'border-secondary/40 bg-secondary/5',
  low:    'border-secondary/40 bg-secondary/5',
  none:   'border-danger/40 bg-danger/5',
}

export default function ImportarListaModal({ rodadaId, presencas, onClear, onImported, onClose }) {
  const [step, setStep] = useState('paste') // 'paste' | 'review'
  const [rawText, setRawText] = useState('')
  const [profiles, setProfiles] = useState([])
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null) // { done, total }
  const [failures, setFailures] = useState([]) // [{ rawName, message }]

  useEffect(() => {
    fetchApprovedProfiles().then(setProfiles).catch(console.error)
  }, [])

  function handleAnalyze() {
    const { main, goleiros } = parseWhatsappList(rawText)
    const entries = [
      ...main.map(e => ({ ...e, isGoleiro: false })),
      ...goleiros.map(e => ({ ...e, isGoleiro: true })),
    ]

    const built = entries.map(entry => {
      const key = `${entry.isGoleiro ? 'g' : 'm'}-${entry.pos}-${entry.rawName}`
      if (entry.guestOf) {
        const inviterMatch = matchProfile(entry.guestOf, profiles)
        return {
          key, pos: entry.pos, isGoleiro: entry.isGoleiro, rawName: entry.rawName,
          include: true, mode: 'guest', profileId: null, confidence: 'high',
          guestNome: entry.rawName, inviterId: inviterMatch.profile?.id ?? null,
        }
      }
      const match = matchProfile(entry.rawName, profiles)
      return {
        key, pos: entry.pos, isGoleiro: entry.isGoleiro, rawName: entry.rawName,
        include: true, mode: 'profile', profileId: match.profile?.id ?? null,
        confidence: match.confidence, guestNome: entry.rawName, inviterId: null,
      }
    })

    setRows(built)
    setStep('review')
  }

  function updateRow(key, changes) {
    setRows(rs => rs.map(r => r.key === key ? { ...r, ...changes } : r))
  }

  const readyCount = rows.filter(r =>
    r.include && ((r.mode === 'profile' && r.profileId) || (r.mode === 'guest' && r.inviterId && r.guestNome.trim()))
  ).length
  const totalIncluded = rows.filter(r => r.include).length

  async function handleConfirm() {
    setSaving(true)
    setFailures([])

    const toImport = rows.filter(r => r.include && (
      (r.mode === 'profile' && r.profileId) || (r.mode === 'guest' && r.inviterId && r.guestNome.trim())
    ))
    setProgress({ done: 0, total: toImport.length })

    try {
      if (presencas.length > 0) await onClear()

      // Insere uma por vez (não em paralelo) — disparar tudo de uma vez sobrecarrega
      // a API e faz alguma inserção falhar por limite de conexões simultâneas.
      const failed = []
      for (const r of toImport) {
        const posicao = r.isGoleiro ? 100 + (r.pos - 1) : r.pos
        const status = r.isGoleiro || posicao <= 20 ? 'confirmado' : 'espera'
        try {
          if (r.mode === 'profile' && r.profileId) {
            await insertPresenca(rodadaId, r.profileId, posicao, status)
          } else {
            const inviter = profiles.find(p => p.id === r.inviterId)
            await insertGuestPresenca(
              rodadaId,
              { nome: r.guestNome.trim(), posicao_campo: 'MEI', rating: 3 },
              posicao, r.inviterId, inviter?.nome, status
            )
          }
        } catch (err) {
          console.error(`Erro ao importar "${r.rawName}":`, err)
          failed.push({ rawName: r.rawName, message: err.message ?? String(err) })
        }
        setProgress(p => ({ ...p, done: p.done + 1 }))
      }

      setFailures(failed)
      await onImported()
      if (failed.length === 0) onClose()
    } catch (err) {
      console.error('Erro ao importar lista:', err)
      setFailures([{ rawName: null, message: err.message ?? String(err) }])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-card flex flex-col z-[60]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3 shrink-0 border-b border-border">
        <h2 className="text-text-main font-bold text-lg">Importar lista do WhatsApp</h2>
        <button onClick={onClose} className="text-text-muted active:scale-90 transition-transform">
          <X size={20} />
        </button>
      </div>

      {step === 'paste' && (
        <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto">
          <p className="text-text-muted text-sm mb-3">
            Cola aqui o texto da lista que você manda no grupo. O app tenta casar cada nome
            com um jogador já cadastrado — você revisa antes de confirmar.
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={'Lista pelada 14/09 20h\n1.Bob✅\n2.Bocó✅\n...\n\n🧤🧤Goleiros\n1.\n2.'}
            className="flex-1 min-h-[240px] bg-elevated text-text-main text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
            autoFocus
          />
          <button
            onClick={handleAnalyze}
            disabled={!rawText.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-black font-bold disabled:opacity-40 active:scale-95 transition-transform"
          >
            <ClipboardPaste size={16} /> Analisar lista
          </button>
        </div>
      )}

      {step === 'review' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 shrink-0 border-b border-border">
            <p className="text-text-main text-sm font-semibold">
              {readyCount} de {totalIncluded} prontos pra importar
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              Confira cada linha. 🟢 achou certo · 🟡 achou parecido, confirme · 🔴 não achou — selecione manualmente ou marque como convidado.
            </p>
            {presencas.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-danger text-xs font-semibold">
                <AlertTriangle size={13} />
                Isso vai substituir os {presencas.length} já na lista atual.
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {failures.length > 0 && (
              <div className="rounded-xl border border-danger/40 bg-danger/5 p-3 space-y-1">
                <p className="text-danger text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} /> {failures.length} não entraram — tente de novo ou adicione manualmente:
                </p>
                {failures.map((f, i) => (
                  <p key={i} className="text-danger text-xs">
                    {f.rawName ? `• ${f.rawName}: ` : ''}{f.message}
                  </p>
                ))}
              </div>
            )}
            {rows.map(row => (
              <RowEditor key={row.key} row={row} profiles={profiles} onChange={c => updateRow(row.key, c)} />
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border shrink-0 flex gap-2">
            <button
              onClick={() => setStep('paste')}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-text-muted bg-elevated disabled:opacity-40"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || readyCount === 0}
              className="flex-[2] py-3 rounded-xl text-sm font-bold text-black bg-primary disabled:opacity-40 active:scale-95 transition-transform"
            >
              {saving ? `Importando... ${progress?.done ?? 0}/${progress?.total ?? 0}` : `Confirmar e importar (${readyCount})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RowEditor({ row, profiles, onChange }) {
  const sortedProfiles = [...profiles].sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div className={cn('rounded-xl border p-3 space-y-2', row.include ? CONFIDENCE_STYLE[row.confidence] : 'border-border opacity-50')}>
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs font-bold w-8 shrink-0">
          {row.isGoleiro ? `G${row.pos}` : `#${row.pos}`}
        </span>
        <span className="text-text-main text-sm font-semibold flex-1 truncate">{row.rawName}</span>
        <button
          onClick={() => onChange({ include: !row.include })}
          className={cn(
            'text-[10px] font-bold px-2 py-1 rounded-lg shrink-0',
            row.include ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
          )}
        >
          {row.include ? 'Excluir' : 'Incluir'}
        </button>
      </div>

      {row.include && (
        <>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ mode: 'profile' })}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold', row.mode === 'profile' ? 'bg-primary text-black' : 'bg-elevated text-text-muted')}
            >
              Jogador cadastrado
            </button>
            <button
              onClick={() => onChange({ mode: 'guest' })}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold', row.mode === 'guest' ? 'bg-primary text-black' : 'bg-elevated text-text-muted')}
            >
              Convidado
            </button>
          </div>

          {row.mode === 'profile' ? (
            <select
              value={row.profileId ?? ''}
              onChange={e => onChange({ profileId: e.target.value || null })}
              className="w-full bg-elevated text-text-main rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Selecione o jogador —</option>
              {sortedProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-1.5">
              <input
                value={row.guestNome}
                onChange={e => onChange({ guestNome: e.target.value })}
                placeholder="Nome do convidado"
                className="w-full bg-elevated text-text-main rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={row.inviterId ?? ''}
                onChange={e => onChange({ inviterId: e.target.value || null })}
                className="w-full bg-elevated text-text-main rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Convidado de quem? —</option>
                {sortedProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}
