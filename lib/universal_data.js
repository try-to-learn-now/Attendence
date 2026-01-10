// lib/universal_data.js

// 1. ALL YOUR SUBJECTS (The "Autocomplete" List)
export const ALL_SUBJECTS = [
  { name: "Mathematics-II", code: "101" },
  { name: "Physics", code: "102" },
  { name: "B.E.E.", code: "103" },
  { name: "Engineering Graphics", code: "104" },
  { name: "Programming in C", code: "105" }
];

// 2. YOUR HARDCORE ROUTINE (Day: 0=Sun, 1=Mon...)
// Format: "HH:MM AM" (Must match this format for auto-detect)
export const WEEKLY_ROUTINE = {
  1: [ // MONDAY
    { code: "101", time: "10:00 AM" },
    { code: "102", time: "11:30 AM" },
    { code: "105", time: "02:00 PM" }
  ],
  2: [ // TUESDAY
    { code: "103", time: "10:00 AM" },
    { code: "104", time: "01:00 PM" }
  ],
  3: [ // WEDNESDAY
    { code: "101", time: "10:00 AM" }
  ],
  // ... Add 4 (Thu), 5 (Fri), 6 (Sat)
};

export function getSubjectByCode(code) {
  return ALL_SUBJECTS.find(s => s.code === code) || { name: "Unknown", code };
}
