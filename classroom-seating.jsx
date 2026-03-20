import { useState, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════
   CONFIGURATION
   Layout: 3 rows (0=left,1=center,2=right) × 5 desks × 2 variants
   Total seats: 30
═══════════════════════════════════════════════════ */
const DESKS = 5;
const MAX   = 30;

// Stage order & seat coverage — total = 12+3+8+2+5 = 30
const STAGES = [
  {
    id: 1,
    label: "В2 · парты 1–4 · все ряды",
    desc:  "Все ряды, В2, парты 1–4",
    rows:  [0, 1, 2],
    desks: [0, 1, 2, 3],
    v:     1,
    color: "#38BDF8",
    glow:  "rgba(56,189,248,0.25)",
    fade:  "rgba(56,189,248,0.09)",
  },
  {
    id: 2,
    label: "В2 · парта 5 · все ряды",
    desc:  "Все ряды, В2, парта 5",
    rows:  [0, 1, 2],
    desks: [4],
    v:     1,
    color: "#F472B6",
    glow:  "rgba(244,114,182,0.25)",
    fade:  "rgba(244,114,182,0.09)",
  },
  {
    id: 3,
    label: "В1 · парты 1–4 · центр+правый",
    desc:  "Центр и правый ряд, В1, парты 1–4",
    rows:  [1, 2],
    desks: [0, 1, 2, 3],
    v:     0,
    color: "#34D399",
    glow:  "rgba(52,211,153,0.25)",
    fade:  "rgba(52,211,153,0.09)",
  },
  {
    id: 4,
    label: "В1 · парта 5 · центр+правый",
    desc:  "Центр и правый ряд, В1, парта 5",
    rows:  [1, 2],
    desks: [4],
    v:     0,
    color: "#FBBF24",
    glow:  "rgba(251,191,36,0.25)",
    fade:  "rgba(251,191,36,0.09)",
  },
  {
    id: 5,
    label: "Левый ряд · В1 · все парты",
    desc:  "Левый ряд, В1, парты 1–5",
    rows:  [0],
    desks: [0, 1, 2, 3, 4],
    v:     0,
    color: "#A78BFA",
    glow:  "rgba(167,139,250,0.25)",
    fade:  "rgba(167,139,250,0.09)",
  },
];

/* ═══════════════════════════════════════════════════
   ALGORITHM  —  greedy max-min-distance per stage
   Physical coords:
     x = row * 2 + v   (rows 2 units apart; variants 1 unit apart)
     y = col            (desks 1 unit apart front-to-back)
═══════════════════════════════════════════════════ */
function eucl(a, b) {
  const ax = a.row * 2 + a.v;
  const bx = b.row * 2 + b.v;
  return Math.sqrt((ax - bx) ** 2 + (a.col - b.col) ** 2);
}

function computeSeating(names) {
  const map = new Map(); // "row,col,v" → { name, num, stgId }
  let ni = 0;

  for (const stg of STAGES) {
    const allSeats = stg.rows.flatMap(row =>
      stg.desks.map(col => ({ row, col, v: stg.v }))
    );
    const placed = [];

    while (ni < names.length && placed.length < allSeats.length) {
      const key   = s => `${s.row},${s.col},${s.v}`;
      const avail = allSeats.filter(s => !map.has(key(s)));
      if (!avail.length) break;

      let best = avail[0];

      if (placed.length === 0) {
        // First in stage: pick corner-like seat (max sum of distances to all others)
        let topScore = -Infinity;
        for (const s of avail) {
          const score = avail.reduce((acc, o) => acc + eucl(s, o), 0);
          if (score > topScore) { topScore = score; best = s; }
        }
      } else {
        // Subsequent: maximise min-distance to already placed; tie-break by total distance
        let topMin = -Infinity, topSum = -Infinity;
        for (const s of avail) {
          const mn = Math.min(...placed.map(p => eucl(s, p)));
          const sm = placed.reduce((acc, p) => acc + eucl(s, p), 0);
          if (mn > topMin || (mn === topMin && sm > topSum)) {
            topMin = mn; topSum = sm; best = s;
          }
        }
      }

      map.set(key(best), { name: names[ni], num: ni + 1, stgId: stg.id });
      placed.push(best);
      ni++;
    }
  }
  return map;
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const stageOf = (row, desk, v) =>
  STAGES.find(s => s.v === v && s.desks.includes(desk) && s.rows.includes(row));

function shortName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.length > 10 ? name.slice(0, 9) + "…" : name;
  const [last, first, ...rest] = parts;
  const initials = [first, ...rest].filter(Boolean).map(w => w[0] + ".").join("");
  const candidate = `${last} ${initials}`;
  return candidate.length > 13 ? last.slice(0, 11) + "…" : candidate;
}

/* ═══════════════════════════════════════════════════
   SEAT CELL
═══════════════════════════════════════════════════ */
function SeatCell({ info, stg, highlighted }) {
  const color = stg?.color ?? "#1E293B";
  const fade  = stg?.fade  ?? "transparent";
  const glow  = stg?.glow  ?? "transparent";
  const label = stg?.v === 0 ? "В1" : "В2";

  return (
    <div
      title={info?.name ?? label}
      style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3px 2px", position: "relative",
        background: info ? fade : "transparent",
        outline: highlighted ? `2px solid ${color}` : "none",
        outlineOffset: -2,
        transition: "background 0.25s, outline 0.15s",
        overflow: "hidden",
      }}
    >
      {info ? (
        <>
          <span style={{
            fontSize: 8, fontWeight: 900, color,
            lineHeight: 1.1, letterSpacing: "0.04em",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            #{String(info.num).padStart(2, "0")}
          </span>
          <span style={{
            fontSize: 9.5, color: "#E2E8F0", fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", width: "100%", textAlign: "center",
            lineHeight: 1.3, fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
          }}>
            {shortName(info.name)}
          </span>
          <div style={{
            position: "absolute", bottom: 0, left: 4, right: 4,
            height: 2, background: color, borderRadius: 1,
            boxShadow: `0 0 6px ${glow}`,
          }} />
        </>
      ) : (
        <span style={{
          fontSize: 9, color: "#1A3550", fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App() {
  const [students,  setStudents]  = useState([]);
  const [text,      setText]      = useState("");
  const [highlight, setHighlight] = useState(null);
  const textareaRef = useRef(null);

  const seating = useMemo(() => computeSeating(students), [students]);

  const getSeat     = (row, desk, v) => seating.get(`${row},${desk},${v}`);
  const stageCount  = id => [...seating.values()].filter(v => v.stgId === id).length;
  const stageTotal  = id => { const s = STAGES.find(x => x.id === id); return s.rows.length * s.desks.length; };

  const getLoc = num => {
    for (const [key, val] of seating) {
      if (val.num === num) {
        const [row, col, v] = key.split(",").map(Number);
        const s = stageOf(row, col, v);
        return { row: row + 1, desk: col + 1, variant: v + 1, color: s?.color };
      }
    }
    return null;
  };

  const addNames = () => {
    const ns = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
                   .slice(0, MAX - students.length);
    if (!ns.length) return;
    setStudents(p => [...p, ...ns]);
    setText("");
    textareaRef.current?.focus();
  };

  const removeStudent = i => setStudents(p => p.filter((_, j) => j !== i));
  const reset = () => { setStudents([]); setText(""); };

  const LABEL = { 9: "9", 10: "10", 11: "11" };
  const ROW_HEADERS = [
    { label: "Левый ряд",   hint: "эт. 1, 2, 5" },
    { label: "Центр. ряд",  hint: "эт. 1, 2, 3, 4" },
    { label: "Правый ряд",  hint: "эт. 1, 2, 3, 4" },
  ];
  const ROW_ABBR = ["лев", "цент", "прав"];

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#060E1A", color: "#CBD5E1",
      fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
    }}>

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        width: 274, flexShrink: 0,
        background: "linear-gradient(180deg, #0B1626 0%, #091321 100%)",
        borderRight: "1px solid #0F2A44",
        display: "flex", flexDirection: "column",
        padding: "18px 16px", gap: 16, overflowY: "auto",
      }}>
        {/* Title + segmented progress */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0", letterSpacing: "-0.02em" }}>
            🏫 Класс · расстановка
          </div>
          <div style={{ fontSize: 11, color: "#3B6B8A", marginTop: 3 }}>
            {students.length} из {MAX} мест занято
          </div>
          <div style={{ marginTop: 10, height: 5, borderRadius: 3, overflow: "hidden", display: "flex", gap: 1 }}>
            {STAGES.map(stg => {
              const tot = stageTotal(stg.id);
              const cnt = stageCount(stg.id);
              return (
                <div key={stg.id} style={{ flex: tot, background: "#0F2A44", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${(cnt / tot) * 100}%`, height: "100%",
                    background: stg.color, transition: "width .4s",
                    boxShadow: cnt > 0 ? `0 0 8px ${stg.glow}` : "none",
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#3B6B8A", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Добавить учеников
          </div>
          <textarea
            ref={textareaRef}
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNames(); } }}
            placeholder={"Иванов Иван\nПетрова А., Сидоров К."}
            disabled={students.length >= MAX}
            style={{
              background: "#040D18", border: "1px solid #0F2A44",
              borderRadius: 7, padding: "8px 10px",
              color: "#CBD5E1", fontSize: 12, resize: "vertical",
              outline: "none", fontFamily: "inherit", lineHeight: 1.55,
              transition: "border-color .2s",
            }}
            onFocus={e => e.target.style.borderColor = "#1D4E7A"}
            onBlur ={e => e.target.style.borderColor = "#0F2A44"}
          />
          <div style={{ fontSize: 9.5, color: "#1D4E7A" }}>
            Enter — добавить · разделитель: запятая, «;» или строка
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={addNames}
              disabled={!text.trim() || students.length >= MAX}
              style={{
                flex: 1, border: "none", borderRadius: 7,
                background: "linear-gradient(135deg, #1252A0, #1D6FD4)",
                color: "#fff", padding: "8px 0",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                opacity: (!text.trim() || students.length >= MAX) ? 0.3 : 1,
                transition: "opacity .2s, transform .1s",
                boxShadow: "0 2px 12px rgba(29,111,212,0.3)",
              }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp  ={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Добавить
            </button>
            {students.length > 0 && (
              <button
                onClick={reset}
                style={{
                  border: "1px solid #3A0A0A", borderRadius: 7,
                  background: "#1A0505", color: "#F87171",
                  padding: "8px 12px", fontSize: 12, cursor: "pointer",
                }}
              >
                Сброс
              </button>
            )}
          </div>
        </div>

        {/* Student list */}
        {students.length > 0 && (
          <div style={{ flex: 1, minHeight: 60, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#3B6B8A", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Список ({students.length})
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {students.map((name, i) => {
                const loc  = getLoc(i + 1);
                const isHL = highlight === i + 1;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHighlight(i + 1)}
                    onMouseLeave={() => setHighlight(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "4px 6px", borderRadius: 6, marginBottom: 2,
                      background: isHL ? "rgba(15,42,68,0.8)" : "transparent",
                      transition: "background .15s",
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 5,
                      border: `1.5px solid ${loc?.color ?? "#0F2A44"}`,
                      color: loc?.color ?? "#3B6B8A",
                      fontSize: 8.5, fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {i + 1}
                    </div>
                    <span style={{
                      flex: 1, fontSize: 11.5, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#CBD5E1",
                    }} title={name}>
                      {name}
                    </span>
                    {loc && (
                      <span style={{
                        fontSize: 8.5, color: "#1D4E7A", whiteSpace: "nowrap",
                        fontFamily: "'JetBrains Mono', monospace",
                      }} title={`Ряд ${loc.row}, парта ${loc.desk}, вариант ${loc.variant}`}>
                        {ROW_ABBR[loc.row - 1]}·П{loc.desk}·В{loc.variant}
                      </span>
                    )}
                    <button
                      onClick={() => removeStudent(i)}
                      style={{
                        background: "none", border: "none",
                        color: "#1D4E7A", cursor: "pointer",
                        fontSize: 14, padding: "0 1px", lineHeight: 1, flexShrink: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#1D4E7A"}
                    >×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage legend */}
        <div style={{ borderTop: "1px solid #0F2A44", paddingTop: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#3B6B8A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            Этапы заполнения
          </div>
          {STAGES.map((stg, idx) => {
            const cnt  = stageCount(stg.id);
            const tot  = stageTotal(stg.id);
            const done = cnt === tot && cnt > 0;
            return (
              <div key={stg.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <div style={{
                    width: 3, height: 22, borderRadius: 2,
                    background: stg.color,
                    boxShadow: cnt > 0 ? `0 0 8px ${stg.glow}` : "none",
                  }} />
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: stg.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {idx + 1}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 9.5, color: "#7FA8C5",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {stg.desc}
                  </div>
                  <div style={{ marginTop: 3, height: 2, background: "#0F2A44", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{
                      width: `${(cnt / tot) * 100}%`, height: "100%",
                      background: stg.color, transition: "width .4s",
                    }} />
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, minWidth: 28, textAlign: "right",
                  color: done ? stg.color : "#1D4E7A",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {cnt}/{tot}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ════════ CLASSROOM ════════ */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "20px 24px 24px", gap: 6, overflowY: "auto",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(12,36,64,0.85) 0%, #060E1A 70%)",
      }}>
        {/* Blackboard */}
        <div style={{
          background: "linear-gradient(135deg, #0B2A14 0%, #0D3319 100%)",
          border: "2px solid #134D20", borderRadius: 12,
          textAlign: "center", padding: "11px 0", marginBottom: 4,
          boxShadow: "0 4px 24px rgba(19,77,32,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)",
          }} />
          <span style={{ color: "#5CBA78", fontSize: 11, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", position: "relative" }}>
            Доска
          </span>
        </div>

        {/* Row headers */}
        <div style={{ display: "flex", alignItems: "center", paddingBottom: 2 }}>
          <div style={{ width: 44, flexShrink: 0 }} />
          {ROW_HEADERS.map((r, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#1D4E7A", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {r.label}
              </div>
              <div style={{ fontSize: 8, color: "#0F2A44", marginTop: 1 }}>{r.hint}</div>
            </div>
          ))}
        </div>

        {/* Desk rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {Array.from({ length: DESKS }, (_, desk) => (
            <div key={desk}>
              {desk === 4 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0", paddingLeft: 44 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #0A1E32 60%, transparent)" }} />
                  <span style={{ fontSize: 8.5, color: "#0F2A44", whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "0.12em" }}>
                    ЗАДНЯЯ ЛИНИЯ — ПАРТА 5
                  </span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, #0A1E32 60%, transparent)" }} />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "stretch" }}>
                <div style={{ width: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    color: desk < 4 ? "#1D4E7A" : "#2A6A4A",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    П{desk + 1}
                  </span>
                </div>

                {[0, 1, 2].map(row => {
                  const i0   = getSeat(row, desk, 0);
                  const i1   = getSeat(row, desk, 1);
                  const hl0  = i0 && highlight === i0.num;
                  const hl1  = i1 && highlight === i1.num;
                  const stg0 = stageOf(row, desk, 0);
                  const stg1 = stageOf(row, desk, 1);
                  const anyHL = hl0 || hl1;
                  const isLeft = row === 0;

                  return (
                    <div key={row} style={{ flex: 1, padding: "0 5px" }}>
                      <div style={{
                        display: "flex", height: 52,
                        border: `1px solid ${anyHL ? "#1D4E7A" : isLeft ? "#0D2540" : "#0A1E32"}`,
                        borderLeft: isLeft ? `2px solid ${anyHL ? "#3B6B8A" : "#0D2540"}` : undefined,
                        borderRadius: 8, overflow: "hidden",
                        background: "#060E1A",
                        boxShadow: anyHL
                          ? "0 0 0 1px rgba(29,78,122,0.5), 0 2px 12px rgba(0,0,0,0.5)"
                          : "0 1px 6px rgba(0,0,0,0.6)",
                        transition: "border-color .2s, box-shadow .2s",
                      }}>
                        <SeatCell info={i0} stg={stg0} highlighted={hl0} />
                        <div style={{ width: 1, background: "#0A1E32", flexShrink: 0 }} />
                        <SeatCell info={i1} stg={stg1} highlighted={hl1} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {students.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🪑</div>
              <div style={{ fontSize: 13, color: "#1D4E7A", fontWeight: 600 }}>
                Добавьте учеников для расстановки
              </div>
              <div style={{ fontSize: 10, color: "#0F2A44", marginTop: 5, lineHeight: 1.7 }}>
                30 мест · 3 ряда · 5 парт · 2 варианта · 5 этапов
              </div>
              <div style={{ marginTop: 14, display: "inline-flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                {STAGES.map((stg, i) => (
                  <div key={stg.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 18, height: 3, borderRadius: 2, background: stg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: "#1D4E7A", textAlign: "left" }}>{i + 1}. {stg.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer stats */}
        {students.length > 0 && (
          <div style={{ display: "flex", gap: 14, justifyContent: "center", paddingTop: 4, flexWrap: "wrap" }}>
            {STAGES.map((stg, i) => {
              const cnt = stageCount(stg.id);
              const tot = stageTotal(stg.id);
              return (
                <div key={stg.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: stg.color,
                    boxShadow: cnt > 0 ? `0 0 6px ${stg.glow}` : "none",
                  }} />
                  <span style={{ fontSize: 9.5, color: "#1D4E7A", fontFamily: "'JetBrains Mono', monospace" }}>
                    Эт{i + 1}:<span style={{ color: cnt > 0 ? stg.color : "#1D4E7A" }}>{cnt}</span>/{tot}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
