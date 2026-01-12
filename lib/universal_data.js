// lib/universal_data.js

// 1. ALL YOUR SUBJECTS (Theory + Practical)
export const ALL_SUBJECTS = [
  // THEORY
  { name: "Computer Networks and Security", code: "104501" },
  { name: "Digital Signal Processing", code: "104502" },
  { name: "Linear Control Systems", code: "104503" },
  { name: "Linear Integrated Circuits", code: "104504" },
  { name: "Microprocessors & Microcontrollers", code: "104505" },
  { name: "Probability Theory & Stochastic", code: "104506" },
  
  // PRACTICALS / LABS
  { name: "Summer Entrepreneurship - II", code: "100510P" },
  { name: "Digital Signal Processing Lab", code: "104502P" },
  { name: "Linear Integrated Circuits Lab", code: "104504P" },
  { name: "Microprocessors Lab", code: "104505P" },
  
  // OTHERS
  { name: "Library / TG Interaction", code: "LIB-TG" }
];

// 2. YOUR HARDCORE ROUTINE (Derived from Timetable)
// Day 1 = Monday, 6 = Saturday
export const WEEKLY_ROUTINE = {
  1: [ // MONDAY
    { code: "104501", time: "10:00 AM" }, // CNS
    { code: "104505", time: "11:00 AM" }, // uP
    { code: "104504", time: "12:00 PM" }, // LIC
    { code: "LIB-TG", time: "02:00 PM" }, // TG Interaction
    { code: "104502", time: "03:00 PM" }, // DSP
    { code: "104502", time: "04:00 PM" }  // DSP
  ],
  2: [ // TUESDAY
    { code: "104501", time: "10:00 AM" }, // CNS
    { code: "104505", time: "11:00 AM" }, // uP
    { code: "104504", time: "12:00 PM" }, // LIC
    { code: "LIB-TG", time: "02:00 PM" }, // Library
    { code: "104506", time: "03:00 PM" }, // PTSP
    { code: "104502", time: "04:00 PM" }  // DSP
  ],
  3: [ // WEDNESDAY
    { code: "104501", time: "10:00 AM" }, // CNS
    { code: "104505", time: "11:00 AM" }, // uP
    { code: "104503", time: "12:00 PM" }, // LCS
    { code: "104506", time: "02:00 PM" }, // PTSP
    { code: "104505P", time: "03:00 PM" }, // uP Lab
    { code: "104505P", time: "04:00 PM" }  // uP Lab
  ],
  4: [ // THURSDAY (10 AM is empty in timetable)
    { code: "104504", time: "11:00 AM" }, // LIC
    { code: "104503", time: "12:00 PM" }, // LCS
    { code: "104506", time: "02:00 PM" }, // PTSP
    { code: "104505P", time: "03:00 PM" }, // uP Lab
    { code: "104505P", time: "04:00 PM" }  // uP Lab
  ],
  5: [ // FRIDAY (Labs are shared/alternating, using both codes as placeholder name)
    { code: "104504P", time: "10:00 AM" }, // LIC Lab / DSP Lab
    { code: "104504P", time: "11:00 AM" }, // LIC Lab / DSP Lab
    { code: "104503", time: "12:00 PM" }   // LCS
  ],
  6: [ // SATURDAY
    { code: "104504P", time: "10:00 AM" }, // LIC Lab / DSP Lab
    { code: "104504P", time: "11:00 AM" }, // LIC Lab / DSP Lab
    { code: "104503", time: "12:00 PM" },  // LCS (Tutorial)
    { code: "LIB-TG", time: "04:00 PM" }   // Library
  ]
};

export function getSubjectByCode(code) {
  // Fallback if code is missing (e.g. for shared labs, default to the first one found)
  return ALL_SUBJECTS.find(s => s.code === code) || { name: "Lab/Other", code };
}
