// FILE: src/types/core.ts
export type DayMode = "BIOMETRIC" | "ONLINE";
export type HolidayOverride = "AUTO" | "FORCE_HOLIDAY" | "FORCE_WORKING";

export type AttendanceStatus =
  | "PRESENT"
  | "PRESENT_PROXY"
  | "PROXY"
  | "ABSENT"
  | "NO_CLASS";

export const TIME_SLOTS = [
  "10:00-11:00",
  "11:00-12:00",
  "12:00-01:00",
  // BREAK 01:00-02:00 (not stored)
  "02:00-03:00",
  "03:00-04:00",
  "04:00-05:00"
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  PRESENT_PROXY: "Present+Proxy",
  PROXY: "Proxy",
  ABSENT: "Absent",
  NO_CLASS: "No Class"
};

export const STATUS_COLOR: Record<AttendanceStatus, string> = {
  PRESENT: "text-green-700",
  PRESENT_PROXY: "text-orange-700",
  PROXY: "text-black",
  ABSENT: "text-red-700",
  NO_CLASS: "text-gray-500"
};

export const STATUS_BG: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100",
  PRESENT_PROXY: "bg-orange-100",
  PROXY: "bg-gray-200",
  ABSENT: "bg-red-100",
  NO_CLASS: "bg-gray-100"
};
