import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const interactionId = String(body?.interactionId || '')
  const action = String(body?.action || '').toUpperCase()

  if (!interactionId || !['LOVE', 'THANKS'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Reacción inválida' })
  }

  const interaction = await prisma.dailyPhraseInteraction.findFirst({
    where: {
      id: interactionId,
      userId: user.id
    }
  })

  if (!interaction) {
    throw createError({ statusCode: 404, statusMessage: 'Frase no encontrada' })
  }

  const updated = await prisma.dailyPhraseInteraction.update({
    where: { id: interaction.id },
    data: {
      action,
      reactedAt: new Date()
    }
  })

  return JSON.parse(JSON.stringify({ success: true, interaction: updated }))
})
