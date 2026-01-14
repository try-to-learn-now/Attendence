// app/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  WEEKLY_ROUTINE,
  ALL_SUBJECTS,
  getSubjectByCode,
  HOLIDAYS,
} from "@/lib/universal_data";
import SubjectCard from "@/components/SubjectCard";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

function time12ToMinutes(t) {
  // "02:00 PM"
  const [hm, ap] = t.trim().split(" ");
  const [hStr, mStr] = hm.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function timeInputTo12h(val) {
  // "14:00" => "02:00 PM"
  if (!val) return "";
  const [hh, mm] = val.split(":").map(Number);
  const total = hh * 60 + mm;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [dayName, setDayName] = useState("");

  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [biometricDone, setBiometricDone] = useState(false);
  const [isHardHoliday, setIsHardHoliday] = useState(false);
  const [isManualHoliday, setIsManualHoliday] = useState(false);
  const [isFuture, setIsFuture] = useState(false);

  const [dailySwaps, setDailySwaps] = useState([]);
  const [dailyExtras, setDailyExtras] = useState([]);

  // Manage UI
  const [manageMode, setManageMode] = useState("SWAP"); // "SWAP" | "EXTRA"
  const [swapTime, setSwapTime] = useState("");
  const [swapToCode, setSwapToCode] = useState("");

  const [extraTime, setExtraTime] = useState(""); // input type=time
  const [extraCode, setExtraCode] = useState("");

  const [uiMsg, setUiMsg] = useState("");

  const isHoliday = isHardHoliday || isManualHoliday;

  const nonExtraSlots = useMemo(() => {
    const list = [...todayClasses].filter((c) => c.type !== "EXTRA");
    list.sort((a, b) => time12ToMinutes(a.time) - time12ToMinutes(b.time));
    return list;
  }, [todayClasses]);

  async function refreshDashboard() {
    setLoading(true);

    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay();
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    setDayName(days[dayIndex]);

    // future check
    const t = todayISO();
    setIsFuture(selectedDate > t);

    // hard holiday check
    const dateMonth = selectedDate.slice(5);
    const isSunday = dayIndex === 0;
    const isGovHoliday = HOLIDAYS.includes(dateMonth);
    setIsHardHoliday(isSunday || isGovHoliday);

    // routine
    const routineRaw = WEEKLY_ROUTINE[dayIndex] || [];
    let routine = routineRaw.map((slot) => {
      const sub = getSubjectByCode(slot.code);
      return {
        time: slot.time,
        type: "ROUTINE",
        scheduledCode: slot.code,
        code: slot.code,
        name: sub.name,
      };
    });

    // daily log (bio/holiday/swaps/extras)
    const bioRes = await fetch(`/api/daily-log?date=${selectedDate}`);
    const bioData = await bioRes.json();
    setBiometricDone(Boolean(bioData?.biometric));
    setIsManualHoliday(Boolean(bioData?.is_holiday));
    setDailySwaps(bioData?.swaps || []);
    setDailyExtras(bioData?.extras || []);

    // apply swaps to routine
    routine = routine.map((cls) => {
      const sw = (bioData?.swaps || []).find((s) => s.timeSlot === cls.time);
      if (!sw) return cls;

      const actual = getSubjectByCode(sw.toCode);
      return {
        ...cls,
        type: "SWAP",
        code: sw.toCode,
        name: actual.name,
      };
    });

    // extras from daily log
    const extras = (bioData?.extras || []).map((e) => {
      const sub = getSubjectByCode(e.code);
      return {
        time: e.timeSlot,
        type: "EXTRA",
        code: e.code,
        name: sub.name,
        scheduledCode: "",
      };
    });

    // merge + sort (AM/PM correct)
    let finalList = [...routine, ...extras];
    finalList.sort((a, b) => time12ToMinutes(a.time) - time12ToMinutes(b.time));

    // period numbering
    finalList = finalList.map((c, idx) => ({ ...c, period: idx + 1 }));

    setTodayClasses(finalList);
    setLoading(false);

    // default swap time for the day (keep previous if it still exists)
    setSwapTime((prev) => {
      if (routine.length === 0) return "";
      const ok = routine.some((r) => r.time === prev);
      return ok ? prev : routine[0].time;
    });
  }

  useEffect(() => {
    // reset quick inputs when switching dates
    setUiMsg("");
    setSwapToCode("");
    setExtraTime("");
    setExtraCode("");

    refreshDashboard();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function toggleBiometric() {
    if (isFuture) return;
    const newState = !biometricDone;
    setBiometricDone(newState);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biometric: newState, dateString: selectedDate }),
    });
  }

  async function toggleManualHoliday() {
    if (isFuture) return;
    const newState = !isManualHoliday;
    setIsManualHoliday(newState);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_holiday: newState, dateString: selectedDate }),
    });
  }

  async function applySwap() {
    if (isFuture) return;
    setUiMsg("");

    const timeSlot = swapTime;
    if (!timeSlot || !swapToCode) return;

    const slot = nonExtraSlots.find((c) => c.time === timeSlot);
    const fromCode = slot?.scheduledCode || slot?.code;
    if (!fromCode) return;

    // if swapping back to scheduled code, just remove swap
    if (swapToCode === fromCode) {
      await removeSwap(timeSlot);
      setSwapToCode("");
      return;
    }

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        swap: { timeSlot, fromCode, toCode: swapToCode },
      }),
    });

    setUiMsg(`Swap saved: ${fromCode} → ${swapToCode} @ ${timeSlot}`);
    setSwapToCode("");
    refreshDashboard();
  }

  async function removeSwap(timeSlot) {
    if (isFuture) return;
    setUiMsg("");

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateString: selectedDate, removeSwap: { timeSlot } }),
    });

    setUiMsg(`Swap removed @ ${timeSlot}`);
    refreshDashboard();
  }

  async function addExtra() {
    if (isFuture) return;
    setUiMsg("");

    const timeSlot = timeInputTo12h(extraTime);
    if (!timeSlot || !extraCode) return;

    // In EXTRA mode, we don't auto-swap. If time conflicts, tell user to use SWAP mode.
    const hasRoutineAtTime = nonExtraSlots.some((c) => c.time === timeSlot);
    if (hasRoutineAtTime) {
      setUiMsg("This time already has a routine class. Use SWAP mode instead.");
      return;
    }

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        extra: { timeSlot, code: extraCode },
      }),
    });

    setUiMsg(`Extra added: ${extraCode} @ ${timeSlot}`);
    setExtraTime("");
    setExtraCode("");
    refreshDashboard();
  }

  async function removeExtra(timeSlot, code) {
    if (isFuture) return;
    setUiMsg("");

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        removeExtra: { timeSlot, code },
      }),
    });

    setUiMsg(`Extra removed: ${code} @ ${timeSlot}`);
    refreshDashboard();
  }

  // ongoing highlight logic: only for today
  const ongoingTime = useMemo(() => {
    const isToday = selectedDate === todayISO();
    if (!isToday) return null;
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime, selectedDate]);

  const ongoingSlot = useMemo(() => {
    if (ongoingTime == null || todayClasses.length === 0) return null;

    const sorted = [...todayClasses].sort(
      (a, b) => time12ToMinutes(a.time) - time12ToMinutes(b.time)
    );
    for (let i = 0; i < sorted.length; i++) {
      const start = time12ToMinutes(sorted[i].time);
      const end =
        i < sorted.length - 1
          ? time12ToMinutes(sorted[i + 1].time)
          : start + 60;
      if (ongoingTime >= start && ongoingTime < end) return sorted[i].time;
    }
    return null;
  }, [ongoingTime, todayClasses]);

  async function markAllNoClass() {
    // If you want auto NO CLASS on holiday
    for (const cls of todayClasses) {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cls.code,
          name: cls.name,
          status: "grey",
          topic: "",
          date: selectedDate,
          timeSlot: cls.time,
          scheduledCode: cls.scheduledCode || "",
        }),
      });
    }
  }

  const timeString = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg font-black text-gray-900 bg-transparent outline-none"
            />
            <button
              onClick={() => setSelectedDate(todayISO())}
              className="px-3 py-1 rounded-xl text-xs font-black border border-gray-200"
            >
              Today
            </button>
          </div>
          <div className="mt-1 text-xs font-bold text-gray-500">
            {dayName} • {timeString}
          </div>
        </div>

        <Link
          href="/profile"
          className="bg-white border border-gray-100 rounded-2xl p-3 font-black"
        >
          👤
        </Link>
      </div>

      {/* banners */}
      <div className="mt-3 space-y-2">
        {isFuture && (
          <div className="bg-yellow-50 text-yellow-900 border border-yellow-100 rounded-2xl p-3 font-black">
            Future date (read-only)
          </div>
        )}
        {isHoliday && !isFuture && (
          <div className="bg-orange-50 text-orange-900 border border-orange-100 rounded-2xl p-3 font-black">
            Holiday / Weekend — marking locked
            <button
              onClick={markAllNoClass}
              className="ml-3 px-3 py-1 rounded-xl text-xs font-black border border-orange-200"
            >
              Mark all as NO CLASS
            </button>
          </div>
        )}
      </div>

      {/* controls */}
      {!loading && !isFuture && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={toggleBiometric}
            className={`flex-1 py-3 rounded-2xl font-black ${
              biometricDone ? "bg-green-600 text-white" : "bg-red-500 text-white"
            }`}
          >
            {biometricDone ? "✅ Bio Done" : "⚠️ Mark Bio"}
          </button>

          <button
            onClick={toggleManualHoliday}
            className={`flex-1 py-3 rounded-2xl font-black border ${
              isManualHoliday
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {isManualHoliday ? "Holiday ON" : "Mark Holiday"}
          </button>
        </div>
      )}

      {/* schedule */}
      <h2 className="mt-5 text-xl font-black">Schedule</h2>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {todayClasses.map((cls) => (
          <SubjectCard
            key={`${cls.time}-${cls.code}-${cls.type}`}
            period={cls.period}
            classTime={cls.time}
            subjectCode={cls.code}
            subjectName={cls.name}
            type={cls.type}
            scheduledCode={cls.scheduledCode || cls.code}
            selectedDate={selectedDate}
            biometricDone={biometricDone}
            isHoliday={isHoliday}
            isFuture={isFuture}
            isOngoing={ongoingSlot === cls.time}
            refreshDashboard={refreshDashboard}
          />
        ))}
      </div>

      {/* manage swaps/extras */}
      {!isFuture && (
        <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-black">Manage Swaps / Extras</h3>

          {uiMsg && (
            <div className="mt-2 text-xs font-black text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-2">
              {uiMsg}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setManageMode("SWAP")}
              className={`flex-1 py-2 rounded-2xl font-black border ${
                manageMode === "SWAP"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setManageMode("EXTRA")}
              className={`flex-1 py-2 rounded-2xl font-black border ${
                manageMode === "EXTRA"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Extra
            </button>
          </div>

          {manageMode === "SWAP" ? (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={swapTime}
                  onChange={(e) => setSwapTime(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 font-black"
                >
                  {nonExtraSlots.map((c) => (
                    <option
                      key={`${c.time}-${c.scheduledCode || c.code}`}
                      value={c.time}
                    >
                      {c.time} • {c.scheduledCode || c.code}
                      {c.type === "SWAP" ? ` → ${c.code}` : ""}
                    </option>
                  ))}
                </select>

                <input
                  value={swapToCode}
                  onChange={(e) => setSwapToCode(e.target.value)}
                  placeholder="Swap to code"
                  className="border border-gray-200 rounded-xl px-3 py-2 font-black"
                  list="allSubjectsSwap"
                />
                <datalist id="allSubjectsSwap">
                  {ALL_SUBJECTS.map((s) => (
                    <option key={`swap-${s.code}`} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </datalist>

                <button
                  onClick={applySwap}
                  disabled={!swapTime || !swapToCode}
                  className="sm:col-span-3 py-3 rounded-2xl font-black bg-black text-white disabled:opacity-40"
                >
                  Apply Swap
                </button>
              </div>

              <div className="mt-2 text-xs font-bold text-gray-500">
                Tip: pick a routine time, then choose the subject code to replace it.
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="time"
                  value={extraTime}
                  onChange={(e) => setExtraTime(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 font-bold"
                />

                <input
                  value={extraCode}
                  onChange={(e) => setExtraCode(e.target.value)}
                  placeholder="Extra subject code"
                  className="border border-gray-200 rounded-xl px-3 py-2 font-bold"
                  list="allSubjectsExtra"
                />
                <datalist id="allSubjectsExtra">
                  {ALL_SUBJECTS.map((s) => (
                    <option key={`extra-${s.code}`} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </datalist>

                <button
                  onClick={addExtra}
                  disabled={!extraTime || !extraCode}
                  className="sm:col-span-3 py-3 rounded-2xl font-black bg-black text-white disabled:opacity-40"
                >
                  Add Extra
                </button>
              </div>

              <div className="mt-2 text-xs font-bold text-gray-500">
                Extras won’t auto-swap. If you want to replace a routine slot, use Swap mode.
              </div>
            </div>
          )}

          {/* lists */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <div className="text-sm font-black text-gray-800">Today&apos;s Swaps</div>

              {dailySwaps.length === 0 ? (
                <div className="mt-2 text-xs font-bold text-gray-400">No swaps.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {dailySwaps
                    .slice()
                    .sort(
                      (a, b) =>
                        time12ToMinutes(a.timeSlot) - time12ToMinutes(b.timeSlot)
                    )
                    .map((s) => {
                      const fromName =
                        getSubjectByCode(s.fromCode)?.name || s.fromCode;
                      const toName = getSubjectByCode(s.toCode)?.name || s.toCode;

                      return (
                        <div
                          key={`sw-${s.timeSlot}`}
                          className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black text-gray-500">
                              {s.timeSlot}
                            </div>
                            <div className="text-sm font-black truncate">
                              {s.fromCode} → {s.toCode}
                            </div>
                            <div className="text-xs font-bold text-gray-500 truncate">
                              {fromName} → {toName}
                            </div>
                          </div>

                          <button
                            onClick={() => removeSwap(s.timeSlot)}
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-black text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-black text-gray-800">Today&apos;s Extras</div>

              {dailyExtras.length === 0 ? (
                <div className="mt-2 text-xs font-bold text-gray-400">No extras.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {dailyExtras
                    .slice()
                    .sort(
                      (a, b) =>
                        time12ToMinutes(a.timeSlot) - time12ToMinutes(b.timeSlot)
                    )
                    .map((e) => {
                      const nm = getSubjectByCode(e.code)?.name || e.code;

                      return (
                        <div
                          key={`ex-${e.timeSlot}-${e.code}`}
                          className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black text-gray-500">
                              {e.timeSlot}
                            </div>
                            <div className="text-sm font-black truncate">{e.code}</div>
                            <div className="text-xs font-bold text-gray-500 truncate">
                              {nm}
                            </div>
                          </div>

                          <button
                            onClick={() => removeExtra(e.timeSlot, e.code)}
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-black text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
