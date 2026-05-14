# CHM Publish Visibility Fix

This package fixes the issue where photos, gallery items, leaders, announcements, and other records saved/published in the admin did not show on the public pages.

Fixes included:
- Admin now saves both `_status` and `status`.
- Admin now normalizes image fields as `mediaUrl`, `imageUrl`, `photoUrl`, and `thumbnailUrl`.
- Public pages now load published items from Firebase.
- Public pages also display same-browser local published items immediately.
- Announcements, gallery, leaders, ministries, events, sermons, teams, departments, locations, and blueprint modules are mapped to public pages.

Important:
For changes to show globally on all visitors’ phones/computers, Firebase must be configured in `firebase-config.js`.
Without Firebase, changes can show in the same browser only.