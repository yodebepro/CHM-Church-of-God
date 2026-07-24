# CHM targeted admin/media/inbox update

Preserved all previous files and layouts. Updated only:
- Sermon URL/upload persistence and playable public players.
- Gallery categories aligned to Worship, Outreach, Events, Ministry, Youth, Baptism; photos render inside category cards.
- Sermons, Gallery, Departments, Teams, Giving, Messages, and Prayer Requests repopulate after refresh from local storage and named JSON exports.
- Giving Record modal repaired; gift types plus JSON import/export added.
- Contact and Prayer public forms mirror submissions into Admin inbox storage, with Firestore mirroring when configured.

Static-site limitation: cross-device inbox synchronization requires configured Firebase/Firestore; without it, the mirrored Admin inbox is stored on the same browser/device while email delivery continues through the existing form workflow.