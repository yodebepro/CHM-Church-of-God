# CHM Direct Email Send Update

This update changes the contact behavior so visitors do NOT have to open Gmail, Outlook, Apple Mail, or any extra email app.

What changed:
- Contact buttons open an on-site contact form.
- Connect buttons open an on-site contact form.
- Prayer Request buttons/forms submit from the website.
- Footer contact/prayer buttons submit from the website.
- Any contact/prayer forms detected in the site are intercepted and sent directly.
- Messages are sent to: theworldprayerline@outlook.com
- The email address does not need to show on the public page.

Important:
This static GitHub Pages version uses FormSubmit AJAX to send directly from the browser.
The first time you use FormSubmit with the inbox, the inbox may receive a confirmation email from FormSubmit.
Confirm it once, then future messages will send directly.

For a fully private professional system later, use Firebase Cloud Functions, EmailJS, Resend, SendGrid, or a custom backend SMTP service.