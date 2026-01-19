// FILE: src/components/ClassCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { AttendanceStatus } from "@/types/core";
import { STATUS_BG, STATUS_COLOR, STATUS_LABEL } from "@/types/core";

export default function ClassCard(props: {
  timeSlot: string;
  type: "ROUTINE" | "SWAP" | "EXTRA";
  fromCode?: string;

  code: string;
  subjectName: string;
  teacher: string;

  effectiveStatus: AttendanceStatus | null;
  savedStatus: AttendanceStatus | null;

  allowPresentButtons: boolean;

  allSubjects: { code: string; name: string; teacher: string }[];

  onSetStatus: (status: AttendanceStatus) => void;
  onClear: () => void;

  onSwapTo: (toCode: string) => void;
  onRemoveSwap: () => void;
  isSwapped: boolean;
}) {
  const [showSwap, setShowSwap] = useState(false);

  const badge = useMemo(() => {
    if (props.type === "EXTRA") return "EXTRA";
    if (props.type === "SWAP") return "SWAP";
    return "ROUTINE";
  }, [props.type]);

  const status = props.effectiveStatus;

  return (
    <div className="bg-white border rounded-xl p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-xs text-gray-500">
            {props.timeSlot} • <span className="font-semibold">{badge}</span>
            {props.type === "SWAP" && props.fromCode ? (
              <span className="ml-2 text-xs text-gray-600">(from {props.fromCode})</span>
            ) : null}
          </div>

          <div className="mt-1 font-bold leading-tight">
            {props.subjectName} <span className="text-sm text-gray-600">({props.code})</span>
          </div>

          {props.teacher ? <div className="text-xs text-gray-700 mt-1">Teacher: {props.teacher}</div> : null}

          {status ? (
            <div className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded ${STATUS_BG[status]}`}>
              <span className={`text-sm font-semibold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
              <span className="text-[11px] text-gray-600">{props.savedStatus ? "(saved)" : "(default)"}</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">Not marked</div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={props.onClear} className="text-xs px-2 py-1 rounded border">
            Clear
          </button>

          <button onClick={() => setShowSwap((v) => !v)} className="text-xs px-2 py-1 rounded border">
            Swap
          </button>

          {props.isSwapped && (
            <button onClick={props.onRemoveSwap} className="text-xs px-2 py-1 rounded border">
              Remove Swap
            </button>
          )}
        </div>
      </div>

      {showSwap && (
        <div className="mt-3 flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) props.onSwapTo(v);
            }}
          >
            <option value="">Swap to…</option>
            {props.allSubjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 grid grid-cols-5 gap-2">
        <button
          disabled={!props.allowPresentButtons}
          onClick={() => props.onSetStatus("PRESENT")}
          className={`px-2 py-2 rounded text-xs border ${!props.allowPresentButtons ? "opacity-40" : ""}`}
        >
          P
        </button>
        <button
          disabled={!props.allowPresentButtons}
          onClick={() => props.onSetStatus("PRESENT_PROXY")}
          className={`px-2 py-2 rounded text-xs border ${!props.allowPresentButtons ? "opacity-40" : ""}`}
        >
          P+Pr
        </button>
        <button onClick={() => props.onSetStatus("PROXY")} className="px-2 py-2 rounded text-xs border">
          Pr
        </button>
        <button onClick={() => props.onSetStatus("ABSENT")} className="px-2 py-2 rounded text-xs border">
          A
        </button>
        <button onClick={() => props.onSetStatus("NO_CLASS")} className="px-2 py-2 rounded text-xs border">
          NC
        </button>
      </div>

      {!props.allowPresentButtons && (
        <div className="mt-2 text-[11px] text-gray-600">
          Biometric NO day: Present buttons disabled. Use PROXY / ABSENT / NO CLASS.
        </div>
      )}
    </div>
  );
}
