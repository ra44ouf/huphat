"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, ArrowLeft, Play, Pause, Copy, Check,
  FileText, ChevronDown, X, Loader, Volume2, Headphones,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

interface Ayah {
  number: number;       // global
  numberInSurah: number;
  text: string;
  words: string[];      // text مقسّم لكلمات للـ highlighting
}

// segment: [ayahNum, wordIndex, startMs, endMs]
type Segment = [number, number, number, number];

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════
const RECITERS = [
  { id: "ar.alafasy",            name: "مشاري راشد العفاسي", qdcId: 7   },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس",   qdcId: 4   },
  { id: "ar.husary",             name: "محمود خليل الحصري",  qdcId: 5   },
  { id: "ar.minshawi",           name: "محمد صديق المنشاوي", qdcId: 3   },
  { id: "ar.muhammadayyoub",     name: "محمد أيوب",          qdcId: 128 },
  { id: "ar.abdullahmatrood",    name: "عبدالله مطرود",       qdcId: 135 },
];

const TAFSIRS = [
  { id: "ar.muyassar", name: "الميسر"   },
  { id: "ar.jalalayn", name: "الجلالين" },
];

const TYPE_LABEL: Record<string, string> = { Meccan: "مكية", Medinan: "مدنية" };

const BASE = "https://api.alquran.cloud/v1";
const QDC  = "https://api.qurancdn.com/api/qdc";

function ayahAudioUrl(edition: string, globalNum: number) {
  return `https://cdn.islamic.network/quran/audio/128/${edition}/${globalNum}.mp3`;
}
function surahAudioUrl(edition: string, surahNum: number) {
  return `https://cdn.islamic.network/quran/audio-surah/128/${edition}/${surahNum}.mp3`;
}

