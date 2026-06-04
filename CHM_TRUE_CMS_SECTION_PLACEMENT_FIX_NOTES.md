# CHM True CMS Section Placement Fix

This fixes the issue where globally-published photos, videos, leaders, gallery items, events, announcements, sermons, ministries, departments, team members, locations, and page content were not appearing in the correct public sections.

## What changed
- Added `chm-section-placement-fix.js`.
- Published leader profiles now fill the Leadership page leader cards.
- Published gallery photos now fill Gallery page photo cards.
- Published events now fill Events page cards.
- Published announcements now fill Announcement page cards.
- Published sermons now fill Sermon page cards.
- Published ministries now fill Ministry page cards.
- Published departments now fill Department page cards.
- Published teams now fill Team page cards.
- Published locations now fill Location page cards.
- Published hero intro video now fills the hero video background area.

## How to use
1. Upload this package to GitHub.
2. Open `github-setup.html` only if the token is not already saved.
3. Go to Admin → `true-cms.html`.
4. Publish a leader/gallery/event/etc.
5. Open the matching public page and hard refresh.

## Important
For all devices to see the update, the GitHub token must be saved and the publish action must successfully update `site-data.json`.