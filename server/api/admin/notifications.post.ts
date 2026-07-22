import prisma from '../../utils/prisma'
import { requireAdmin } from '../../utils/admin'
import cloudinary from '../../utils/cloudinary'
import { uploadGoogleDriveBackup } from '../../utils/googleDrive'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contentType = getHeader(event, 'content-type') || ''
  let userId = ''
  let title = ''
  let message = ''
  let imageUrl: string | undefined
  let imageBackupUrl: string | undefined
  let imageBackupFileId: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const formData = await readMultipartFormData(event)
    const getField = (name: string) => formData?.find(field => field.name === name)?.data?.toString() || ''

    userId = getField('userId')
    title = getField('title')
    message = getField('message')

    const image = formData?.find(field => field.name === 'image')
    if (image?.data?.length) {
      const upload = await cloudinary.uploader.upload(
        `data:${image.type};base64,${image.data.toString('base64')}`,
        { folder: 'entrenos/notifications' }
      )
      imageUrl = upload.secure_url

      const backup = await uploadGoogleDriveBackup({
        buffer: image.data,
        filename: image.filename || 'notification-image.jpg',
        mimeType: image.type || 'image/jpeg',
        folderName: 'notifications'
      })

      imageBackupUrl = backup?.url
      imageBackupFileId = backup?.fileId
    }
  } else {
    const body = await readBody(event)
    userId = body?.userId || ''
    title = body?.title || ''
    message = body?.message || ''
    imageUrl = body?.imageUrl || undefined
  }

  if (!userId || !title?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Usuario, título y mensaje son requeridos' })
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      title: title.trim(),
      message: message.trim(),
      imageUrl,
      imageBackupUrl,
      imageBackupFileId
    }
  })

  return JSON.parse(JSON.stringify({ success: true, notification }))
})
