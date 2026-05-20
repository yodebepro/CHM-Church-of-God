# CHM CMS — Google Cloud Storage Upload Integration

This version changes the admin upload system so photos, MP3 files, and MP4/video files upload to Google Cloud Storage first. The CMS then saves the Google Cloud URL into `site-data.json`, so the public website can show the media globally.

## Important security rule

Do **not** paste your Google service account JSON into HTML or JavaScript. Keep it only on the backend/server.

Because a key identifier was shared in chat, the safest action is:
1. Go to Google Cloud Console → IAM & Admin → Service Accounts.
2. Open `yodebepro@chmnetwork-69e11.iam.gserviceaccount.com`.
3. Delete the old key.
4. Create a new JSON key.
5. Store the new JSON file privately.

## Setup

1. Install Node.js.
2. Open this folder in a terminal.
3. Run:

```bash
npm install
```

4. Create a folder named `private`.
5. Put your Google JSON key inside it and name it:

```text
private/service-account.json
```

6. Copy `.env.example` to `.env`.
7. Make sure this line matches your bucket name:

```text
GCS_BUCKET=chmnetwork
```

8. Start the website/backend:

```bash
npm start
```

9. Open:

```text
http://localhost:3000/login.html
```

## Google Cloud permissions

Your service account needs permission to upload to the bucket. Recommended role:

- Storage Object Admin

For public website media, your bucket/object must be readable publicly. The easiest setting is:

- Bucket → Permissions → Grant access
- Principal: `allUsers`
- Role: `Storage Object Viewer`

Only do this for public website media, not private documents.

## What changed

- `admin.js`
  - Added `uploadFileToCloud(file, statusEl)`
  - Changed `uploadPhoto()` to upload images to `/api/upload`

- `adm-sermons.html`
  - Audio/video uploads now go to Google Cloud

- `pages.html`
  - Hero video upload now goes to Google Cloud

- `dashboard.html`
  - Hero video upload now goes to Google Cloud

- Added backend files:
  - `server.js`
  - `package.json`
  - `.env.example`

## Why this fixes the local-only problem

Before, files were stored as base64 in the browser/localStorage. That only works on your computer. This version uploads the actual file to Google Cloud Storage and stores a public URL, so every device can load the same file.
