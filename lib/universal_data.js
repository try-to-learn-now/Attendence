// lib/universal_data.js

// 1. ALL SUBJECTS
export const ALL_SUBJECTS = [
  // THEORY
  { name: "Computer Networks and Security", code: "104501" },
  { name: "Digital Signal Processing", code: "104502" },
  { name: "Linear Control Systems", code: "104503" },
  { name: "Linear Integrated Circuits", code: "104504" },
  { name: "Microprocessors & Microcontrollers", code: "104505" },
  { name: "Probability Theory & Stochastic", code: "104506" },
  // LABS
  { name: "Summer Entrepreneurship - II", code: "100510P" },
  { name: "Digital Signal Processing Lab", code: "104502P" },
  { name: "Linear Integrated Circuits Lab", code: "104504P" },
  { name: "Microprocessors Lab", code: "104505P" },
  // OTHERS
  { name: "Library / TG Interaction", code: "LIB-TG" }
];

// 2. WEEKLY ROUTINE
export const WEEKLY_ROUTINE = {
  1: [ // MONDAY
    { code: "104501", time: "10:00 AM" }, 
    { code: "104505", time: "11:00 AM" }, 
    { code: "104504", time: "12:00 PM" }, 
    { code: "LIB-TG", time: "02:00 PM" }, 
    { code: "104502", time: "03:00 PM" }, 
    { code: "104502", time: "04:00 PM" }  
  ],
  2: [ // TUESDAY
    { code: "104501", time: "10:00 AM" }, 
    { code: "104505", time: "11:00 AM" }, 
    { code: "104504", time: "12:00 PM" }, 
    { code: "LIB-TG", time: "02:00 PM" }, 
    { code: "104506", time: "03:00 PM" }, 
    { code: "104502", time: "04:00 PM" } 
  ],
  3: [ // WEDNESDAY
    { code: "104501", time: "10:00 AM" }, 
    { code: "104505", time: "11:00 AM" }, 
    { code: "104503", time: "12:00 PM" }, 
    { code: "104506", time: "02:00 PM" }, 
    { code: "104505P", time: "03:00 PM" }, 
    { code: "104505P", time: "04:00 PM" }  
  ],
  4: [ // THURSDAY
    { code: "104504", time: "11:00 AM" }, 
    { code: "104503", time: "12:00 PM" }, 
    { code: "104506", time: "02:00 PM" }, 
    { code: "104505P", time: "03:00 PM" }, 
    { code: "104505P", time: "04:00 PM" }  
  ],
  5: [ // FRIDAY
    { code: "104504P", time: "10:00 AM" }, 
    { code: "104504P", time: "11:00 AM" }, 
    { code: "104503", time: "12:00 PM" }   
  ],
  6: [ // SATURDAY
    { code: "104504P", time: "10:00 AM" }, 
    { code: "104504P", time: "11:00 AM" }, 
    { code: "104503", time: "12:00 PM" }, 
    { code: "LIB-TG", time: "04:00 PM" }   
  ]
};

// 3. HOLIDAY LIST 2026 (Extracted from your Calendar)
export const HOLIDAYS = [
  "01-01", "01-14", "01-23", "01-26", "02-04", 
  "03-02", "03-03", "03-04", "03-21", "03-26", "03-27", "03-31", 
  "04-03", "04-14", "04-23", "04-25", "05-01", "05-28", 
  "08-04", "08-15", "08-26", "08-28", "09-04", "10-02", 
  "10-17", "10-18", "10-19", "10-20", 
  "11-08", "11-09", "11-10", "11-11", "11-12", "11-13", "11-14", "11-15", "11-16", 
  "11-24", "12-25"
];

export function getSubjectByCode(code) {
  return ALL_SUBJECTS.find(s => s.code === code) || { name: "Lab/Other", code };
}
