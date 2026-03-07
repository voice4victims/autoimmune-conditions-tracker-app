/**
 * PANDASPrototype.tsx
 *
 * Full-fidelity interactive prototype for the PANDAS Tracker app.
 * Demonstrates all screens in a phone-frame layout with mock data.
 * Converted from JSX prototype to TypeScript + Tailwind + shadcn/ui.
 *
 * Usage: Import and render <PANDASPrototype /> on a standalone route.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SplashScreen from "./SplashScreen";
import HomeScreen from "./HomeScreen";
import TriggerTracker from "./TriggerTracker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavTab {
  id: string;
  icon: string;
  label: string;
}

interface SubTab {
  id: string;
  icon: string;
  label: string;
}

interface MockDay {
  date: Date;
  idx: number;
  overall: number;
  ocd: number;
  tics: number;
  anxiety: number;
  mood: number;
  sleep: number;
  isFlare: boolean;
  flarePeak: boolean;
}

interface TreatmentEntry {
  type: string;
  name: string;
  dose: string;
  startDate: string;
  endDate: string;
  status: "active" | "discontinued" | "failed";
  helpRating: number | null;
  worsenedPans: boolean;
  sideEffects: string[];
  failReason: string;
  note: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_TABS: NavTab[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "log", icon: "📋", label: "Log" },
  { id: "trends", icon: "📈", label: "Trends" },
  { id: "records", icon: "🗂️", label: "Records" },
  { id: "more", icon: "⋯", label: "More" },
];

const SYMPTOM_TYPES = [
  "OCD / Compulsive behaviors",
  "Anxiety (fears/phobias, separation anxiety)",
  "Tics / Motor movements",
  "Rage / Emotional dysregulation",
  "ADHD / Focus & attention",
  "Mood changes",
  "Sleep disturbances",
  "Sensory sensitivities",
  "Regression / Developmental",
  "Urinary frequency",
  "Handwriting deterioration",
  "Other",
];

const ACTIVITY_TYPES = ["Screen Time", "Physical Activity", "Social Interaction", "School/Learning", "Therapy", "Outdoor Activity", "Other"];
const FOOD_TYPES = ["Meal", "Snack", "Supplement", "Beverage", "Other"];
const VITAL_TYPES = ["Temperature", "Heart Rate", "Blood Pressure", "Weight", "Other"];
const TREATMENT_TYPES = ["Antibiotic", "Anti-inflammatory", "Supplement", "Behavioral Therapy", "IVIG", "Plasmapheresis", "Other"];

const SIDE_EFFECT_OPTIONS = [
  "Worsened PANS symptoms", "Increased OCD", "Increased anxiety", "Increased tics",
  "Rage / aggression", "Behavioral regression", "Hyperactivity", "Insomnia",
  "GI upset / nausea", "Diarrhea", "Rash / hives", "Headache",
  "Fatigue", "Loss of appetite", "Yeast overgrowth", "Herxheimer reaction", "Other",
];

const HELP_LEVELS = [
  { v: 0, l: "No effect",        emoji: "😐" },
  { v: 1, l: "Minimal help",     emoji: "🟡" },
  { v: 2, l: "Moderate help",    emoji: "🟠" },
  { v: 3, l: "Significant help", emoji: "🟢" },
  { v: 4, l: "Full remission",   emoji: "✨" },
];

const SYMS = [
  { id: "overall", label: "Overall", icon: "📊" },
  { id: "ocd",     label: "OCD",     icon: "🔄" },
  { id: "tics",    label: "Tics",    icon: "⚡" },
  { id: "anxiety", label: "Anxiety", icon: "😰" },
  { id: "mood",    label: "Mood",    icon: "🎭" },
  { id: "sleep",   label: "Sleep",   icon: "🌙" },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const EDU_TABS: SubTab[] = [
  { id: "about",     icon: "📖", label: "What is PANS"  },
  { id: "causes",    icon: "🦠", label: "Causes"        },
  { id: "symptoms",  icon: "🧠", label: "Symptoms"      },
  { id: "treatment", icon: "💊", label: "Treatments"    },
  { id: "school",    icon: "🏫", label: "At School"     },
  { id: "resources", icon: "🔗", label: "Resources"     },
];

const MORE_ITEMS = [
  { i: "__selfcare__", l: "Self Care",         s: "Wellness tips & guidance"             },
  { i: "❤️",           l: "Vital Signs",        s: "Temperature, heart rate, etc."        },
  { i: "💊",           l: "Treatments",         s: "Log medications & therapies"          },
  { i: "⏰",           l: "Reminders",          s: "Medication reminders"                 },
  { i: "🍳",           l: "Recipes",            s: "Supplement & meal recipes"            },
  { i: "📝",           l: "Notes",              s: "Daily observations"                   },
  { i: "📈",           l: "History",            s: "Symptom charts & trends"              },
  { i: "🗓️",          l: "Heatmap",            s: "Visual symptom calendar"              },
  { i: "👨‍⚕️",        l: "Providers",          s: "Your healthcare providers"            },
  { i: "📁",           l: "Files",              s: "Upload documents"                     },
  { i: "📧",           l: "Email Records",      s: "Send records to doctor"              },
  { i: "🛡️",          l: "Drug Safety",        s: "Check interactions"                  },
  { i: "📚",           l: "Resources",          s: "PANDAS/PANS resources"               },
  { i: "🪪",           l: "Insurance",          s: "Store insurance info"                },
  { i: "🗃️",          l: "Medical Records",    s: "Upload records & photos"             },
  { i: "👨‍👩‍👧",      l: "Family",            s: "Manage caregivers"                   },
  { i: "🌍",           l: "Community",          s: "Find PANDAS doctors worldwide"        },
  { i: "🔐",           l: "Account & Privacy",  s: "Logout, data controls & permissions" },
  { i: "🧬",           l: "Patient Profile",    s: "Infection, onset, diagnosis history"  },
  { i: "🩻",           l: "Co-Morbidities",     s: "Prior & post-infection conditions"    },
];

const NAV_SCREEN_ITEMS = new Set(["Heatmap","History","Vital Signs","Treatments","Providers","Files","Email Records","Family","Community","Medical Records"]);

// ─── Mock data builder ───────────────────────────────────────────────────────

function buildMockDays(seed = 1.7): MockDay[] {
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(2025, 11, 1);
    date.setDate(date.getDate() + i);
    const base = Math.sin(i * 0.3 * seed) * 2 + 4;
    const isFlare = i >= 8 && i <= 14 || i >= 28 && i <= 33;
    const flarePeak = i === 11 || i === 30;
    const overall = Math.max(0, Math.min(10, Math.round((isFlare ? base + 3 : base) * 10) / 10));
    return {
      date, idx: i,
      overall,
      ocd:     Math.max(0, Math.min(10, overall + Math.random() * 2 - 1)),
      tics:    Math.max(0, Math.min(10, overall + Math.random() * 2 - 1)),
      anxiety: Math.max(0, Math.min(10, overall + Math.random() * 2 - 1)),
      mood:    Math.max(0, Math.min(10, overall + Math.random() * 2 - 1)),
      sleep:   Math.max(0, Math.min(10, overall + Math.random() * 2 - 1)),
      isFlare,
      flarePeak,
    };
  });
}

const MOCK_DAYS = buildMockDays();

// ─── Severity helpers ─────────────────────────────────────────────────────────

function sevColor(n: number): string {
  if (n <= 2) return "#28BC79";
  if (n <= 4) return "#3CB371";
  if (n <= 6) return "#F5A81A";
  if (n <= 8) return "#FF4545";
  return "#E82020";
}

function sevLabel(n: number): string {
  return ["None","Minimal","Mild","Noticeable","Moderate","Significant","Concerning","Severe","Very Severe","Crisis","Emergency"][n] ?? "—";
}

// ─── Shared micro-components ──────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn("font-sans font-extrabold text-[11px] text-neutral-500 uppercase tracking-[0.07em] mb-1.5", className)}>
    {children}
  </p>
);

const FieldWrap: React.FC<{ label?: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3.5">
    {label && <SectionLabel>{label}</SectionLabel>}
    {children}
  </div>
);

interface SeverityGridProps {
  value: number | null;
  onChange: (v: number) => void;
}

const SeverityGrid: React.FC<SeverityGridProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-11 gap-1">
    {Array.from({ length: 11 }, (_, i) => (
      <button
        key={i}
        onClick={() => onChange(i)}
        className={cn(
          "aspect-square rounded-lg text-[11px] font-mono font-medium border-2 transition-all",
          value === i
            ? "border-transparent text-white scale-110 shadow-md"
            : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
        )}
        style={value === i ? { background: sevColor(i) } : undefined}
      >
        {i}
      </button>
    ))}
  </div>
);

interface ScreenHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, sub, action }) => (
  <div className="bg-white px-5 py-3.5 border-b border-neutral-100 flex justify-between items-center shrink-0">
    <div>
      {sub && <p className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-400 mb-0.5">{sub}</p>}
      <h2 className="font-serif text-[22px] text-neutral-800 m-0 tracking-[-0.2px]">{title}</h2>
    </div>
    {action}
  </div>
);

interface HTabsProps {
  tabs: SubTab[];
  active: string;
  onChange: (id: string) => void;
}

const HTabs: React.FC<HTabsProps> = ({ tabs, active, onChange }) => (
  <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white border-b border-neutral-100 shrink-0">
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer whitespace-nowrap transition-colors",
          active === t.id
            ? "border-primary-400 bg-primary-50 text-primary-600"
            : "border-neutral-200 bg-transparent text-neutral-400"
        )}
      >
        <span>{t.icon}</span>
        {t.label}
      </button>
    ))}
  </div>
);

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color = "#1F8DB5", height = 60 }) => {
  const w = 340;
  const h = height;
  const pad = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const area = `M${pts[0]} L${pts.join(" L")} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: LOG
// ════════════════════════════════════════════════════════════════════════════════

const LOG_TABS: SubTab[] = [
  { id: "symptoms",  icon: "🔍", label: "Symptoms"  },
  { id: "triggers",  icon: "⚠️", label: "Triggers"  },
  { id: "activity",  icon: "🏃", label: "Activity"  },
  { id: "food",      icon: "🍎", label: "Food"      },
  { id: "vitals",    icon: "❤️", label: "Vitals"    },
  { id: "treatment", icon: "💊", label: "Treatment" },
];

interface LogScreenProps {
  child: string;
  initialTab?: string;
}

const LogScreen: React.FC<LogScreenProps> = ({ child, initialTab = "symptoms" }) => {
  const [tab, setTab] = useState(initialTab);

  // Symptom
  const [sDate, setSDate]           = useState(new Date().toISOString().split("T")[0]);
  const [sType, setSType]           = useState("");
  const [sSev, setSSev]             = useState<number | null>(null);
  const [sImportant, setSImportant] = useState(false);
  const [sNote, setSNote]           = useState("");
  const [sSaved, setSSaved]         = useState(false);

  // Activity
  const [aName, setAName] = useState("");
  const [aType, setAType] = useState("Screen Time");
  const [aDur,  setADur]  = useState("30");
  const [aDate, setADate] = useState(new Date().toISOString().split("T")[0]);
  const [aNote, setANote] = useState("");
  const [aSaved, setASaved] = useState(false);

  // Food
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("Meal");
  const [fDate, setFDate] = useState(new Date().toISOString().split("T")[0]);
  const [fNote, setFNote] = useState("");
  const [fSaved, setFSaved] = useState(false);

  // Vitals
  const [vType, setVType] = useState("Temperature");
  const [vVal,  setVVal]  = useState("");
  const [vDate, setVDate] = useState(new Date().toISOString().split("T")[0]);
  const [vTime, setVTime] = useState("09:00");
  const [vSaved, setVSaved] = useState(false);

  // Treatment
  const [tType,           setTType]           = useState("Antibiotic");
  const [tName,           setTName]           = useState("");
  const [tDose,           setTDose]           = useState("");
  const [tNote,           setTNote]           = useState("");
  const [tStartDate,      setTStartDate]      = useState(new Date().toISOString().split("T")[0]);
  const [tStatus,         setTStatus]         = useState<"active" | "discontinued" | "failed">("active");
  const [tHelpRating,     setTHelpRating]     = useState<number | null>(null);
  const [tWorsenedPans,   setTWorsenedPans]   = useState(false);
  const [tSideEffects,    setTSideEffects]    = useState<string[]>([]);
  const [tCustomSideEffect, setTCustomSideEffect] = useState("");
  const [tFailReason,     setTFailReason]     = useState("");
  const [tEndDate,        setTEndDate]        = useState("");
  const [tSaved,          setTSaved]          = useState(false);
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentEntry[]>([
    { type: "Antibiotic", name: "Amoxicillin 500mg", dose: "500mg 2x/day", startDate: "2025-11-01", endDate: "", status: "active", helpRating: 3, worsenedPans: false, sideEffects: ["GI upset / nausea"], failReason: "", note: "Switched from azithromycin — better tolerance" },
    { type: "Immunotherapy", name: "IVIG", dose: "2g/kg split over 2 days", startDate: "2025-09-15", endDate: "2025-09-16", status: "discontinued", helpRating: 4, worsenedPans: false, sideEffects: ["Headache","Fatigue"], failReason: "", note: "1st infusion. Significant improvement wks 2-4" },
  ]);
  const [treatEditIdx, setTreatEditIdx] = useState<number | null>(null);

  const toggleSideEffect = (se: string) =>
    setTSideEffects((prev) => prev.includes(se) ? prev.filter((x) => x !== se) : [...prev, se]);

  const handleSymptomSave = () => {
    setSSaved(true);
    setTimeout(() => setSSaved(false), 2500);
    setSType(""); setSSev(null); setSNote(""); setSImportant(false);
  };

  const handleActivitySave = () => {
    setASaved(true);
    setTimeout(() => setASaved(false), 2500);
    setAName(""); setANote("");
  };

  const handleFoodSave = () => {
    setFSaved(true);
    setTimeout(() => setFSaved(false), 2500);
    setFName(""); setFNote("");
  };

  const handleVitalSave = () => {
    setVSaved(true);
    setTimeout(() => setVSaved(false), 2500);
    setVVal("");
  };

  const handleTreatmentSave = () => {
    if (!tName) return;
    const entry: TreatmentEntry = {
      type: tType, name: tName, dose: tDose,
      startDate: tStartDate, endDate: tStatus !== "active" ? tEndDate : "",
      status: tStatus, helpRating: tHelpRating,
      worsenedPans: tWorsenedPans,
      sideEffects: tCustomSideEffect ? [...tSideEffects, tCustomSideEffect] : tSideEffects,
      failReason: tFailReason, note: tNote,
    };
    if (treatEditIdx !== null) {
      setTreatmentHistory((h) => h.map((x, i) => i === treatEditIdx ? entry : x));
      setTreatEditIdx(null);
    } else {
      setTreatmentHistory((h) => [entry, ...h]);
    }
    setTName(""); setTDose(""); setTNote(""); setTStatus("active");
    setTHelpRating(null); setTWorsenedPans(false); setTSideEffects([]);
    setTCustomSideEffect(""); setTFailReason(""); setTEndDate("");
    setTSaved(true); setTimeout(() => setTSaved(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScreenHeader title="Log Entry" sub={`Tracking · ${child}`} />
      <HTabs tabs={LOG_TABS} active={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">

        {/* ── SYMPTOMS ── */}
        {tab === "symptoms" && (
          <Card>
            <CardContent className="p-4 space-y-3.5">
              <h3 className="font-serif text-xl text-neutral-800 m-0">Record Symptom</h3>
              <FieldWrap label="Date">
                <Input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} />
              </FieldWrap>
              <FieldWrap label="Symptom Type">
                <Select value={sType} onValueChange={setSType}>
                  <SelectTrigger><SelectValue placeholder="Select symptom…" /></SelectTrigger>
                  <SelectContent>
                    {SYMPTOM_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Severity (0–10)">
                <SeverityGrid value={sSev} onChange={setSSev} />
                {sSev !== null && (
                  <p className="font-sans text-[12px] text-neutral-500 mt-1.5 text-center">
                    <span className="font-bold" style={{ color: sevColor(sSev) }}>{sSev}/10</span>
                    {" — "}{sevLabel(sSev)}
                  </p>
                )}
              </FieldWrap>
              <div>
                <button
                  onClick={() => setSImportant((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer transition-all",
                    sImportant ? "border-warning-400 bg-warning-50 text-warning-500" : "border-neutral-200 text-neutral-400"
                  )}
                >
                  ⭐ {sImportant ? "Marked Important" : "Mark as Important"}
                </button>
              </div>
              <FieldWrap label="Notes (Optional)">
                <Textarea
                  value={sNote}
                  onChange={(e) => setSNote(e.target.value)}
                  placeholder="Describe what you observed…"
                  className="min-h-[80px] resize-none"
                />
              </FieldWrap>
              {sSaved ? (
                <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
                  <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Symptom recorded successfully</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleSymptomSave}>Record Symptom</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TRIGGERS ── */}
        {tab === "triggers" && <TriggerTracker />}

        {/* ── ACTIVITY ── */}
        {tab === "activity" && (
          <Card>
            <CardContent className="p-4 space-y-3.5">
              <h3 className="font-serif text-xl text-neutral-800 m-0">Log Activity</h3>
              <FieldWrap label="Activity Name">
                <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g. 30 min walk, Lego time…" />
              </FieldWrap>
              <FieldWrap label="Activity Type">
                <Select value={aType} onValueChange={setAType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrap label="Duration (min)">
                  <Input type="number" value={aDur} onChange={(e) => setADur(e.target.value)} min="1" />
                </FieldWrap>
                <FieldWrap label="Date">
                  <Input type="date" value={aDate} onChange={(e) => setADate(e.target.value)} />
                </FieldWrap>
              </div>
              <FieldWrap label="Notes">
                <Textarea value={aNote} onChange={(e) => setANote(e.target.value)} placeholder="Any observations…" className="min-h-[68px] resize-none" />
              </FieldWrap>
              {aSaved ? (
                <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
                  <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Activity logged</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleActivitySave}>Log Activity</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── FOOD ── */}
        {tab === "food" && (
          <Card>
            <CardContent className="p-4 space-y-3.5">
              <h3 className="font-serif text-xl text-neutral-800 m-0">Food Journal</h3>
              <FieldWrap label="Food / Meal">
                <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Oatmeal with blueberries…" />
              </FieldWrap>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrap label="Type">
                  <Select value={fType} onValueChange={setFType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldWrap>
                <FieldWrap label="Date">
                  <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
                </FieldWrap>
              </div>
              <FieldWrap label="Notes">
                <Textarea value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="Reactions, amounts, context…" className="min-h-[68px] resize-none" />
              </FieldWrap>
              {fSaved ? (
                <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
                  <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Entry saved</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleFoodSave}>Save Entry</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── VITALS ── */}
        {tab === "vitals" && (
          <Card>
            <CardContent className="p-4 space-y-3.5">
              <h3 className="font-serif text-xl text-neutral-800 m-0">Vital Signs</h3>
              <FieldWrap label="Vital Type">
                <Select value={vType} onValueChange={setVType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VITAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Value">
                <Input
                  value={vVal}
                  onChange={(e) => setVVal(e.target.value)}
                  placeholder={vType === "Temperature" ? "e.g. 98.6" : vType === "Blood Pressure" ? "e.g. 110/70" : "Enter value"}
                />
              </FieldWrap>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrap label="Date">
                  <Input type="date" value={vDate} onChange={(e) => setVDate(e.target.value)} />
                </FieldWrap>
                <FieldWrap label="Time">
                  <Input type="time" value={vTime} onChange={(e) => setVTime(e.target.value)} />
                </FieldWrap>
              </div>
              {vSaved ? (
                <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
                  <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Vital recorded</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleVitalSave}>Record Vital</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TREATMENT ── */}
        {tab === "treatment" && (
          <div className="space-y-4">
            <Card className={treatEditIdx !== null ? "border-2 border-warning-400" : ""}>
              <CardContent className="p-4 space-y-3.5">
                {treatEditIdx !== null && (
                  <div className="flex justify-between items-center bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
                    <span className="font-sans font-extrabold text-[12px] text-warning-600">✏️ Editing treatment</span>
                    <button onClick={() => setTreatEditIdx(null)} className="font-sans font-extrabold text-[11px] text-neutral-500 bg-none border-none cursor-pointer">✕ Cancel</button>
                  </div>
                )}
                <h3 className="font-serif text-xl text-neutral-800 m-0">
                  {treatEditIdx !== null ? "Edit Treatment" : "Log Treatment"}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrap label="Type">
                    <Select value={tType} onValueChange={(v) => setTType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Start Date">
                    <Input type="date" value={tStartDate} onChange={(e) => setTStartDate(e.target.value)} />
                  </FieldWrap>
                </div>
                <FieldWrap label="Name / Medication">
                  <Input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="e.g. Amoxicillin 500mg" />
                </FieldWrap>
                <FieldWrap label="Dosage">
                  <Input value={tDose} onChange={(e) => setTDose(e.target.value)} placeholder="e.g. 500mg twice daily" />
                </FieldWrap>

                {/* Status */}
                <FieldWrap label="Treatment Status">
                  <div className="flex gap-2">
                    {([["active","Active","bg-success-50 border-success-400 text-success-600"],
                       ["discontinued","Stopped","bg-neutral-100 border-neutral-300 text-neutral-500"],
                       ["failed","Failed","bg-danger-50 border-danger-400 text-danger-500"]] as const).map(([v, l, cls]) => (
                      <button key={v} onClick={() => setTStatus(v)}
                        className={cn("flex-1 py-2 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all",
                          tStatus === v ? cls : "border-neutral-200 text-neutral-400 bg-transparent")}>
                        {l}
                      </button>
                    ))}
                  </div>
                </FieldWrap>

                {/* Help rating */}
                <FieldWrap label="How much did it help?">
                  <div className="flex gap-1.5 flex-wrap">
                    {HELP_LEVELS.map((hl) => (
                      <button key={hl.v} onClick={() => setTHelpRating(hl.v)}
                        className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all",
                          tHelpRating === hl.v ? "border-primary-400 bg-primary-50 text-primary-600" : "border-neutral-200 text-neutral-400")}>
                        {hl.emoji} {hl.l}
                      </button>
                    ))}
                  </div>
                </FieldWrap>

                {/* Worsened toggle */}
                <div>
                  <button
                    onClick={() => setTWorsenedPans((v) => !v)}
                    className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all",
                      tWorsenedPans ? "border-danger-400 bg-danger-50 text-danger-500" : "border-neutral-200 text-neutral-400")}
                  >
                    ⚠️ {tWorsenedPans ? "Worsened PANS symptoms" : "Mark if it worsened PANS"}
                  </button>
                </div>

                {/* Side effects */}
                <FieldWrap label="Side Effects">
                  <div className="flex flex-wrap gap-1.5">
                    {SIDE_EFFECT_OPTIONS.map((se) => (
                      <button key={se} onClick={() => toggleSideEffect(se)}
                        className={cn("px-2.5 py-1 rounded-full border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all",
                          tSideEffects.includes(se) ? "border-secondary-400 bg-secondary-50 text-secondary-600" : "border-neutral-200 text-neutral-400")}>
                        {se}
                      </button>
                    ))}
                  </div>
                </FieldWrap>

                {tStatus === "failed" && (
                  <FieldWrap label="Reason for Discontinuation">
                    <Textarea value={tFailReason} onChange={(e) => setTFailReason(e.target.value)} placeholder="Why was treatment stopped or deemed ineffective?" className="min-h-[68px] resize-none" />
                  </FieldWrap>
                )}

                <FieldWrap label="Notes">
                  <Textarea value={tNote} onChange={(e) => setTNote(e.target.value)} placeholder="Observations, tolerability, outcomes…" className="min-h-[68px] resize-none" />
                </FieldWrap>

                {tSaved ? (
                  <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
                    <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Treatment saved</span>
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleTreatmentSave}>
                    {treatEditIdx !== null ? "Update Treatment" : "Save Treatment"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Treatment history */}
            {treatmentHistory.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <SectionLabel className="mb-3">Treatment History</SectionLabel>
                  <div className="divide-y divide-neutral-100">
                    {treatmentHistory.map((t, i) => {
                      const statusColors: Record<string, string> = {
                        active: "bg-success-50 text-success-600 border-success-200",
                        discontinued: "bg-neutral-100 text-neutral-500 border-neutral-200",
                        failed: "bg-danger-50 text-danger-500 border-danger-200",
                      };
                      return (
                        <div key={i} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-sans font-extrabold text-[13px] text-neutral-800">{t.name}</span>
                                <Badge className={cn("text-[10px] py-0 px-2 border", statusColors[t.status])}>
                                  {t.status}
                                </Badge>
                                {t.helpRating !== null && (
                                  <span className="text-[11px]">{HELP_LEVELS[t.helpRating]?.emoji}</span>
                                )}
                              </div>
                              <p className="font-sans text-[11px] text-neutral-400 mt-0.5">{t.type} · {t.dose}</p>
                              {t.sideEffects.length > 0 && (
                                <p className="font-sans text-[11px] text-neutral-400 mt-0.5">Side effects: {t.sideEffects.join(", ")}</p>
                              )}
                              {t.note && <p className="font-sans text-[12px] text-neutral-500 mt-1 italic">{t.note}</p>}
                            </div>
                            <button
                              onClick={() => {
                                setTreatEditIdx(i);
                                setTType(t.type); setTName(t.name); setTDose(t.dose);
                                setTStartDate(t.startDate); setTEndDate(t.endDate);
                                setTStatus(t.status); setTHelpRating(t.helpRating);
                                setTWorsenedPans(t.worsenedPans); setTSideEffects(t.sideEffects);
                                setTFailReason(t.failReason); setTNote(t.note);
                              }}
                              className="text-[11px] text-primary-500 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: TRENDS
// ════════════════════════════════════════════════════════════════════════════════

interface TrendsScreenProps {
  child: string;
  onOpenHeatmap: () => void;
}

const TrendsScreen: React.FC<TrendsScreenProps> = ({ child, onOpenHeatmap }) => {
  const [range, setRange] = useState("30d");
  const data = range === "7d" ? MOCK_DAYS.slice(-7) : range === "14d" ? MOCK_DAYS.slice(-14) : MOCK_DAYS.slice(-30);
  const vals = data.map((d) => d.overall);
  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  const trend = vals[vals.length - 1] - vals[0];
  const flareCount = data.filter((d) => d.flarePeak).length;

  const KPI_ITEMS = [
    { l: "Avg Severity", v: avg,                     u: "/10",      c: sevColor(parseFloat(avg)) },
    { l: "Flare Events", v: String(flareCount),       u: " detected", c: "#FF4545"              },
    { l: "Trend",        v: trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1), u: "", c: trend > 0 ? "#FF4545" : "#28BC79" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScreenHeader
        title="Trends"
        sub={`${child} · ${range} view`}
        action={
          <button className="bg-primary-50 border-[1.5px] border-primary-200 rounded-xl px-3 py-1.5 font-sans font-extrabold text-[12px] text-primary-600 cursor-pointer">
            📄 Export
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3.5">
        {/* Range toggle */}
        <div className="flex gap-1.5 bg-neutral-100 rounded-xl p-0.5">
          {[["7d","7 Days"],["14d","14 Days"],["30d","30 Days"]].map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)}
              className={cn("flex-1 py-2 rounded-lg border-none font-sans font-extrabold text-[12px] cursor-pointer transition-all",
                range === v ? "bg-white text-primary-600 shadow-sm" : "bg-transparent text-neutral-400")}>
              {l}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {KPI_ITEMS.map((k) => (
            <Card key={k.l}>
              <CardContent className="p-3 text-center">
                <p className="font-mono text-xl mb-0.5 font-medium" style={{ color: k.c }}>
                  {k.v}<span className="text-[10px] text-neutral-300">{k.u}</span>
                </p>
                <p className="font-sans text-[10px] text-neutral-400 m-0">{k.l}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-4">
            <SectionLabel>Overall Severity</SectionLabel>
            <div className="relative mt-1.5">
              {data.map((d, i) => d.isFlare && (
                <div key={i} className="absolute top-0 bottom-0 bg-danger-400/7 z-0"
                  style={{ left: `${(i / data.length) * 100}%`, width: `${(1 / data.length) * 100}%` }} />
              ))}
              <Sparkline data={vals} color="#1F8DB5" height={70} />
            </div>
            <div className="flex justify-between mt-1">
              {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d, i) => (
                <span key={i} className="font-mono text-[9px] text-neutral-300">
                  {d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 p-1.5 bg-danger-50 rounded-lg">
              <div className="w-2.5 h-2.5 bg-danger-400/15 border border-danger-200 rounded-sm" />
              <span className="font-sans text-[11px] text-danger-600">Shaded areas = detected flare periods</span>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap preview */}
        <Card className="cursor-pointer" onClick={onOpenHeatmap}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2.5">
              <SectionLabel className="mb-0">Flare Heatmap</SectionLabel>
              <span className="font-sans text-[12px] font-extrabold text-primary-500">Full View →</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} className="text-center font-sans text-[9px] text-neutral-400 font-bold pb-0.5">{d}</div>
              ))}
              {MOCK_DAYS.slice(0, 28).map((d, i) => (
                <div key={i} className="aspect-square rounded-[4px]"
                  style={{ background: d.flarePeak ? "#B81818" : d.isFlare ? "#FF4545" : d.overall >= 6 ? "#F5A81A" : d.overall >= 3 ? "#28BC79" : "#EEF0F4" }} />
              ))}
            </div>
            <div className="flex gap-2.5 mt-2.5 justify-center flex-wrap">
              {[["#EEF0F4","None"],["#28BC79","Mild"],["#F5A81A","Moderate"],["#FF4545","Flare"],["#B81818","Peak"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span className="font-sans text-[10px] text-neutral-400">{l}</span>
                </div>
              ))}
            </div>
            <p className="font-sans text-[11px] text-neutral-400 text-center mt-2 mb-0">Tap to open full interactive heatmap</p>
          </CardContent>
        </Card>

        {/* Insight */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1F8DB5, #6E50C3)" }}>
          <p className="font-sans font-extrabold text-[10px] text-white/60 uppercase tracking-[0.07em] mb-1.5">🔬 Pattern Insight</p>
          <p className="font-serif text-[15px] text-white mb-1.5 leading-tight">Flares correlate with school exposure events</p>
          <p className="font-sans text-[11px] text-white/65 leading-relaxed m-0">
            Both detected flares occurred within 48h of reported illness or strep exposure. Discuss prophylactic options with your care team.
          </p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: EDUCATION
// ════════════════════════════════════════════════════════════════════════════════

const InfoCard: React.FC<{ icon: string; title: string; color: string; children: React.ReactNode }> = ({ icon, title, color, children }) => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] shrink-0" style={{ background: color + "18" }}>
          {icon}
        </div>
        <p className="font-sans font-extrabold text-[13px] text-neutral-800 m-0">{title}</p>
      </div>
      <div className="font-sans text-[13px] text-neutral-600 leading-relaxed">{children}</div>
    </CardContent>
  </Card>
);

const EducationScreen: React.FC = () => {
  const [tab, setTab] = useState("about");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 pb-3.5 flex items-center gap-3 shrink-0" style={{ background: "linear-gradient(135deg, #176F91, #573F9E)" }}>
        <img src="/owl-mascot.png" alt="Esther" className="w-12 h-12 object-contain shrink-0" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
        <div>
          <p className="font-sans font-extrabold text-[10px] text-white/55 uppercase tracking-[0.08em] m-0">Knowledge Hub</p>
          <p className="font-serif text-lg text-white m-0">Learn About PANS</p>
        </div>
      </div>
      <HTabs tabs={EDU_TABS} active={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto p-4 pb-20">

        {tab === "about" && (
          <>
            <div className="rounded-2xl p-4 mb-4 border border-primary-100" style={{ background: "linear-gradient(135deg, #EDF6F9, #F4F0FA)" }}>
              <p className="font-serif text-[22px] text-primary-700 mb-2">PANS & PANDAS</p>
              <p className="font-sans text-[13px] text-neutral-600 leading-relaxed m-0">
                <strong>PANS</strong> (Pediatric Acute-onset Neuropsychiatric Syndrome) is a clinical condition defined by the sudden onset of OCD and/or severe eating restrictions, plus at least two concurrent neurological, behavioral, or cognitive symptoms.
              </p>
            </div>
            <InfoCard icon="⚡" title="The PANDAS Subset" color="#FF4545">
              <p className="mb-2"><strong>PANDAS</strong> (Pediatric Autoimmune Neuropsychiatric Disorders Associated with Streptococcal Infections) is a specific subset of PANS triggered by Group A Strep (GAS) infections.</p>
              <p className="m-0">Symptoms may begin during or right after an active infection — or even a month or two after the infection has resolved.</p>
            </InfoCard>
            <InfoCard icon="🔬" title="What Happens in the Brain" color="#8A6DD2">
              <p className="mb-2">Researchers believe infections trigger an immune response that mistakenly targets the brain — specifically the basal ganglia, which controls movement and behavior.</p>
              <p className="m-0">Post-infectious autoimmunity and/or neuroinflammation are found in <strong>more than 80% of PANS cases</strong>.</p>
            </InfoCard>
            <InfoCard icon="👶" title="Who Gets PANS/PANDAS?" color="#28BC79">
              <p className="m-0">Most commonly affects children between ages 3 and puberty. The sudden, dramatic onset sets it apart from gradually developing conditions. Parents often describe their child as a completely different person overnight.</p>
            </InfoCard>
            <InfoCard icon="⏰" title="Clinical Urgency" color="#E82020">
              Early identification and treatment significantly affects long-term outcomes. Delays in diagnosis allow neuroinflammation to persist. If you suspect PANS/PANDAS, seek evaluation promptly.
            </InfoCard>
          </>
        )}

        {tab === "causes" && (
          <>
            <div className="bg-[#FFF8E6] rounded-2xl p-4 mb-3.5 border border-[#FFE0A0]">
              <p className="font-serif text-lg text-[#A06000] mb-1.5">PANS Has Multiple Triggers</p>
              <p className="font-sans text-[13px] text-[#7A4800] leading-relaxed m-0">PANS can be triggered by infections, metabolic disturbances, neurological issues, psychosocial stress, and other inflammatory reactions. Post-infectious autoimmunity/neuroinflammation is found in <strong>80%+ of cases</strong>.</p>
            </div>
            {[
              { icon: "🦠", title: "Group A Strep (PANDAS)",   color: "#FF4545", desc: "The most well-studied trigger. Can affect throat, perianal area, skin, or sinuses. Symptoms can appear weeks after infection resolves." },
              { icon: "🤧", title: "Other Bacterial Infections", color: "#E07030", desc: "Mycoplasma pneumoniae, Lyme disease and other tick-borne infections, sinusitis, urinary tract infections." },
              { icon: "🌡️", title: "Viral Infections",          color: "#C040C0", desc: "Influenza, EBV (mono), herpes viruses (including HHV-6), enteroviruses. COVID-19 has also been identified as a potential trigger." },
              { icon: "😰", title: "Psychosocial Stress",        color: "#6E50C3", desc: "Severe psychosocial stress can trigger or worsen PANS symptoms in susceptible individuals." },
            ].map((t, i) => (
              <InfoCard key={i} icon={t.icon} title={t.title} color={t.color}>{t.desc}</InfoCard>
            ))}
          </>
        )}

        {tab === "symptoms" && (
          <>
            <InfoCard icon="⚡" title="Hallmark: Sudden Onset" color="#FF4545">
              The defining feature of PANS/PANDAS is the <strong>sudden, dramatic onset</strong> — often overnight. This sudden onset distinguishes it from typical childhood psychiatric conditions.
            </InfoCard>
            {[
              { icon: "🔄", title: "OCD & Compulsive Behaviors",     color: "#6E50C3", desc: "Sudden onset of obsessions, compulsions, rituals. May be entirely new or dramatically worsened existing tendencies." },
              { icon: "😰", title: "Anxiety & Separation Anxiety",   color: "#E07030", desc: "Intense, sudden-onset fears. Refusal to separate from parents. Phobias appearing out of nowhere." },
              { icon: "⚡", title: "Tics & Motor Movements",          color: "#F5A81A", desc: "Motor tics (blinking, facial grimacing, body movements) or vocal tics may appear or worsen dramatically." },
              { icon: "😤", title: "Emotional Dysregulation / Rage",  color: "#E82020", desc: "Extreme mood swings, rage episodes disproportionate to triggers. Emotional lability." },
              { icon: "🧠", title: "Cognitive & Academic Decline",    color: "#1F8DB5", desc: "Sudden deterioration in handwriting, reading, math. Difficulty concentrating. Sensory sensitivities." },
              { icon: "🛏️", title: "Sleep & Urinary Symptoms",        color: "#105270", desc: "Urinary frequency, bedwetting after being dry, refusal to use the bathroom. Sleep disturbances." },
            ].map((s, i) => (
              <InfoCard key={i} icon={s.icon} title={s.title} color={s.color}>{s.desc}</InfoCard>
            ))}
          </>
        )}

        {tab === "treatment" && (
          <>
            <div className="rounded-2xl p-4 mb-3.5 border border-primary-100" style={{ background: "linear-gradient(135deg, #EDF6F9, #F4F0FA)" }}>
              <p className="font-serif text-lg text-primary-700 mb-1.5">Treatment Is Multi-Modal</p>
              <p className="font-sans text-[13px] text-neutral-600 leading-relaxed m-0">PANS/PANDAS is treated by addressing the underlying cause, reducing neuroinflammation, and managing psychiatric symptoms. No single treatment works for everyone.</p>
            </div>
            {[
              { icon: "💊", title: "Antibiotics",                 color: "#28BC79", desc: "First-line for strep-triggered PANDAS. Amoxicillin, Azithromycin, or Augmentin. Prophylactic antibiotics may prevent recurrence." },
              { icon: "🧪", title: "Immunomodulation",            color: "#8A6DD2", desc: "IVIG and therapeutic plasma exchange (TPE/plasmapheresis) are used for severe or refractory cases. Can provide dramatic improvement." },
              { icon: "🔥", title: "Anti-inflammatories",         color: "#E07030", desc: "NSAIDs (ibuprofen) can provide rapid but temporary relief. Steroids are used cautiously due to immune effects." },
              { icon: "🧠", title: "Psychiatric / Behavioral",    color: "#1F8DB5", desc: "CBT, ERP for OCD, SSRI medications. Important: SSRIs may need lower doses and careful titration in PANS." },
              { icon: "🌿", title: "Supplements & Integrative",   color: "#28BC79", desc: "NAC, Omega-3, Vitamin D, probiotics, and other supplements are used by many families. Always discuss with your provider." },
            ].map((t, i) => (
              <InfoCard key={i} icon={t.icon} title={t.title} color={t.color}>{t.desc}</InfoCard>
            ))}
          </>
        )}

        {tab === "school" && (
          <>
            <InfoCard icon="🏫" title="Your Child Needs School Accommodations" color="#1F8DB5">
              PANS/PANDAS is a recognized medical condition that qualifies children for educational accommodations under Section 504 or an IEP. Don't wait for the school to offer — advocate proactively.
            </InfoCard>
            {[
              { icon: "📋", title: "504 Plan vs. IEP",               color: "#6E50C3", desc: "A 504 Plan provides accommodations (extended time, reduced assignments). An IEP provides specialized instruction + services. Both require documentation of medical need." },
              { icon: "⏰", title: "Attendance & Tardiness Policies", color: "#E07030", desc: "Request attendance policy modifications. Flares may cause school refusal or inability to attend. Document in the 504/IEP." },
              { icon: "✍️", title: "OT Supports for Handwriting",     color: "#28BC79", desc: "Sudden handwriting decline is a hallmark PANS symptom. Request OT evaluation. Keyboarding accommodations are appropriate." },
              { icon: "🧘", title: "Mental Health Supports",          color: "#F5A81A", desc: "Anxiety, OCD, and emotional dysregulation require a safe, low-demand environment during flares. Consider a quiet room, flexible scheduling." },
              { icon: "📝", title: "What to Bring to the School Meeting", color: "#1F8DB5", desc: "Bring a letter from your diagnosing physician, symptom logs from this app, documentation of academic regression, and a list of requested accommodations." },
            ].map((s, i) => (
              <InfoCard key={i} icon={s.icon} title={s.title} color={s.color}>{s.desc}</InfoCard>
            ))}
          </>
        )}

        {tab === "resources" && (
          <div className="space-y-3">
            {[
              { icon: "🌐", title: "ASPIRE (aspire.care)",               url: "https://aspire.care",                  desc: "The leading PANS/PANDAS research & education organization. Clinician guidelines, patient resources." },
              { icon: "🌐", title: "PANDAS Network",                     url: "https://pandasnetwork.org",            desc: "Patient advocacy. Provider directory, research updates, family support." },
              { icon: "🌐", title: "PANDAS Physicians Network (PPN)",    url: "https://ppnnetwork.com",              desc: "Clinician-focused network. Treatment guidelines, case consultations." },
              { icon: "🌐", title: "ACN Latitudes",                      url: "https://latitudes.org",               desc: "Integrative health information for tics, PANS/PANDAS, and related conditions." },
              { icon: "📄", title: "2017 JCAP Treatment Guidelines",     url: "https://aspire.care",                  desc: "Swedo et al. Foundational treatment guidelines for PANS/PANDAS clinicians." },
              { icon: "👥", title: "PANDAS Parents Facebook Group",       url: "https://facebook.com",                 desc: "Peer support community with 40,000+ members. Real-world experience sharing." },
            ].map((r, i) => (
              <Card key={i}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-extrabold text-[13px] text-primary-600 m-0">{r.title}</p>
                    <p className="font-sans text-[12px] text-neutral-500 mt-0.5 leading-relaxed m-0">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCREEN: MORE
// ════════════════════════════════════════════════════════════════════════════════

interface MoreScreenProps {
  onNav: (screen: string) => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ onNav }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQ_ITEMS = [
    { q: "What is the difference between PANS and PANDAS?", a: "PANDAS is a specific subset of PANS where symptoms are triggered by Group A Streptococcal (GAS) infection. PANS has a broader definition and can be triggered by other infections, metabolic disturbances, or inflammatory reactions." },
    { q: "How quickly can PANS/PANDAS symptoms appear?", a: "The hallmark of PANS/PANDAS is sudden, dramatic onset — often appearing overnight or within 24–48 hours. This rapid onset helps distinguish it from other psychiatric conditions." },
    { q: "Can PANDAS be triggered without a sore throat?", a: "Yes. Group A Strep can infect the perianal area, skin, or sinuses without causing a classic sore throat. Symptoms can also appear weeks after an infection that seemed to resolve." },
    { q: "What lab tests are useful for PANS/PANDAS?", a: "ASO titer, Anti-DNase B, throat culture, and the Cunningham Panel are commonly used. CBC, CRP, ANA, and Mycoplasma titers may also provide useful information." },
    { q: "When is IVIG recommended?", a: "IVIG is typically considered for moderate-to-severe PANS/PANDAS that hasn't responded to antibiotics and anti-inflammatories, or for refractory cases. It's a significant intervention and should be discussed with a specialist." },
    { q: "How do I find a PANDAS-literate doctor?", a: "Use the PANDAS Physicians Network (ppnnetwork.com) and PANDAS Network provider directory. The Community screen in this app also lists recommended providers by state." },
    { q: "Is this app a substitute for medical care?", a: "No. This app is for symptom tracking and information only. Always consult qualified healthcare professionals for diagnosis and treatment decisions." },
  ];

  const handleItemClick = (item: typeof MORE_ITEMS[0]) => {
    if (NAV_SCREEN_ITEMS.has(item.l)) {
      onNav(item.l.toLowerCase().replace(/ /g, "-"));
    } else {
      setActiveItem(activeItem === item.l ? null : item.l);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScreenHeader title="More" sub="All features" />
      <div className="flex-1 overflow-y-auto pb-20">

        {/* Menu grid */}
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {MORE_ITEMS.map((item) => (
            <button
              key={item.l}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-2xl border text-left cursor-pointer transition-colors",
                activeItem === item.l
                  ? "border-primary-400 bg-primary-50"
                  : "border-neutral-100 bg-white hover:bg-neutral-50"
              )}
            >
              <span className="text-lg shrink-0">
                {item.i === "__selfcare__" ? "💜" : item.i}
              </span>
              <div className="min-w-0">
                <p className={cn("font-sans font-extrabold text-[12px] m-0 truncate", activeItem === item.l ? "text-primary-600" : "text-neutral-700")}>{item.l}</p>
                <p className="font-sans text-[10px] text-neutral-400 m-0 truncate">{item.s}</p>
              </div>
              {NAV_SCREEN_ITEMS.has(item.l) && (
                <span className="text-neutral-300 text-xs ml-auto shrink-0">›</span>
              )}
            </button>
          ))}
        </div>

        {/* FAQ section */}
        <div className="px-4 pb-4">
          <SectionLabel className="mb-3">Frequently Asked Questions</SectionLabel>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-start gap-3 p-4 text-left cursor-pointer bg-transparent border-none"
                >
                  <span className="font-sans font-bold text-[13px] text-neutral-700 leading-snug">{faq.q}</span>
                  <span className={cn("text-neutral-400 text-lg shrink-0 transition-transform", openFaq === i ? "rotate-45" : "")}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="font-sans text-[13px] text-neutral-600 leading-relaxed m-0">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PROTOTYPE SHELL
// ════════════════════════════════════════════════════════════════════════════════

type ScreenId = "home" | "log" | "trends" | "heatmap" | "learn" | "records" | "community" | "more";

const SCREEN_NAV = [
  { id: "home" as ScreenId,      l: "🏠 Home"          },
  { id: "log" as ScreenId,       l: "📋 Log"           },
  { id: "trends" as ScreenId,    l: "📈 Trends"        },
  { id: "heatmap" as ScreenId,   l: "🗓️ Heatmap"      },
  { id: "learn" as ScreenId,     l: "📚 Learn"         },
  { id: "records" as ScreenId,   l: "🗂️ Records"      },
  { id: "community" as ScreenId, l: "🌍 Community"     },
  { id: "more" as ScreenId,      l: "⋯ More"           },
];

// Mock HomeScreen wrapper that doesn't need real Firebase data
const MockHomeScreen: React.FC<{ child: string; onLog: () => void; onNav: (s: ScreenId) => void }> = ({ child, onLog, onNav }) => {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const QUICK = [
    { icon: "📈", l: "Trends",        s: "7-day chart",   action: () => onNav("trends")   },
    { icon: "💊", l: "Treatments",    s: "Medications",   action: () => onNav("log")      },
    { icon: "📄", l: "Doctor Report", s: "Export PDF",    action: () => onNav("records")  },
    { icon: "⚡", l: "Triggers",      s: "Correlations",  action: () => onNav("log")      },
  ];
  const RECENT = [
    { icon: "🔄", label: "OCD Behaviors", sev: 3, time: "8:42 AM", important: true  },
    { icon: "⚡", label: "Tics",          sev: 2, time: "7:15 AM", important: false },
    { icon: "😰", label: "Anxiety",       sev: 4, time: "Yesterday", important: false },
  ];
  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-20">
      <div className="p-5 pb-7 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #176F91, #573F9E)" }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <p className="font-sans text-xs mb-0.5 text-white/60">{today}</p>
        <h1 className="font-serif text-[26px] text-white mb-3.5">Good morning 👋</h1>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Avg Today",    v: "2.4", u: "/10",    c: "#28BC79" },
            { l: "Entries",      v: "3",   u: " logged", c: "rgba(255,255,255,0.9)" },
            { l: "Days Tracked", v: "47",  u: " total",  c: "rgba(255,255,255,0.9)" },
          ].map((s) => (
            <div key={s.l} className="bg-white/[0.12] rounded-xl p-2.5 text-center">
              <p className="font-mono text-lg mb-0.5 font-medium" style={{ color: s.c }}>{s.v}<span className="text-[10px] opacity-70">{s.u}</span></p>
              <p className="font-sans text-[10px] text-white/60 m-0">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3.5">
        <button onClick={onLog} className="w-full p-4 rounded-2xl border-0 flex items-center justify-between cursor-pointer"
          style={{ background: "linear-gradient(135deg, #FF4545, #B81818)", boxShadow: "0 6px 20px rgba(232,32,32,0.35)" }}>
          <div className="text-left">
            <p className="font-sans font-extrabold text-[13px] text-white/80 mb-0.5 uppercase tracking-[0.06em]">Quick Log</p>
            <p className="font-serif text-lg text-white m-0">Record Flare Now</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl">🚀</div>
        </button>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <SectionLabel className="mb-0">Recent Entries</SectionLabel>
              <button onClick={() => onNav("log")} className="font-sans text-[12px] text-primary-500 font-bold bg-none border-none cursor-pointer p-0">See all ›</button>
            </div>
            {RECENT.map((e, i) => (
              <div key={i} onClick={() => onNav("log")} className={cn("flex items-center gap-2.5 py-2.5 cursor-pointer", i > 0 ? "border-t border-neutral-50" : "")}>
                <div className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-[17px] shrink-0">{e.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-sans font-bold text-[13px] text-neutral-700 m-0 truncate">{e.label}</p>
                    {e.important && <span className="text-[11px]">⭐</span>}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-400 m-0">{e.time}</p>
                </div>
                <div className="rounded-lg px-2 py-0.5" style={{ background: sevColor(e.sev) + "20" }}>
                  <span className="font-mono text-[11px] font-medium" style={{ color: sevColor(e.sev) }}>{e.sev}/10</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <SectionLabel>Quick Access</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK.map((t) => (
            <Card key={t.l} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={t.action}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="font-sans font-extrabold text-[13px] text-neutral-700 m-0">{t.l}</p>
                  <p className="font-sans text-[11px] text-neutral-400 m-0">{t.s}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
const BottomNav: React.FC<{ active: string; onChange: (id: ScreenId) => void }> = ({ active, onChange }) => (
  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 flex pb-3.5 pt-2 z-20">
    {NAV_TABS.map((t) => (
      <div key={t.id} onClick={() => onChange(t.id as ScreenId)} className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer">
        <span className={cn("leading-none", active === t.id ? "text-[21px]" : "text-[19px] opacity-40")}>{t.icon}</span>
        <span className={cn("font-sans text-[10px]", active === t.id ? "font-extrabold text-primary-500" : "font-semibold text-neutral-400")}>
          {t.label}
        </span>
        {active === t.id && <div className="w-4 h-0.5 bg-primary-500 rounded-full" />}
      </div>
    ))}
  </div>
);

// ─── Records placeholder ───────────────────────────────────────────────────────
const RecordsScreen: React.FC<{ child: string }> = ({ child }) => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <ScreenHeader title="Records" sub={child} />
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-4xl mb-3">🗂️</p>
        <p className="font-serif text-xl text-neutral-700 mb-2">Medical Records</p>
        <p className="font-sans text-[13px] text-neutral-400 leading-relaxed">Doctor reports, lab values, providers, files, and email records — all in one place.</p>
      </div>
    </div>
  </div>
);

const CommunityScreen: React.FC = () => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <ScreenHeader title="Community" sub="PANDAS Specialists" />
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-4xl mb-3">🌍</p>
        <p className="font-serif text-xl text-neutral-700 mb-2">Community Provider Map</p>
        <p className="font-sans text-[13px] text-neutral-400 leading-relaxed">Find PANDAS-literate doctors worldwide. Community-curated and updated.</p>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// ROOT PROTOTYPE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

const PANDASPrototype: React.FC = () => {
  const [screen, setScreen]           = useState<ScreenId>("home");
  const [child, setChild]             = useState("Noah");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showSelfCare, setShowSelfCare]     = useState(true);
  const [showSplash, setShowSplash]         = useState(true);
  const [logTab, setLogTab]                 = useState("symptoms");

  const handleNav = (id: ScreenId, tab?: string) => {
    setScreen(id);
    if (tab) setLogTab(tab);
  };

  return (
    <div className="min-h-screen flex justify-center items-start py-10 px-5"
      style={{ background: "linear-gradient(135deg, #1838C1 0%, #0E9DA8 100%)" }}>

      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <div className="w-full max-w-[900px]">
        {/* Title row */}
        <div className="text-center mb-6 flex items-center justify-center gap-4">
          <img src="/owl-mascot.png" alt="Esther" className="w-16 h-16 object-contain shrink-0"
            style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.4))" }} />
          <div className="text-left">
            <p className="font-sans font-extrabold text-[10px] tracking-[0.12em] uppercase text-white/45 m-0 mb-0.5">SPM HealthTech</p>
            <p className="font-serif text-[24px] text-white m-0 mb-0.5 leading-tight">PANDAS Tracker</p>
            <p className="font-sans text-[12px] text-white/45 m-0">Tap navigation to explore all screens</p>
          </div>
        </div>

        {/* Screen nav pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {SCREEN_NAV.map((s) => (
            <button key={s.id} onClick={() => setScreen(s.id)}
              className={cn("px-5 py-2 rounded-full border-none font-sans font-extrabold text-[13px] cursor-pointer transition-all",
                screen === s.id ? "bg-white/95 text-primary-600" : "bg-white/[0.12] text-white/75 hover:bg-white/20")}>
              {s.l}
            </button>
          ))}
        </div>

        {/* Phone frame */}
        <div className="flex justify-center">
          <div className="w-[390px] bg-neutral-50 rounded-[44px] overflow-hidden relative"
            style={{ height: "844px", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 0 10px rgba(255,255,255,0.08)" }}>

            {/* Status bar */}
            <div className="bg-white px-6 pt-3 pb-2 flex justify-between items-center shrink-0">
              <span className="font-mono text-[12px] font-medium text-neutral-700">9:41</span>
              <span className="font-mono text-[11px] text-neutral-600">●●● WiFi 🔋</span>
            </div>

            {/* Banners */}
            {showDisclaimer && (
              <div className="bg-warning-50 border-b border-warning-100 px-4 py-2.5 flex gap-2.5 items-start shrink-0">
                <span className="text-[14px] mt-0.5 shrink-0">⚠️</span>
                <p className="font-sans text-[11px] text-warning-500 m-0 leading-relaxed flex-1">
                  <strong>Medical Disclaimer:</strong> This app is for tracking purposes only and is not intended to diagnose, treat, cure, or prevent any medical condition.
                </p>
                <button onClick={() => setShowDisclaimer(false)} className="bg-none border-none text-[16px] text-neutral-400 cursor-pointer shrink-0 p-0 leading-none">×</button>
              </div>
            )}
            {showSelfCare && (
              <div className="border-b px-4 py-2.5 flex gap-2.5 items-center shrink-0" style={{ background: "#FFF0F7", borderBottomColor: "#F9C6DF" }}>
                <div className="w-7 h-7 rounded-full bg-[#FF6B9D] flex items-center justify-center text-[14px] shrink-0">💜</div>
                <div className="flex-1">
                  <p className="font-sans font-extrabold text-[12px] text-[#C2185B] m-0 mb-0.5">Remember to Take Care of Yourself Too</p>
                  <p className="font-sans text-[11px] text-[#E91E80]/75 m-0">Caring for a child with PANDAS is challenging. Your wellbeing matters.</p>
                </div>
                <button onClick={() => setShowSelfCare(false)} className="bg-none border-none text-[16px] text-neutral-400 cursor-pointer shrink-0 p-0">×</button>
              </div>
            )}

            {/* Child selector */}
            <div className="bg-white px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                  style={{ background: "linear-gradient(135deg, #6BBCDB, #8A6DD2)" }}>👦</div>
                <div>
                  <p className="font-sans font-extrabold text-[13px] text-neutral-800 m-0">Tracking: {child}</p>
                  <p className="font-sans text-[10px] text-neutral-400 m-0">Active profile</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setChild((c) => c === "Noah" ? "Esther" : "Noah")}
                  className="font-sans font-bold text-[11px] text-primary-500 bg-primary-50 border border-primary-200 rounded-lg px-2.5 py-1 cursor-pointer">
                  Switch
                </button>
                <button className="font-sans font-bold text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 cursor-pointer">
                  + Add
                </button>
              </div>
            </div>

            {/* Screen content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {screen === "home"      && <MockHomeScreen child={child} onLog={() => handleNav("log")} onNav={(s) => handleNav(s)} />}
              {screen === "log"       && <LogScreen child={child} initialTab={logTab} />}
              {screen === "trends"    && <TrendsScreen child={child} onOpenHeatmap={() => setScreen("heatmap")} />}
              {screen === "heatmap"   && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-4xl mb-3">🗓️</p>
                  <p className="font-serif text-xl text-neutral-700 mb-2">Full Heatmap View</p>
                  <p className="font-sans text-[13px] text-neutral-400 mb-4">Interactive month-by-month symptom calendar with per-symptom filtering.</p>
                  <button onClick={() => setScreen("trends")} className="font-sans font-bold text-[12px] text-primary-500 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 cursor-pointer">← Back to Trends</button>
                </div>
              )}
              {screen === "learn"     && <EducationScreen />}
              {screen === "records"   && <RecordsScreen child={child} />}
              {screen === "community" && <CommunityScreen />}
              {screen === "more"      && <MoreScreen onNav={(s) => setScreen(s as ScreenId)} />}
            </div>

            <BottomNav active={screen} onChange={(id) => { setScreen(id); }} />
          </div>
        </div>

        {/* Feature map */}
        <div className="max-w-[390px] mx-auto mt-7 pb-16">
          <p className="font-sans font-extrabold text-[11px] tracking-[0.1em] uppercase text-white/35 mb-3.5">All Components Included</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["📋","Symptom Recording","Date, type, 0–10 scale, important flag, notes"],
              ["🏃","Activity Tracker","Name, type, duration, date, notes"],
              ["🍎","Food Journal","Meals, snacks & supplements"],
              ["❤️","Vital Signs","Temp, HR, BP, weight"],
              ["💊","Treatment Tracker","Type, name, dosage, outcomes, side effects"],
              ["⚠️","Trigger Log","Strep exposure, illness, stress events"],
              ["📈","Trends + Heatmap","30-day chart, calendar view, insights"],
              ["📧","Email Records","Send to doctor directly"],
              ["📚","Education Hub","PANS/PANDAS knowledge base"],
              ["👨‍👩‍👧","Family Sharing","Multi-caregiver access"],
              ["❓","FAQ","Accordion Q&A"],
              ["💜","Self Care Reminder","Caregiver wellness banner"],
            ].map(([i, l, s]) => (
              <div key={l} className="bg-white/[0.08] rounded-xl p-2.5">
                <p className="font-sans font-extrabold text-[12px] text-white/80 m-0 mb-0.5">{i} {l}</p>
                <p className="font-sans text-[10px] text-white/40 m-0 leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-10">
          <div className="inline-flex items-center gap-2.5 bg-white/[0.07] rounded-full py-2 pr-5 pl-2 border border-white/[0.12]">
            <img src="/owl-mascot.png" alt="Esther" className="w-8 h-8 object-contain shrink-0" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }} />
            <span className="font-sans text-[12px] text-white/45">Powered by</span>
            <span className="font-sans font-extrabold text-[13px] text-white/85">SPM HealthTech</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PANDASPrototype;
