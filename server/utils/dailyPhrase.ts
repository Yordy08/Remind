const phrases = [
  'hoy es un buen día para guardar un recuerdo que mañana te hará sonreír.',
  'cada foto que conservas también protege una parte de tu historia.',
  'tus momentos importantes merecen un lugar seguro y hecho para ti.',
  'que este día te regale una imagen, una emoción y una razón para recordar.',
  'los recuerdos más simples también pueden convertirse en tesoros con el tiempo.',
  'hoy no solo vivas el momento: guárdalo con cariño para volver a él.',
  'tu historia sigue creciendo, y Remind está aquí para cuidarla contigo.',
  'una memoria protegida es una forma hermosa de agradecer lo vivido.',
  'cada día trae algo que vale la pena conservar, aunque sea pequeño.',
  'las fotos no detienen el tiempo, pero sí nos ayudan a volver a sentirlo.'
]

export const getTodayKey = () => new Date().toISOString().slice(0, 10)

export const getDailyPhrase = (dateKey = getTodayKey()) => {
  const seed = dateKey.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return phrases[seed % phrases.length]
}
