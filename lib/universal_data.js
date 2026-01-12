// lib/universal_data.js

// 1. ALL YOUR SUBJECTS
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

// 3. HOLIDAY LIST (Format: MM-DD)
// Add government holidays here
export const HOLIDAYS = [
  "01-26", // Republic Day
  "08-15", // Independence Day
  "10-02", // Gandhi Jayanti
  "12-25"  // Christmas
];

export function getSubjectByCode(code) {
  return ALL_SUBJECTS.find(s => s.code === code) || { name: "Lab/Other", code };
}
