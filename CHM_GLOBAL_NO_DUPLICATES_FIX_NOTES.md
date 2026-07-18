# CHM Global No-Duplicates Update

Applied across all public pages without renaming or removing existing website files.

## Behavior
- Uploading or publishing a photo, video, audio file, document, or other attachment updates the matching existing public card.
- It does not create a second copy at the bottom.
- If an older script briefly injects a repeated card, the global guard transfers the media/file link to the original card and removes the duplicate.
- Truly new records that do not match an existing card are still allowed and appear once.
- Ministry custom categories and new ministry sections remain supported.
- JSON import/export, Save Draft, Publish Globally, and GitHub filenames remain unchanged.

## Main compatibility file
`chm-no-duplicates.js` is loaded last on every public page so it can guard against duplicate output from any earlier renderer.