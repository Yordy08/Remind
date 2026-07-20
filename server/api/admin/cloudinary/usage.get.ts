import cloudinary from '../../../utils/cloudinary'
import { requireAdmin } from '../../../utils/admin'

const toNumber = (value: any) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const normalizeMetric = (metric: any, fallbackLimit = 0) => {
  const usage = toNumber(metric?.usage)
  const realLimit = toNumber(metric?.limit)
  const limit = realLimit || fallbackLimit
  const percent = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0

  return {
    usage,
    limit,
    percent,
    hasLimit: realLimit > 0,
    estimatedLimit: !realLimit && fallbackLimit > 0
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  try {
    const usage = await cloudinary.api.usage()
    const fallbackStorageLimit = Number(process.env.CLOUDINARY_STORAGE_LIMIT_BYTES) || 25 * 1024 * 1024 * 1024

    return {
      success: true,
      updatedAt: new Date().toISOString(),
      plan: usage?.plan || null,
      storage: normalizeMetric(usage?.storage, fallbackStorageLimit),
      bandwidth: normalizeMetric(usage?.bandwidth),
      transformations: normalizeMetric(usage?.transformations),
      resources: normalizeMetric(usage?.resources),
      requests: normalizeMetric(usage?.requests)
    }
  } catch (error: any) {
    console.error('Error consultando uso de Cloudinary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'No se pudo consultar el uso de Cloudinary'
    })
  }
})
