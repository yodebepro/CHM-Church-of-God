# CHM Contact Form Validation + Send Fix

Problem fixed:
- Contact page showed: "Please fill in your name and message."
- The form did not have the expected `ctName` field, so the old script thought the name was empty.

What changed:
- First Name field now has `id="ctFirstName"` and `name="firstName"`.
- Last Name field now has `id="ctLastName"` and `name="lastName"`.
- The send function now combines first + last name correctly.
- The message sends directly with FormSubmit AJAX to `yodebepro@gmail.com`.
- No email app opens.
- Old mailto fallback was removed from the contact submit function.

Important:
FormSubmit may require one-time confirmation in the yodebepro@gmail.com inbox.