// Espelha uma imagem horizontalmente (corrige fotos de câmera frontal que
// salvam invertidas) e devolve um novo File com o mesmo nome/tipo.
export function flipImageHorizontally(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Falha ao espelhar a imagem')); return }
        resolve(new File([blob], file.name || 'foto.jpg', { type: blob.type || file.type || 'image/jpeg' }))
      }, file.type || 'image/jpeg', 0.95)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar a imagem')) }
    img.src = url
  })
}
