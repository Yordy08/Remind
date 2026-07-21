import prisma from '../../utils/prisma'
import { requireAdmin } from '../../utils/admin'
import cloudinary from '../../utils/cloudinary'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contentType = getHeader(event, 'content-type') || ''
  let userId = ''
  let title = ''
  let message = ''
  let imageUrl: string | undefined

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
      imageUrl
    }
  })

  return JSON.parse(JSON.stringify({ success: true, notification }))
})
