# CHM CHURCH OF GOD — Blueprint CMS Upgrade

This upgrade keeps the existing church interface and adds the missing blueprint controls instead of removing the current design.

## Added Admin Controls
New admin pages were added for:
- Home Page Control
- About Page Control
- Give Page Control
- Church Teams Control
- Departments Control
- Sacred Ministries Control
- Locations / Campuses Control
- Live Video / Radio / Media Control
- Navigation & Dropdown Menu Control
- Footer Control
- Language Control
- Media Upload Library
- Blueprint Sections Control

## Every new module supports
- Add
- Upload file
- Save draft
- Publish / Post
- Edit
- Archive
- Delete / Remove
- Text color
- Background color
- Public page publishing through Firebase when Firebase is configured

## Important
GitHub Pages alone cannot store uploaded files globally. For global uploads, configure Firebase Storage and keep your Firebase config in `firebase-config.js`.

## Admin URL
Use your existing admin login flow. After login, use the sidebar to access the new blueprint modules.

## Firebase
This package supports Firebase Firestore and Firebase Storage. Fill `firebase-config.js` with your Firebase project config.