import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EventType = "tournament" | "videogame" | "tabletop";

interface CalEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  label: string;
  type: EventType;
}

const EVENT_STYLES: Record<EventType, { pill: string; dot: string; label: string }> = {
  tournament: {
    pill:  "bg-[#FF5F5F]/20 text-[#FF5F5F] border border-[#FF5F5F]/40 shadow-[0_0_8px_-2px_#FF5F5F]",
    dot:   "bg-[#FF5F5F] shadow-[0_0_6px_1px_#FF5F5F]",
    label: "Tournament",
  },
  videogame: {
    pill:  "bg-[#3FCEEE]/20 text-[#3FCEEE] border border-[#3FCEEE]/40 shadow-[0_0_8px_-2px_#3FCEEE]",
    dot:   "bg-[#3FCEEE] shadow-[0_0_6px_1px_#3FCEEE]",
    label: "Video Game",
  },
  tabletop: {
    pill:  "bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_8px_-2px_#22c55e]",
    dot:   "bg-green-400 shadow-[0_0_6px_1px_#22c55e]",
    label: "Table Top",
  },
};

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_MAP: Record<string, number> = {
  JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
  JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
  JAN: 0, FEB: 1, MAR: 2, APR: 3, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default function CyberCalendar() {
  const { isIceTheme } = useTheme();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse custom date string: "MAY 14, 2025" or similar
  const parseSessionDate = (dateStr: string): { day: number, month: number, year: number } | null => {
    try {
      const parts = dateStr.replace(",", "").split(" ");
      if (parts.length < 3) return null;
      const month = MONTH_MAP[parts[0].toUpperCase()];
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
      return { day, month, year };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedEvents: CalEvent[] = snap.docs
        .map(doc => {
          const data = doc.data();
          if (data.approval !== "approved") return null;
          const parsedDate = parseSessionDate(data.date);
          if (!parsedDate) return null;

          let type: EventType = "videogame";
          if (data.category === "TOURNAMENT") type = "tournament";
          else if (data.category === "BOARD GAME") type = "tabletop";

          return {
            id: doc.id,
            day: parsedDate.day,
            month: parsedDate.month,
            year: parsedDate.year,
            label: data.title,
            type: type
          };
        })
        .filter((e): e is CalEvent => e !== null);
      
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const totalDays   = getDaysInMonth(viewYear, viewMonth);
  const startOffset = getFirstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = (day: number) =>
    events.filter(
      (e) => e.day === day && e.month === viewMonth && e.year === viewYear
    );

  const gridLine = isIceTheme ? "border-[#3FCEEE]/10" : "border-white/5";
  const headerText = isIceTheme ? "text-[#3FCEEE]" : "text-[#FF5F5F]";
  const todayRing = isIceTheme ? "ring-2 ring-[#3FCEEE]/60" : "ring-2 ring-[#FF5F5F]/60";

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${headerText} transition-colors duration-500`}>
            CYBER-CALENDAR
          </p>
          <h3 className="text-xl font-black text-white tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className={`w-8 h-8 rounded-xl border ${gridLine} flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all duration-300`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className={`w-8 h-8 rounded-xl border ${gridLine} flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all duration-300`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Day Labels ── */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className={`text-center text-[9px] font-black tracking-widest py-1 ${headerText} transition-colors duration-500`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((day, idx) => {
          const dayEvents = day ? eventsForDay(day) : [];
          const isToday =
            day === now.getDate() &&
            viewMonth === now.getMonth() &&
            viewYear === now.getFullYear();

          return (
            <div
              key={idx}
              className={`
                relative min-h-[56px] rounded-xl p-1.5 flex flex-col gap-1
                border ${gridLine} transition-all duration-500
                ${day ? "cursor-pointer hover:bg-white/5" : "opacity-0 pointer-events-none"}
                ${isToday ? todayRing : ""}
              `}
              onClick={() => dayEvents.length > 0 && setSelected(dayEvents[0])}
            >
              {day && (
                <>
                  <span className={`text-[11px] font-black leading-none ${isToday ? headerText : "text-gray-400"} transition-colors duration-500`}>
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayEvents.map((ev, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_STYLES[ev.type].dot} transition-all duration-300`}
                        title={ev.label}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className={`flex items-center gap-4 pt-4 border-t ${gridLine} transition-colors duration-500`}>
        {(["tournament", "videogame", "tabletop"] as EventType[]).map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${EVENT_STYLES[type].dot}`} />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              {EVENT_STYLES[type].label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Event Detail Tooltip ── */}
      {selected && (
        <div
          className={`mt-1 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 ${EVENT_STYLES[selected.type].pill} transition-all duration-300`}
          onClick={() => setSelected(null)}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_STYLES[selected.type].dot}`} />
          {selected.label}
        </div>
      )}
    </div>
  );
}
