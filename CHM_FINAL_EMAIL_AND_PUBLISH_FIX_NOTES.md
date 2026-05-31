# CHM Final Email + One-Click Publish Fix

## Email/contact fix
All contact and prayer forms now use FormSubmit AJAX to send directly to:

yodebepro@gmail.com

The visitor does not need to open Gmail, Outlook, or another email app.

Important: FormSubmit may send a one-time confirmation email to yodebepro@gmail.com. Confirm it once, then messages will send normally.

## Publish/upload fix
Admin publishing was updated so that:
- uploaded images/media are saved into the website data
- saved posts do not disappear after refresh
- publish/post saves immediately
- publish/post pushes globally to GitHub when your GitHub token is configured
- public loaders can read the published content

## Important reality
For true global publishing from GitHub Pages, the website must have either:
1. a GitHub token configured in the admin setup, or
2. Firebase/Cloud storage configured, or
3. another backend.

Without one of those, a static GitHub Pages site cannot write permanent global data for all visitors.
This version saves locally immediately and publishes globally automatically when GitHub token setup is complete.