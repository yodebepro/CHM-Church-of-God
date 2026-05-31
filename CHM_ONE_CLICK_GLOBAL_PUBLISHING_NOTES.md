# CHM One-Click Global Publishing Fixed

This version keeps the working contact form baseline and adds one-click global publishing.

## What is fixed
- Admin uploads photos/videos/audio/files to the GitHub repository `/uploads` folder when a GitHub token is configured.
- Admin Publish/Post updates `site-data.json` immediately.
- Published content becomes global for all visitors after GitHub Pages refreshes.
- Content does not disappear after refreshing the page.
- Public pages read published data from `site-data.json`.

## Supported content
- Photos
- Announcements
- Leader profiles
- Events
- Sermons
- Gallery
- Page content
- Departments
- Navigation
- Members
- Leadership
- Teams
- About page
- Ministries
- Prayer requests
- Messages
- Giving reports

## One-time setup
Open:
`github-setup.html`

Save:
- GitHub owner: yodebepro
- Repo: CHM-Church-of-God
- Branch: main
- GitHub token with Contents Read/Write permission

After that, Publish/Post works globally in one click.

## Important
A static GitHub Pages site cannot permanently write global data without a write service. This version uses the GitHub API as that write service.