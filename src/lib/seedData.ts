// FILE: src/lib/seedData.ts
export const SEED_SUBJECTS = [
  { code: "104501", name: "Computer Networks and Security", teacher: "Asst. Prof. Shams Tabrej (ST)" },
  { code: "104502", name: "Digital Signal Processing", teacher: "Asst. Prof. Himanshu Kr. Shekhar (HKS)" },
  { code: "104503", name: "Linear Control Systems", teacher: "Asst. Prof. Deeba Ashique (DA)" },
  { code: "104504", name: "Linear Integrated Circuits and Applications", teacher: "Asst. Prof. Rajeev Ranjan (RR)" },
  { code: "104505", name: "Microprocessors and Microcontrollers", teacher: "Asst. Prof. Shanti Jaiswal (SJ)" },
  { code: "104506", name: "Probability Theory and Stochastic Processes", teacher: "Dr. Bikram Kumar (BK)" },

  { code: "104502P", name: "Digital Signal Processing Lab", teacher: "HKS + Mr. Bhola Kr. Roy (BKR)" },
  { code: "104504P", name: "LIC and Applications Lab", teacher: "RR + Mr. Ramesh Dinkar (RD)" },
  { code: "104505P", name: "Microprocessors Lab", teacher: "SJ + Mr. Ramesh Dinkar (RD)" },

  { code: "TG", name: "TG Interaction", teacher: "" },
  { code: "LIB", name: "Library", teacher: "" }
];

// BREAK 01:00-02:00 not stored
export const SEED_ROUTINE = [
  // MON (1)
  { day: 1, timeSlot: "10:00-11:00", code: "104501" },
  { day: 1, timeSlot: "11:00-12:00", code: "104505" },
  { day: 1, timeSlot: "12:00-01:00", code: "104504" },
  { day: 1, timeSlot: "02:00-03:00", code: "TG" },
  { day: 1, timeSlot: "03:00-04:00", code: "104502" },
  { day: 1, timeSlot: "04:00-05:00", code: "104502" },

  // TUE (2)
  { day: 2, timeSlot: "10:00-11:00", code: "104501" },
  { day: 2, timeSlot: "11:00-12:00", code: "104505" },
  { day: 2, timeSlot: "12:00-01:00", code: "104504" },
  { day: 2, timeSlot: "02:00-03:00", code: "LIB" },
  { day: 2, timeSlot: "03:00-04:00", code: "104506" },
  { day: 2, timeSlot: "04:00-05:00", code: "104502" },

  // WED (3)
  { day: 3, timeSlot: "10:00-11:00", code: "104501" },
  { day: 3, timeSlot: "11:00-12:00", code: "104505" },
  { day: 3, timeSlot: "12:00-01:00", code: "104503" },
  { day: 3, timeSlot: "02:00-03:00", code: "104506" },
  { day: 3, timeSlot: "03:00-04:00", code: "104505P" },
  { day: 3, timeSlot: "04:00-05:00", code: "104505P" },

  // THU (4)
  { day: 4, timeSlot: "11:00-12:00", code: "104504" },
  { day: 4, timeSlot: "12:00-01:00", code: "104503" },
  { day: 4, timeSlot: "02:00-03:00", code: "104506" },
  { day: 4, timeSlot: "03:00-04:00", code: "104505P" },
  { day: 4, timeSlot: "04:00-05:00", code: "104505P" },

  // FRI (5) (sheet: LIC Lab / DSP Lab -> default LIC lab; swap when needed)
  { day: 5, timeSlot: "10:00-11:00", code: "104504P" },
  { day: 5, timeSlot: "11:00-12:00", code: "104504P" },
  { day: 5, timeSlot: "12:00-01:00", code: "104503" },

  // SAT (6)
  { day: 6, timeSlot: "10:00-11:00", code: "104504P" },
  { day: 6, timeSlot: "11:00-12:00", code: "104504P" },
  { day: 6, timeSlot: "12:00-01:00", code: "104503" },
  { day: 6, timeSlot: "04:00-05:00", code: "LIB" }
];
