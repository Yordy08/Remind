const FOLDER_ID = '1vNetzwQWgw9rOuckTTU1uVtVXbLUs_Xb'
const BACKUP_SECRET = 'change-this-backup-secret'

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')

    if (body.secret !== BACKUP_SECRET) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    if (!body.data || !body.filename) {
      return jsonResponse({ success: false, error: 'Missing file data' }, 400)
    }

    const folder = DriveApp.getFolderById(FOLDER_ID)
    const safeFolderName = String(body.folderName || 'uploads').replace(/[^a-z0-9-_]/gi, '-')
    const safeFilename = String(body.filename).replace(/[\\/:*?"<>|]/g, '-')
    const bytes = Utilities.base64Decode(body.data)
    const blob = Utilities.newBlob(bytes, body.mimeType || 'image/jpeg', `${safeFolderName}-${Date.now()}-${safeFilename}`)
    const file = folder.createFile(blob)

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

    return jsonResponse({
      success: true,
      fileId: file.getId(),
      url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
      viewUrl: file.getUrl()
    })
  } catch (error) {
    return jsonResponse({ success: false, error: String(error) }, 500)
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
