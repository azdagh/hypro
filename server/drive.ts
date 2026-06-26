import { google } from 'googleapis';
import { Readable } from 'stream';

let driveInstance: any = null;

/**
 * Lazy initialization of Google Auth JWT and the Drive v3 client.
 * Prevents app crashes if Google credentials are not yet supplied.
 */
export function getGoogleDriveClient() {
  if (!driveInstance) {
    let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const json = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        clientEmail = json.client_email;
        privateKey = json.private_key;
      } catch (e: any) {
        console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
      }
    }

    if (!clientEmail || !privateKey) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_JSON) environment variables are required for live Google Drive operations.'
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    driveInstance = google.drive({ version: 'v3', auth });
  }
  return driveInstance;
}

/**
 * Uploads a file (from buffer) to a specified Google Drive folder, configures public reader access,
 * and returns the drive_file_id, webViewLink, and webContentLink.
 * 
 * @param fileName Name of the file on Drive
 * @param mimeType MIME type of the file
 * @param fileBuffer Buffer contents of the uploaded receipt/file
 * @param folderId Optional Google Drive parent folder ID
 * @param userEmail Optional email address of the ERP user to share with securely
 */
export async function uploadReceiptToDrive(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  folderId?: string,
  userEmail?: string
): Promise<{ drive_file_id: string; webViewLink: string; webContentLink: string }> {
  const drive = getGoogleDriveClient();

  // Create stream from buffer
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  // 1. Upload Implementation
  const fileMetadata: Record<string, any> = {
    name: fileName,
  };
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType: mimeType,
    body: bufferStream,
  };

  const uploadRes = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  const fileId = uploadRes.data.id;
  if (!fileId) {
    throw new Error('Google Drive upload failed to retrieve a valid file ID.');
  }

  // 2. Permission Implementation: Share with logged-in user or domain instead of public 'anyone'
  if (userEmail && userEmail.includes('@')) {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: userEmail,
      },
    });
  } else {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'domain',
        domain: 'hypro.dz',
      },
    });
  }

  // Re-fetch file links to get fully resolved webViewLink and webContentLink
  const fileDetails = await drive.files.get({
    fileId: fileId,
    fields: 'id, webViewLink, webContentLink',
  });

  return {
    drive_file_id: fileDetails.data.id || fileId,
    webViewLink: fileDetails.data.webViewLink || '',
    webContentLink: fileDetails.data.webContentLink || '',
  };
}
