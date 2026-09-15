// Gera um PNG (via canvas) do "campinho" com o Time da Rodada — mesma
// paleta e agrupamento visual do componente TeamField (AdminRodada.jsx),
// pra postar automaticamente no feed sem precisar de print manual.

const FIELD_BORDER_COLORS = ['#60a5fa', '#f87171', '#facc15', '#4ade80'] // blue/red/yellow/green-400

function loadImage(url) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function drawPlayer(ctx, player, img, cx, cy, borderColor) {
  const r = 45
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = '#166534'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = borderColor
  ctx.stroke()

  if (img) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    const size = Math.min(img.width, img.height)
    const sx = (img.width - size) / 2
    const sy = (img.height - size) / 2
    ctx.drawImage(img, sx, sy, size, size, cx - r, cy - r, r * 2, r * 2)
    ctx.restore()
  } else {
    ctx.font = `${r}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('👤', cx, cy + 4)
  }
  ctx.restore()

  ctx.font = '700 22px Inter, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 4
  const firstName = (player.nome ?? '—').split(' ')[0]
  ctx.fillText(firstName, cx, cy + r + 28)
  ctx.shadowBlur = 0
}

export async function generateTeamFieldImage(team, colorIndex, vitorias) {
  const W = 1000
  const HEADER_H = 170
  const FIELD_H = 600
  const H = HEADER_H + FIELD_H
  const borderColor = FIELD_BORDER_COLORS[((colorIndex % 4) + 4) % 4]

  const players = (team?.players ?? []).filter(Boolean)
  const images = await Promise.all(players.map(p => loadImage(p.foto_url)))

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Header
  ctx.fillStyle = '#1F2937'
  ctx.fillRect(0, 0, W, HEADER_H)
  ctx.font = '600 24px Inter, sans-serif'
  ctx.fillStyle = '#9CA3AF'
  ctx.fillText('🏆  TIME DA RODADA', 40, 58)
  ctx.font = '900 46px Inter, sans-serif'
  ctx.fillStyle = '#FFD600'
  ctx.fillText(team?.nome ?? '—', 40, 118)
  ctx.font = '600 26px Inter, sans-serif'
  ctx.fillStyle = '#9CA3AF'
  ctx.textAlign = 'right'
  ctx.fillText(`${vitorias} vitória${vitorias !== 1 ? 's' : ''}`, W - 40, 96)
  ctx.textAlign = 'left'

  // Field
  ctx.fillStyle = '#14532d'
  ctx.fillRect(0, HEADER_H, W, FIELD_H)
  const cy0 = HEADER_H + FIELD_H / 2
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(W / 2, cy0, 90, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, cy0, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.beginPath()
  ctx.moveTo(W * 0.12, HEADER_H)
  ctx.lineTo(W * 0.12, HEADER_H + FIELD_H)
  ctx.moveTo(W * 0.88, HEADER_H)
  ctx.lineTo(W * 0.88, HEADER_H + FIELD_H)
  ctx.stroke()

  // Jogadores — mesmo agrupamento do TeamField: [[0,1],[2],[3,4]]
  const rows = [[players[0], players[1]], [players[2]], [players[3], players[4]]]
  const bandH = FIELD_H / 3
  rows.forEach((row, ri) => {
    const cy = HEADER_H + bandH * ri + bandH / 2
    const entries = row.map((p, i) => ({ p, img: images[players.indexOf(p)] })).filter(e => e.p)
    if (entries.length === 0) return
    const spacing = W / (entries.length + 1)
    entries.forEach((e, i) => drawPlayer(ctx, e.p, e.img, spacing * (i + 1), cy, borderColor))
  })

  return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
