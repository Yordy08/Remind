import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'
import { getDailyPhrase, getTodayKey } from '../../utils/dailyPhrase'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const dateKey = getTodayKey()
  const existing = await prisma.dailyPhraseInteraction.findUnique({
    where: {
      userId_dateKey: {
        userId: user.id,
        dateKey
      }
    }
  })

  if (existing) {
    return { success: true, show: false }
  }

  const phrase = getDailyPhrase(dateKey)
  const interaction = await prisma.dailyPhraseInteraction.create({
    data: {
      userId: user.id,
      dateKey,
      phrase
    }
  })

  return JSON.parse(JSON.stringify({
    success: true,
    show: true,
    interactionId: interaction.id,
    dateKey,
    phrase
  }))
})
