# CHM Targeted Homepage Leadership, About Tabs, and Hero Sync Fix

This package preserves the entire previous baseline and changes only the three requested areas.

1. The homepage leadership preview now mirrors the published Senior Pastor, Executive Pastor, Worship Director, and Outreach Director media into the exact matching blue cards.
2. The About Page Editor tabs are repaired with direct event listeners, keyboard support, active-pane state, and responsive horizontal navigation.
3. CHM True CMS now synchronizes the current Hero URL and playback settings into site-data.json before Export JSON or Push All to GitHub. Google Drive file/d/view and docs/videos/d/play links remain supported, with expanded direct-stream attempts and Google preview fallback.

Google Drive files must be shared as Anyone with the link. Large Drive videos may still fall back to Google's preview player because Google can block direct cross-site streaming.
