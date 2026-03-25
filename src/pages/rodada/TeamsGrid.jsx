import { Star } from 'lucide-react'

const TEAM_COLORS = [
  'border-blue-500   text-blue-400',
  'border-red-500    text-red-400',
  'border-yellow-500 text-yellow-400',
  'border-green-500  text-green-400',
]

export default function TeamsGrid({ teams }) {
  return (
    <div className="space-y-3">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Times sorteados</p>
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, i) => (
          <div key={i} className={`bg-card rounded-2xl p-3 border-t-2 ${TEAM_COLORS[i].split(' ')[0]}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`font-black text-sm uppercase ${TEAM_COLORS[i].split(' ')[1]}`}>
                {team.nome}
              </p>
              <div className="flex items-center gap-0.5">
                <Star size={10} className="text-secondary fill-secondary" />
                <span className="text-text-muted text-xs">{team.ratingMedio.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {team.players.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                    {p.foto_url
                      ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                      : <span className="text-xs">👤</span>}
                  </div>
                  <p className="text-text-main text-xs truncate">{p.nome.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
