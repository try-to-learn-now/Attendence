// FILE: src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ClassCard from "@/components/ClassCard";
import ExtraClassBar from "@/components/ExtraClassBar";
import { todayISO } from "@/lib/date";
import type { AttendanceStatus, DayMode, HolidayOverride } from "@/types/core";

type ApiDay = {
  semesterStart: string;
  day: {
    date: string;
    mode: DayMode;
    biometricDone: boolean;
    holidayOverride: HolidayOverride;
    swaps: { timeSlot: string; toCode: string }[];
    extras: { timeSlot: string; code: string }[];
    note: string;
  };
  isHoliday: boolean;
  holidayLabel: string;
  subjects: { code: string; name: string; teacher: string }[];
  schedule: { timeSlot: string; code: string; type: "ROUTINE" | "SWAP" | "EXTRA"; fromCode?: string }[];
  entries: { timeSlot: string; code: string; status: AttendanceStatus; topic: string }[];
};

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<ApiDay | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/day?date=${date}`, { cache: "no-store" });
    const j = await r.json();
    setData(j);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const subjMap = useMemo(() => {
    const m = new Map<string, { code: string; name: string; teacher: string }>();
    (data?.subjects ?? []).forEach((s) => m.set(s.code, s));
    return m;
  }, [data]);

  const entryMap = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    (data?.entries ?? []).forEach((e) => m.set(`${e.timeSlot}__${e.code}`, e.status));
    return m;
  }, [data]);

  async function postDay(patch: any) {
    await fetch("/api/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...patch })
    });
    await load();
  }

  async function setStatus(timeSlot: string, code: string, status: AttendanceStatus) {
    const r = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, timeSlot, code, status })
    });
    const j = await r.json();
    if (!r.ok) alert(j.error || "Error");
    await load();
  }

  async function clearSlot(timeSlot: string, code: string) {
    await fetch("/api/attendance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, timeSlot, code })
    });
    await load();
  }

  async function resetDay() {
    await fetch("/api/reset-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date })
    });
    await load();
  }

  function effectiveStatusFor(timeSlot: string, code: string): AttendanceStatus | null {
    const saved = entryMap.get(`${timeSlot}__${code}`) ?? null;
    if (saved) return saved;

    // RULE (your final decision):
    // BIOMETRIC mode + biometricDone=false + not holiday => default ABSENT for all classes
    if (data?.day.mode === "BIOMETRIC" && !data.day.biometricDone && !data.isHoliday) return "ABSENT";
    return null;
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  const allowPresentButtons = data.day.mode === "ONLINE" ? true : data.day.biometricDone;

  return (
    <div>
      <TopBar
        date={date}
        setDate={setDate}
        mode={data.day.mode}
        biometricDone={data.day.biometricDone}
        holidayOverride={data.day.holidayOverride}
        isHoliday={data.isHoliday}
        holidayLabel={data.holidayLabel}
        note={data.day.note}
        onSaveNote={(note) => postDay({ note })}
        onSetMode={(m) => postDay({ mode: m })}
        onSetBiometric={(v) => postDay({ mode: "BIOMETRIC", biometricDone: v })}
        onSetHolidayOverride={(v) => postDay({ holidayOverride: v })}
        onResetDay={resetDay}
      />

      <div className="max-w-3xl mx-auto p-3 space-y-3">
        <div className="flex items-center gap-3">
          <a className="text-sm underline" href="/admin">
            Admin (Seed)
          </a>
          <a className="text-sm underline" href="/holidays">
            Holidays
          </a>
          <a className="text-sm underline" href="/reports">
            Reports / PDF
          </a>
          {loading ? <span className="text-xs text-gray-500">Refreshing…</span> : null}
        </div>

        <ExtraClassBar
          subjects={data.subjects.map((s) => ({ code: s.code, name: s.name }))}
          extras={data.day.extras ?? []}
          onAdd={(timeSlot, code) => {
            const extras = [...(data.day.extras ?? [])];
            extras.push({ timeSlot, code });
            postDay({ extras });
          }}
          onRemove={(timeSlot, code) => {
            const extras = (data.day.extras ?? []).filter((e) => !(e.timeSlot === timeSlot && e.code === code));
            postDay({ extras });
          }}
        />

        {data.schedule.length === 0 ? (
          <div className="bg-white border rounded-xl p-4 text-sm text-gray-600">
            No routine found for this day. First time? Go Admin → Seed.
          </div>
        ) : null}

        {data.schedule.map((c) => {
          const meta = subjMap.get(c.code) ?? { code: c.code, name: c.code, teacher: "" };
          const saved = entryMap.get(`${c.timeSlot}__${c.code}`) ?? null;
          const effective = effectiveStatusFor(c.timeSlot, c.code);

          return (
            <ClassCard
              key={`${c.timeSlot}__${c.code}__${c.type}`}
              timeSlot={c.timeSlot}
              type={c.type}
              fromCode={c.fromCode}
              code={c.code}
              subjectName={meta.name}
              teacher={meta.teacher}
              effectiveStatus={effective}
              savedStatus={saved}
              allowPresentButtons={allowPresentButtons}
              allSubjects={data.subjects}
              onSetStatus={(s) => setStatus(c.timeSlot, c.code, s)}
              onClear={() => clearSlot(c.timeSlot, c.code)}
              onSwapTo={(toCode) => {
                const swaps = [...(data.day.swaps ?? [])].filter((x) => x.timeSlot !== c.timeSlot);
                swaps.push({ timeSlot: c.timeSlot, toCode });
                postDay({ swaps });
              }}
              onRemoveSwap={() => {
                const swaps = [...(data.day.swaps ?? [])].filter((x) => x.timeSlot !== c.timeSlot);
                postDay({ swaps });
              }}
              isSwapped={c.type === "SWAP"}
            />
          );
        })}
      </div>
    </div>
  );
}
