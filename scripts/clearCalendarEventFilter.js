// One-time cleanup: calendarEventFilter's default-preference toggle was silenced in /settings
// 2026-08-15 13:01 EDT (Harkirat's direct request) -- /calendar no longer reads this field, so any
// value already saved on a UserPreference doc is now dead data. Unscoped $unset is correct here
// (unlike a cache field keyed on an algorithm version) because this isn't invalidating a cache, it's
// removing a preference nothing reads anymore -- every user gets the identical, harmless outcome.
// Run once: node scripts/clearCalendarEventFilter.js
require('dotenv').config();
const mongoose = require('mongoose');
const UserPreference = require('../models/UserPreference');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await UserPreference.updateMany({ calendarEventFilter: { $exists: true } }, { $unset: { calendarEventFilter: 1 } });
    console.log(`Cleared calendarEventFilter from ${res.modifiedCount} of ${res.matchedCount} matched preference doc(s).`);
    await mongoose.disconnect();
})();
