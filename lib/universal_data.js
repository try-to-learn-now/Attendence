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

// 3. HOLIDAY LIST 2026 (Extracted from your image)
// Format: "MM-DD"
export const HOLIDAYS = [
  "01-01", // New Year
  "01-14", // Makar Sankranti
  "01-23", // Basant Panchami
  "01-26", // Republic Day
  "02-04", // Shab-e-Barat
  "03-02", "03-03", "03-04", // Holi (3 Days)
  "03-21", // Eid-ul-Fitr
  "03-26", // Samrat Ashok Jayanti
  "03-27", // Ram Navami
  "03-31", // Mahavir Jayanti
  "04-03", // Good Friday
  "04-14", // Ambedkar Jayanti
  "04-23", // Veer Kunwar Singh
  "04-25", // Janaki Navami
  "05-01", // Labor Day
  "05-28", // Eid-ul-Adha
  "08-04", // Chehallum
  "08-15", // Independence Day
  "08-26", // Hazrat Mohammad Birthday
  "08-28", // Raksha Bandhan
  "09-04", // Janmashtami
  "10-02", // Gandhi Jayanti
  "10-17", "10-18", "10-19", "10-20", // Durga Puja
  "11-08", "11-09", "11-10", "11-11", "11-12", "11-13", "11-14", "11-15", "11-16", // Diwali/Chhath Range
  "11-24", // Guru Nanak
  "12-25"  // Christmas
];

export function getSubjectByCode(code) {
  return ALL_SUBJECTS.find(s => s.code === code) || { name: "Lab/Other", code };
}
