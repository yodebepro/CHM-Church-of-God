# CHM Sermon Categories Alignment Fix

This update preserves the complete previous baseline and changes only the Sermon Library category naming.

## Admin → Add Sermon categories
- Preaching
- Teaching
- Worship
- Prayer
- Prophecy
- Healing
- Mission

These now match the public Sermon Library category filter exactly. New sermon records save the selected value in both `category` and the existing `series` compatibility field. Older Sunday, Wednesday, Special, Youth, Conference, or Missions values are mapped to the closest current category when edited.

No other website file, feature, layout, or publishing workflow was changed.
