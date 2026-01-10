// lib/timetable.js
export const TIMETABLE = {
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  1: [ // Monday
    { name: "Maths", code: "101", time: "10:00 AM" },
    { name: "Physics", code: "102", time: "11:30 AM" },
    { type: "LUNCH", time: "01:00 PM" }, // Special Lunch Block
    { name: "Chemistry", code: "103", time: "02:00 PM" }
  ],
  2: [ // Tuesday
    { name: "Maths", code: "101", time: "10:00 AM" },
    // Add your schedule here...
  ],
  // ... Add other days
};