// ═══════════════════════════════════════════════════════════
// Shared Dropdown
// ═══════════════════════════════════════════════════════════
function Dropdown({ value, options, onChange }: {
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = options.find((o) => o.id === value)?.name ?? "";

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 bg-white border border-shubuhat-border-lite rounded-2xl px-4 py-2.5 font-bold text-sm text-shubuhat-green hover:border-shubuhat-gold transition-all whitespace-nowrap shadow-sm"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 start-0 bg-white border border-shubuhat-border-lite rounded-2xl shadow-xl z-50 min-w-[180px] overflow-hidden">
          {options.map((o) => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }}
              className={`w-full text-start px-4 py-3 text-sm font-bold transition-colors hover:bg-shubuhat-green-ghost
                ${value === o.id ? "text-shubuhat-gold bg-shubuhat-green-ghost" : "text-shubuhat-green"}`}>
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Full-Surah Audio Player  (مع word highlighting)
// ═══════════════════════════════════════════════════════════
interface SurahPlayerProps {
  surah: Surah;
  reciter: string;
  onActiveWord: (ayah: number, word: number) => void; // ayahNum (in surah), wordIdx
  onClear: () => void;
}

function SurahPlayer({ surah, reciter, onActiveWord, onClear }: SurahPlayerProps) {
  const audioRef   = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded]     = useState(false);
  const segmentsRef = useRef<Segment[]>([]);
  const qdcId = RECITERS.find((r) => r.id === reciter)?.qdcId ?? 7;
  const url   = surahAudioUrl(reciter, surah.number);

  // جلب timing segments من QuranCDN
  useEffect(() => {
    segmentsRef.current = [];
    fetch(`${QDC}/audio/reciters/${qdcId}/audio_files?chapter_number=${surah.number}&segments=true`)
      .then((r) => r.json())
      .then((d) => {
        const segs: Segment[] = d?.audio_files?.[0]?.segments ?? [];
        segmentsRef.current = segs;
      })
      .catch(() => {});
  }, [surah.number, qdcId]);

  // إيقاف عند تغيير القارئ
  useEffect(() => {
    const el = audioRef.current;
    if (el && !el.paused) { el.pause(); el.load(); setPlaying(false); setLoaded(false); }
  }, [reciter]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); onClear(); }
    else         { el.play().catch(() => {}); setPlaying(true); }
  };

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const ms  = el.currentTime * 1000;
    setProgress((el.currentTime / el.duration) * 100);

    // إيجاد الكلمة الحالية
    const segs = segmentsRef.current;
    if (!segs.length) return;
    let found: Segment | null = null;
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i][2] <= ms) { found = segs[i]; break; }
    }
    if (found) onActiveWord(found[0], found[1] - 1); // wordIdx zero-based
    else       onClear();
  }, [onActiveWord, onClear]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = (Number(e.target.value) / 100) * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-shubuhat-green rounded-[28px] px-5 py-4 mb-8 shadow-xl" dir="ltr">
      <audio
        ref={audioRef} src={url}
        onCanPlay={() => setLoaded(true)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => { setPlaying(false); setProgress(0); onClear(); }}
      />

      <div className="flex items-center gap-4">
        {/* زر تشغيل */}
        <button onClick={toggle} disabled={!loaded}
          className="w-12 h-12 bg-shubuhat-gold rounded-2xl flex items-center justify-center text-shubuhat-green disabled:opacity-40 shrink-0 active:scale-95 transition-all shadow-lg">
          {!loaded ? <Loader size={18} className="animate-spin" />
            : playing ? <Pause size={18} fill="currentColor" />
            : <Play size={18} fill="currentColor" />}
        </button>

        {/* شريط التقدم */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-white/50 text-xs font-bold w-10 shrink-0">
            {fmt((progress / 100) * duration)}
          </span>
          <input type="range" min={0} max={100} value={progress} onChange={seek}
            className="flex-1 accent-shubuhat-gold cursor-pointer h-1" />
          <span className="text-white/50 text-xs font-bold w-10 text-end shrink-0">
            {fmt(duration)}
          </span>
        </div>

        {/* لافتة قراءة السورة */}
        <div className="shrink-0 text-end" dir="rtl">
          <p className="text-shubuhat-gold font-black text-xs">قراءة السورة كاملة</p>
          <p className="text-white/40 text-[10px] font-bold">
            {playing ? "جاري التشغيل..." : loaded ? "جاهز" : "يتم التحميل..."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Single-Ayah Audio Player
// ═══════════════════════════════════════════════════════════
function AyahAudio({ globalNum, edition, onClose }: {
  globalNum: number; edition: string; onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded]     = useState(false);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { el.play().catch(() => {}); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 bg-shubuhat-green rounded-2xl px-4 py-3 mt-3 shadow-lg" dir="ltr">
      <audio ref={audioRef} src={ayahAudioUrl(edition, globalNum)}
        onCanPlay={() => setLoaded(true)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => {
          const el = e.target as HTMLAudioElement;
          if (el.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }} />

      <button onClick={toggle} disabled={!loaded}
        className="w-10 h-10 bg-shubuhat-gold rounded-xl flex items-center justify-center text-shubuhat-green disabled:opacity-50 shrink-0 active:scale-95 transition-all">
        {!loaded ? <Loader size={16} className="animate-spin" />
          : playing ? <Pause size={16} fill="currentColor" />
          : <Play size={16} fill="currentColor" />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-white/50 text-xs font-bold w-10 shrink-0">
          {fmt((progress / 100) * duration)}
        </span>
        <input type="range" min={0} max={100} value={progress}
          onChange={(e) => {
            const el = audioRef.current;
            if (el && duration) el.currentTime = (Number(e.target.value) / 100) * duration;
            setProgress(Number(e.target.value));
          }}
          className="flex-1 accent-shubuhat-gold h-1 cursor-pointer" />
        <span className="text-white/50 text-xs font-bold w-10 text-end shrink-0">
          {fmt(duration)}
        </span>
      </div>

      <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tafsir Panel
// ═══════════════════════════════════════════════════════════
function TafsirPanel({ surahName, ayah, tafsirEdition, activeWordIdx, onClose }: {
  surahName: string;
  ayah: Ayah;
  tafsirEdition: string;
  activeWordIdx: number | null;
  onClose: () => void;
}) {
  const [text, setText]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const tafsirName = TAFSIRS.find((t) => t.id === tafsirEdition)?.name ?? "";

  useEffect(() => {
    setLoading(true); setError(false);
    fetch(`${BASE}/ayah/${ayah.number}/${tafsirEdition}`)
      .then((r) => r.json())
      .then((d) => { setText(d.data?.text ?? null); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [ayah.number, tafsirEdition]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6" dir="rtl">
      <div className="absolute inset-0 bg-shubuhat-green/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-2xl bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-shubuhat-border-lite shrink-0">
          <div>
            <p className="text-xs font-black text-shubuhat-gold uppercase tracking-widest mb-1">
              تفسير {tafsirName}
            </p>
            <h3 className="text-lg font-black text-shubuhat-green">
              سورة {surahName} — الآية {ayah.numberInSurah}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-shubuhat-green-ghost flex items-center justify-center text-shubuhat-text-3 hover:bg-shubuhat-border-lite transition-all">
            <X size={18} />
          </button>
        </div>

        {/* الآية مع highlighting */}
        <div className="px-6 py-4 bg-shubuhat-green-ghost border-b border-shubuhat-border-lite shrink-0">
          <p className="font-black text-shubuhat-green text-xl leading-[2.8] text-center" dir="rtl">
            {ayah.words.map((word, idx) => {
              const isActive = activeWordIdx === idx;
              return (
                <span
                  key={idx}
                  className={`inline transition-colors duration-150 mx-[2px] rounded-md px-[2px]
                    ${isActive ? "text-shubuhat-gold bg-shubuhat-gold/10" : ""}`}
                >
                  {word}{" "}
                </span>
              );
            })}
            <span className="text-shubuhat-gold text-base mx-1">﴿{ayah.numberInSurah}﴾</span>
          </p>
        </div>

        {/* التفسير مع padding كبير تحت لتجنب الـ bottom bar */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
          {loading
            ? <div className="flex items-center justify-center py-16"><Loader size={32} className="animate-spin text-shubuhat-gold" /></div>
            : error
            ? <p className="text-center text-shubuhat-text-3 font-bold py-10">تعذّر تحميل التفسير.</p>
            : <p className="text-shubuhat-text-2 font-medium leading-loose text-lg text-justify" dir="rtl">{text}</p>
          }
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AyahRow — مع word highlighting
// ═══════════════════════════════════════════════════════════
function AyahRow({ ayah, surahName, reciter, tafsirEdition, activeWordIdx }: {
  ayah: Ayah;
  surahName: string;
  reciter: string;
  tafsirEdition: string;
  activeWordIdx: number | null; // null = لا شيء مُضاء
}) {
  const [copied, setCopied]       = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const activeRef = useRef<HTMLSpanElement>(null);

  // scroll الكلمة المُضاءة لتكون مرئية
  useEffect(() => {
    if (activeWordIdx !== null && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeWordIdx]);

  const copy = () => {
    navigator.clipboard.writeText(ayah.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="group bg-white border border-shubuhat-border-lite rounded-[28px] p-5 md:p-7 hover:border-shubuhat-gold/50 hover:shadow-md transition-all duration-300" dir="rtl">

        {/* ── رقم الآية + النص في نفس السطر ── */}
        <div className="flex items-start gap-3 mb-4">
          {/* Badge رقم الآية — في البداية، لا يتداخل مع النص أبدًا */}
          <div className="shrink-0 mt-1 w-9 h-9 bg-shubuhat-green text-shubuhat-gold rounded-xl flex items-center justify-center font-black text-sm">
            {ayah.numberInSurah}
          </div>

          {/* نص الآية مقسّم كلمة كلمة */}
          <p className="text-shubuhat-text-1 text-xl md:text-2xl font-black leading-[2.6] text-justify flex-1"
            style={{ lineHeight: "3" }}>
            {ayah.words.map((word, idx) => {
              const isActive = activeWordIdx === idx;
              return (
                <span
                  key={idx}
                  ref={isActive ? activeRef : undefined}
                  className={`inline transition-colors duration-150 mx-[2px] rounded-md px-[2px]
                    ${isActive
                      ? "text-shubuhat-gold bg-shubuhat-gold/10"
                      : "text-shubuhat-text-1"}`}
                >
                  {word}{" "}
                </span>
              );
            })}
            <span className="text-shubuhat-gold text-base mx-1">﴿{ayah.numberInSurah}﴾</span>
          </p>
        </div>

        {/* مشغّل الآية */}
        {showAudio && (
          <AyahAudio globalNum={ayah.number} edition={reciter}
            onClose={() => setShowAudio(false)} />
        )}

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button onClick={copy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95
              ${copied
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-shubuhat-green-ghost text-shubuhat-green hover:bg-shubuhat-green hover:text-shubuhat-gold border border-transparent"}`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "تم النسخ" : "نسخ"}
          </button>

          <button onClick={() => setShowAudio((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border
              ${showAudio
                ? "bg-shubuhat-green text-shubuhat-gold border-shubuhat-green"
                : "bg-shubuhat-green-ghost text-shubuhat-green hover:bg-shubuhat-green hover:text-shubuhat-gold border-transparent"}`}>
            <Volume2 size={14} />
            {showAudio ? "إخفاء" : "استماع"}
          </button>

          <button onClick={() => setShowTafsir(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 bg-shubuhat-green-ghost text-shubuhat-green hover:bg-shubuhat-green hover:text-shubuhat-gold border border-transparent">
            <FileText size={14} />
            تفسير
          </button>
        </div>
      </div>

      {showTafsir && (
        <TafsirPanel
          surahName={surahName}
          ayah={ayah}
          tafsirEdition={tafsirEdition}
          activeWordIdx={activeWordIdx}
          onClose={() => setShowTafsir(false)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SurahViewer
// ═══════════════════════════════════════════════════════════
function SurahViewer({ surah, reciter, tafsirEdition, onBack, onNavigate }: {
  surah: Surah;
  reciter: string;
  tafsirEdition: string;
  onBack: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}) {
  const [ayahs, setAyahs]     = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [active, setActive]   = useState<{ ayah: number; word: number } | null>(null);

  useEffect(() => {
    setLoading(true); setError(false); setActive(null);
    fetch(`${BASE}/surah/${surah.number}/quran-simple`)
      .then((r) => r.json())
      .then((d) => {
        const list: Ayah[] = (d.data?.ayahs ?? []).map((a: any) => ({
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: a.text,
          words: a.text.trim().split(/\s+/),
        }));
        setAyahs(list);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [surah.number]);

  const handleActiveWord = useCallback((ayahNum: number, wordIdx: number) => {
    setActive({ ayah: ayahNum, word: wordIdx });
  }, []);

  const clearActive = useCallback(() => setActive(null), []);

  const hasBismillah = surah.number !== 1 && surah.number !== 9;
  const hasPrev = surah.number > 1;
  const hasNext = surah.number < 114;

  return (
    <div dir="rtl">
      {/* ── Header with navigation ── */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={onBack}
          className="mt-1 w-10 h-10 rounded-2xl bg-shubuhat-green-ghost text-shubuhat-green flex items-center justify-center hover:bg-shubuhat-green hover:text-shubuhat-gold transition-all shrink-0">
          <ArrowLeft size={18} className="rotate-180" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl md:text-4xl font-black text-shubuhat-green">سورة {surah.name}</h2>
            <span className="px-3 py-1 bg-shubuhat-gold/15 text-shubuhat-gold rounded-xl text-sm font-black">
              {TYPE_LABEL[surah.revelationType]}
            </span>
            <span className="px-3 py-1 bg-shubuhat-green-ghost text-shubuhat-green rounded-xl text-sm font-black">
              {surah.numberOfAyahs} آية
            </span>
          </div>
          <p className="text-shubuhat-text-3 font-bold mt-1">{surah.englishName} · {surah.englishNameTranslation}</p>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!hasPrev}
            title="السورة السابقة"
            className="w-10 h-10 rounded-2xl bg-shubuhat-green-ghost text-shubuhat-green flex items-center justify-center hover:bg-shubuhat-green hover:text-shubuhat-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-shubuhat-green-ghost disabled:hover:text-shubuhat-green">
            <ChevronDown size={18} className="rotate-90" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
            title="السورة التالية"
            className="w-10 h-10 rounded-2xl bg-shubuhat-green-ghost text-shubuhat-green flex items-center justify-center hover:bg-shubuhat-green hover:text-shubuhat-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-shubuhat-green-ghost disabled:hover:text-shubuhat-green">
            <ChevronDown size={18} className="-rotate-90" />
          </button>
        </div>
      </div>

      {/* ── Full surah player ── */}
      {!loading && !error && (
        <SurahPlayer
          surah={surah}
          reciter={reciter}
          onActiveWord={handleActiveWord}
          onClear={clearActive}
        />
      )}

      {/* ── Bismillah ── */}
      {hasBismillah && !loading && (
        <div className="bg-shubuhat-green text-center py-6 rounded-[32px] mb-8 shadow-lg">
          <p className="text-shubuhat-gold font-black text-2xl md:text-3xl" style={{ letterSpacing: "0.05em" }}>
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

      {/* ── Verses ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader size={40} className="animate-spin text-shubuhat-gold mb-4" />
          <p className="text-shubuhat-text-3 font-bold">جاري تحميل سورة {surah.name}...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-shubuhat-text-3 font-bold text-lg">تعذّر تحميل السورة.</p>
          <button onClick={() => { setLoading(true); setError(false); }}
            className="mt-6 bg-shubuhat-green text-white px-6 py-3 rounded-2xl font-black">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ayahs.map((ayah) => (
            <AyahRow
              key={ayah.numberInSurah}
              ayah={ayah}
              surahName={surah.name}
              reciter={reciter}
              tafsirEdition={tafsirEdition}
              activeWordIdx={
                active?.ayah === ayah.numberInSurah ? active.word : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Surah Card
// ═══════════════════════════════════════════════════════════
function SurahCard({ surah, onClick }: { surah: Surah; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group relative w-full text-start bg-white border border-shubuhat-border-lite rounded-[28px] p-5 hover:border-shubuhat-gold hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
      dir="rtl">
      <div className="absolute top-4 end-4 w-9 h-9 bg-shubuhat-green text-shubuhat-gold rounded-xl flex items-center justify-center font-black text-sm shrink-0">
        {surah.number}
      </div>
      <p className="text-2xl font-black text-shubuhat-green group-hover:text-shubuhat-gold transition-colors leading-tight mb-2 pe-10">
        {surah.name}
      </p>
      <p className="text-xs font-bold text-shubuhat-text-3 mb-3">{surah.englishName}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black text-shubuhat-gold bg-shubuhat-gold/10 px-2 py-1 rounded-lg">
          {TYPE_LABEL[surah.revelationType]}
        </span>
        <span className="text-[10px] font-bold text-shubuhat-text-3 bg-shubuhat-green-ghost px-2 py-1 rounded-lg">
          {surah.numberOfAyahs} آية
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════
export function QuranSection() {
  const [surahs, setSurahs]               = useState<Surah[]>([]);
  const [surahsLoading, setSurahsLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [search, setSearch]               = useState("");
  const [reciter, setReciter]             = useState(RECITERS[0].id);
  const [tafsirEdition, setTafsirEdition] = useState(TAFSIRS[0].id);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BASE}/surah`)
      .then((r) => r.json())
      .then((d) => { setSurahs(d.data ?? []); setSurahsLoading(false); })
      .catch(() => setSurahsLoading(false));
  }, []);

  const openSurah = useCallback((s: Surah) => {
    setSelectedSurah(s);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const goBack = useCallback(() => {
    setSelectedSurah(null);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const navigateSurah = useCallback((direction: 'prev' | 'next') => {
    if (!selectedSurah) return;
    const newNum = direction === 'prev' ? selectedSurah.number - 1 : selectedSurah.number + 1;
    if (newNum < 1 || newNum > 114) return;
    const newSurah = surahs.find((s) => s.number === newNum);
    if (newSurah) {
      setSelectedSurah(newSurah);
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [selectedSurah, surahs]);

  const filtered = useMemo(() =>
    surahs.filter((s) =>
      s.name.includes(search) ||
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      String(s.number).startsWith(search)
    ), [surahs, search]);

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8" dir="rtl">
        <div className="w-12 h-12 bg-shubuhat-green rounded-2xl flex items-center justify-center text-shubuhat-gold shrink-0">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-shubuhat-green">القرآن الكريم</h2>
          <p className="text-shubuhat-text-3 font-bold text-sm">
            {selectedSurah
              ? `سورة ${selectedSurah.name} · ${selectedSurah.numberOfAyahs} آية`
              : "١١٤ سورة · قراءة · استماع · تفسير · تلوين الكلمات"}
          </p>
        </div>
      </div>

      {/* Controls */}
      {!selectedSurah ? (
        <div className="relative mb-8" dir="rtl">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 end-4 text-shubuhat-text-3 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها..."
            className="w-full bg-white border border-shubuhat-border-lite rounded-2xl py-4 px-5 pe-12 font-bold text-sm focus:border-shubuhat-gold focus:outline-none transition-all placeholder:text-shubuhat-text-3"
            dir="rtl" />
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6 flex-wrap" dir="rtl">
          <Headphones size={16} className="text-shubuhat-gold" />
          <span className="text-xs font-black text-shubuhat-text-3 uppercase tracking-wider">القارئ</span>
          <Dropdown value={reciter} options={RECITERS} onChange={setReciter} />
          <FileText size={16} className="text-shubuhat-gold ms-2" />
          <span className="text-xs font-black text-shubuhat-text-3 uppercase tracking-wider">التفسير</span>
          <Dropdown value={tafsirEdition} options={TAFSIRS} onChange={setTafsirEdition} />
        </div>
      )}

      {/* ── Content ─────────────────────────────────────── */}
      {selectedSurah ? (
        <SurahViewer
          surah={selectedSurah}
          reciter={reciter}
          tafsirEdition={tafsirEdition}
          onBack={goBack}
          onNavigate={navigateSurah}
        />
      ) : surahsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bg-shubuhat-green-ghost rounded-[28px] h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" dir="rtl">
          <p className="text-2xl font-black text-shubuhat-green/30 mb-2">لا نتائج</p>
          <p className="text-shubuhat-text-3 font-bold">جرّب اسماً أو رقماً آخر</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((s) => <SurahCard key={s.number} surah={s} onClick={() => openSurah(s)} />)}
        </div>
      )}
    </div>
  );
}
