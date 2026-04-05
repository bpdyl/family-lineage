import { google } from 'googleapis';
import { Readable } from 'stream';

const BACKUP_FILENAME = 'family_lineage.json';

/**
 * Google Drive backup service using a Service Account.
 *
 * Setup:
 * 1. Create a Service Account in Google Cloud Console
 * 2. Download the JSON key file
 * 3. Set GOOGLE_SERVICE_ACCOUNT_KEY env var to the JSON string (or base64-encoded)
 * 4. Create a folder in admin's Google Drive
 * 5. Share that folder with the service account email (with Editor role)
 * 6. Set GOOGLE_DRIVE_FOLDER_ID env var to the folder ID
 */

function getAuth() {
  const keyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyEnv) return null;

  let credentials;
  try {
    // Try parsing as plain JSON first
    credentials = JSON.parse(keyEnv);
  } catch {
    // Try base64-decoded JSON
    try {
      credentials = JSON.parse(Buffer.from(keyEnv, 'base64').toString('utf-8'));
    } catch {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY');
      return null;
    }
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

function getDrive() {
  const auth = getAuth();
  if (!auth) return null;
  return google.drive({ version: 'v3', auth });
}

function getFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || null;
}

export function isGdriveConfigured() {
  return !!(getAuth() && getFolderId());
}

/**
 * Find the existing backup file in the Drive folder (if any).
 */
async function findExistingFile(drive, folderId) {
  const res = await drive.files.list({
    q: `name = '${BACKUP_FILENAME}' and '${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  });
  return res.data.files?.[0] || null;
}

/**
 * Upload (or update) family_lineage.json to Google Drive.
 * Returns the file ID.
 */
export async function uploadBackup(jsonContent) {
  const drive = getDrive();
  const folderId = getFolderId();
  if (!drive || !folderId) {
    throw new Error('Google Drive not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DRIVE_FOLDER_ID.');
  }

  const media = {
    mimeType: 'application/json',
    body: Readable.from(Buffer.from(typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent, null, 4), 'utf-8')),
  };

  const existing = await findExistingFile(drive, folderId);

  if (existing) {
    // Update existing file
    const res = await drive.files.update({
      fileId: existing.id,
      media,
      fields: 'id, name, modifiedTime',
    });
    return { fileId: res.data.id, action: 'updated', modifiedTime: res.data.modifiedTime };
  }

  // Create new file
  const res = await drive.files.create({
    requestBody: {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      parents: [folderId],
    },
    media,
    fields: 'id, name, modifiedTime',
  });
  return { fileId: res.data.id, action: 'created', modifiedTime: res.data.modifiedTime };
}

/**
 * Download family_lineage.json from Google Drive.
 * Returns parsed JSON object or null if not found.
 */
export async function downloadBackup() {
  const drive = getDrive();
  const folderId = getFolderId();
  if (!drive || !folderId) {
    return null;
  }

  const existing = await findExistingFile(drive, folderId);
  if (!existing) {
    return null;
  }

  const res = await drive.files.get(
    { fileId: existing.id, alt: 'media' },
    { responseType: 'text' }
  );

  return JSON.parse(res.data);
}
