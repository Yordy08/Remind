type UploadBackupOptions = {
  buffer: Buffer
  filename: string
  mimeType?: string
  folderName?: string
}

type DriveBackup = {
  fileId: string
  url: string
}

export const uploadGoogleDriveBackup = async ({
  buffer,
  filename,
  mimeType = 'image/jpeg',
  folderName
}: UploadBackupOptions): Promise<DriveBackup | null> => {
  const backupUrl = process.env.GOOGLE_APPS_SCRIPT_BACKUP_URL
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET

  if (!backupUrl || !secret) return null

  try {
    const response = await fetch(backupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret,
        filename,
        mimeType,
        folderName,
        data: buffer.toString('base64')
      })
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script backup failed: ${response.status}`)
    }

    const result = await response.json()
    const fileId = result.fileId
    if (!fileId) return null

    return {
      fileId,
      url: result.url || `https://drive.google.com/uc?export=view&id=${fileId}`
    }
  } catch (error) {
    console.error('Error creando backup con Google Apps Script:', error)
    return null
  }
}
