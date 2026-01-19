// FILE: src/components/TopBar.tsx
"use client";

import { useState } from "react";
import type { DayMode, HolidayOverride } from "@/types/core";

export default function TopBar(props: {
  date: string;
  setDate: (d: string) => void;

  mode: DayMode;
  biometricDone: boolean;
  holidayOverride: HolidayOverride;

  isHoliday: boolean;
  holidayLabel: string;

  note: string;
  onSaveNote: (note: string) => void;

  onSetMode: (m: DayMode) => void;
  onSetBiometric: (v: boolean) => void;
  onSetHolidayOverride: (v: HolidayOverride) => void;

  onResetDay: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [noteDraft, setNoteDraft] = useState(props.note);

  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      <div className="max-w-3xl mx-auto p-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={props.date}
            onChange={(e) => props.setDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <div className="text-xs text-gray-600">
            {props.isHoliday ? `Holiday: ${props.holidayLabel}` : "Working Day"}
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={() => setConfirmReset((v) => !v)} className="text-xs px-2 py-1 rounded border">
              Reset Day
            </button>
            {confirmReset && (
              <button onClick={props.onResetDay} className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                Confirm
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => props.onSetMode("BIOMETRIC")}
            className={`px-3 py-1 rounded text-sm border ${
              props.mode === "BIOMETRIC" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Biometric Mode
          </button>
          <button
            onClick={() => props.onSetMode("ONLINE")}
            className={`px-3 py-1 rounded text-sm border ${
              props.mode === "ONLINE" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Online Mode
          </button>
        </div>

        {props.mode === "BIOMETRIC" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Biometric:</span>
            <button
              onClick={() => props.onSetBiometric(true)}
              className={`px-3 py-1 rounded border text-sm ${props.biometricDone ? "bg-green-600 text-white" : "bg-white"}`}
            >
              YES
            </button>
            <button
              onClick={() => props.onSetBiometric(false)}
              className={`px-3 py-1 rounded border text-sm ${!props.biometricDone ? "bg-red-600 text-white" : "bg-white"}`}
            >
              NO
            </button>
            {!props.biometricDone && (
              <span className="text-xs text-red-700">Default ABSENT for all classes (until you mark PROXY / NO CLASS)</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-600">Online mode: biometric disabled</div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Holiday:</span>
          <select
            value={props.holidayOverride}
            onChange={(e) => props.onSetHolidayOverride(e.target.value as HolidayOverride)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="AUTO">Auto</option>
            <option value="FORCE_HOLIDAY">Force Holiday</option>
            <option value="FORCE_WORKING">Force Working</option>
          </select>
        </div>

        <div className="bg-gray-50 border rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700">Today studied (saved in DB, NOT printed in clean PDF)</div>
          <div className="flex gap-2 mt-1">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="What did you study today?"
              className="border rounded px-2 py-2 w-full text-sm bg-white"
            />
            <button
              onClick={() => props.onSaveNote(noteDraft)}
              className="px-3 py-2 rounded bg-gray-900 text-white text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
