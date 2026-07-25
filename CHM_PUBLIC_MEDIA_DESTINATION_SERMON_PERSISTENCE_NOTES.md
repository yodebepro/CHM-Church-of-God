# CHM Public Media Destination and Sermon Persistence Fix

Only the requested areas changed.

1. Listen Live Admin sources route to `listen-live.html`.
   - CHM Live Service radio remains first.
   - Published links can be loaded from `site-data.json`, `chm-media-sources.json`, or `chm-listen-sources.json`.
   - MP3, Google Drive audio, M3U, M3U8/HLS, and uploaded audio are supported.

2. Watch Live Admin sources route to `watch-live.html`.
   - Published links can be loaded from `site-data.json`, `chm-media-sources.json`, or `chm-watch-sources.json`.
   - YouTube, Vimeo, Google Drive, permanent/embed URLs, iframe code, MP4/WebM, M3U, and M3U8/HLS are supported.

3. Sermon Admin records remain visible after save, publish, refresh, JSON export, and JSON upload.
   - The public Sermon Library layout and completed behavior were not redesigned.

Everything else remains unchanged.
