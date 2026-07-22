import { requireAdmin } from '../../../utils/admin'

const toNumber = (value: any) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const backupUrl = process.env.GOOGLE_APPS_SCRIPT_BACKUP_URL
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET
  const limit = Number(process.env.GOOGLE_DRIVE_STORAGE_LIMIT_BYTES) || 15 * 1024 * 1024 * 1024

  if (!backupUrl || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Backup de Google Drive no configurado'
    })
  }

  try {
    const url = new URL(backupUrl)
    url.searchParams.set('action', 'usage')
    url.searchParams.set('secret', secret)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Apps Script respondió ${response.status}`)
    }

    const usage = await response.json()

    if (!usage?.success) {
      throw new Error(usage?.error || 'No se pudo consultar Google Drive')
    }

    const used = toNumber(usage.bytes)
    const files = toNumber(usage.files)
    const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

    return {
      success: true,
      updatedAt: usage.updatedAt || new Date().toISOString(),
      folderId: usage.folderId || null,
      storage: {
        usage: used,
        limit,
        percent,
        estimatedLimit: !process.env.GOOGLE_DRIVE_STORAGE_LIMIT_BYTES
      },
      files
    }
  } catch (error: any) {
    console.error('Error consultando uso de Google Drive:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'No se pudo consultar el uso de Google Drive'
    })
  }
})
