import cloudinary from './cloudinary'

export const getCloudinaryPublicId = (url?: string | null) => {
  if (!url || !url.includes('res.cloudinary.com')) return null

  try {
    const parsedUrl = new URL(url)
    const uploadIndex = parsedUrl.pathname.indexOf('/upload/')
    if (uploadIndex === -1) return null

    const afterUpload = parsedUrl.pathname.slice(uploadIndex + '/upload/'.length)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '')
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, '')

    return decodeURIComponent(withoutExtension)
  } catch {
    return null
  }
}

export const deleteCloudinaryUrl = async (url?: string | null) => {
  const publicId = getCloudinaryPublicId(url)
  if (!publicId) return { skipped: true }

  return cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: 'image'
  })
}

export const deleteCloudinaryUrls = async (urls: Array<string | null | undefined>) => {
  const publicIds = Array.from(new Set(urls.map(getCloudinaryPublicId).filter(Boolean))) as string[]
  const failures: Array<{ publicId: string, error: string }> = []

  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image'
      })
    } catch (error: any) {
      failures.push({ publicId, error: error?.message || 'Error eliminando asset' })
    }
  }

  return { attempted: publicIds.length, failures }
}

export const isCloudinaryFolderUrl = (url: string | null | undefined, folder: string) => {
  const publicId = getCloudinaryPublicId(url)
  return Boolean(publicId?.startsWith(`${folder}/`))
}
