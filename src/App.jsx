import React, { useState, useRef, useCallback } from "react";
import { ArrowDownUp, Volume2, Square, BookOpen, X, Copy, Check, Trash2 } from "lucide-react";

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.",
  "$": "...-..-", "@": ".--.-.",
};

const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

const CHEAT_GROUPS = [
  { label: "Letters", entries: Object.entries(MORSE).filter(([k]) => /[A-Z]/.test(k)) },
  { label: "Numbers", entries: Object.entries(MORSE).filter(([k]) => /[0-9]/.test(k)) },
  { label: "Punctuation", entries: Object.entries(MORSE).filter(([k]) => /[^A-Z0-9]/.test(k)) },
];

function encode(text) {
  return text
    .toUpperCase()
    .split(" ")
    .map((word) =>
      word
        .split("")
        .map((ch) => MORSE[ch])
        .filter(Boolean)
        .join(" ")
    )
    .join(" / ");
}

function decode(morse) {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => REVERSE[code] || "")
        .join("")
    )
    .join(" ")
    .trim();
}

const UNIT = 70; // ms, base morse timing unit

function buildSchedule(morse) {
  const events = [];
  let t = 120;
  for (const c of morse) {
    if (c === ".") {
      events.push({ start: t, dur: UNIT });
      t += UNIT + UNIT;
    } else if (c === "-") {
      events.push({ start: t, dur: UNIT * 3 });
      t += UNIT * 3 + UNIT;
    } else if (c === " ") {
      t += UNIT * 2;
    } else if (c === "/") {
      t += UNIT * 4;
    }
  }
  return { events, total: t };
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {}
  };
  return (
    <button className="iconbtn" onClick={onCopy} title={label} type="button">
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

export default function MorseStation() {
  const [text, setText] = useState("Signal received");
  const [morse, setMorse] = useState(encode("Signal received"));
  const [showSheet, setShowSheet] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const timeouts = useRef([]);
  const ctxRef = useRef(null);

  const onTextChange = (e) => {
    const v = e.target.value;
    setText(v);
    setMorse(encode(v));
  };

  const onMorseChange = (e) => {
    const v = e.target.value;
    setMorse(v);
    setText(decode(v));
  };

  const clearAll = () => {
    stopPlayback();
    setText("");
    setMorse("");
  };

  const stopPlayback = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch (e) {}
      ctxRef.current = null;
    }
    setIsPlaying(false);
    setLampOn(false);
  }, []);

  const play = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!morse.trim()) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const { events, total } = buildSchedule(morse);

    events.forEach(({ start, dur }) => {
      const startSec = ctx.currentTime + start / 1000;
      const durSec = dur / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 620;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, startSec);
      gain.gain.linearRampToValueAtTime(0.28, startSec + 0.006);
      gain.gain.setValueAtTime(0.28, startSec + durSec - 0.006);
      gain.gain.linearRampToValueAtTime(0, startSec + durSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startSec);
      osc.stop(startSec + durSec);

      timeouts.current.push(setTimeout(() => setLampOn(true), start));
      timeouts.current.push(setTimeout(() => setLampOn(false), start + dur));
    });

    setIsPlaying(true);
    timeouts.current.push(setTimeout(() => stopPlayback(), total + 150));
  };

  return (
    <div className="wrap">
      <style>{`
        .wrap {
          --bg: #14110e;
          --panel: #1c1712;
          --panel-hi: #241d16;
          --border: #362b1e;
          --amber: #c9973f;
          --amber-dim: #8a6a30;
          --signal: #6fa98a;
          --ink: #ece4d4;
          --ink-dim: #a89a80;
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          color: var(--ink);
          font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', serif;
          padding: 36px 20px 48px;
          box-sizing: border-box;
          position: relative;
        }
        .wrap * { box-sizing: border-box; }
        .mono {
          font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
        }
        .shell { max-width: 640px; margin: 0 auto; }
        .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .lamp {
          width: 14px; height: 14px; border-radius: 50%;
          background: ${lampOn ? "var(--signal)" : "#2a231a"};
          border: 1px solid var(--border);
          box-shadow: ${lampOn ? "0 0 10px 3px rgba(111,169,138,0.55)" : "none"};
          transition: background 40ms linear, box-shadow 40ms linear;
          flex: none;
        }
        h1 {
          font-size: 27px; margin: 0; font-weight: 600; letter-spacing: 0.2px;
          color: var(--ink);
        }
        .sub { color: var(--ink-dim); font-size: 14px; margin-top: 6px; line-height: 1.5; max-width: 46ch; }
        .sheetbtn {
          display: flex; align-items: center; gap: 7px;
          background: transparent; border: 1px solid var(--border);
          color: var(--amber); padding: 8px 13px; border-radius: 3px;
          font-size: 13px; cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .sheetbtn:hover { border-color: var(--amber-dim); background: var(--panel-hi); }

        .panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 16px 16px 12px;
          position: relative;
        }
        .panel + .panel { margin-top: 10px; }
        .panel label {
          display: block; font-size: 12px; color: var(--ink-dim);
          margin-bottom: 8px; letter-spacing: 0.3px;
        }
        textarea {
          width: 100%; resize: vertical; min-height: 84px;
          background: transparent; border: none; outline: none;
          color: var(--ink); font-size: 16px; line-height: 1.5;
          font-family: inherit;
        }
        .panel.morseInput textarea, .panel.morseInput .mono {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          letter-spacing: 1px;
        }
        textarea::placeholder { color: #5c5346; }

        .swaprow { display: flex; align-items: center; justify-content: center; margin: -4px 0; position: relative; z-index: 1; }
        .swap {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--panel-hi); border: 1px solid var(--border);
          color: var(--amber); display: flex; align-items: center; justify-content: center;
        }

        .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .iconbtn {
          display: flex; align-items: center; gap: 7px;
          background: var(--panel); border: 1px solid var(--border);
          color: var(--ink); padding: 8px 13px; border-radius: 3px;
          font-size: 13px; cursor: pointer; font-family: inherit;
        }
        .iconbtn:hover { border-color: var(--amber-dim); }
        .iconbtn.primary { color: var(--amber); border-color: var(--amber-dim); }
        .iconbtn.primary:hover { background: rgba(201,151,63,0.08); }

        .overlay {
          position: fixed; inset: 0; background: rgba(10,8,6,0.6);
          display: flex; justify-content: flex-end; z-index: 20;
        }
        .drawer {
          width: min(360px, 92vw); height: 100%;
          background: #181410; border-left: 1px solid var(--border);
          padding: 20px 18px 24px; overflow-y: auto;
        }
        .drawer h2 { font-size: 19px; margin: 0 0 4px; color: var(--ink); }
        .drawer .sub { margin-bottom: 18px; }
        .drawer-head { display: flex; justify-content: space-between; align-items: flex-start; }
        .closebtn { background: none; border: none; color: var(--ink-dim); cursor: pointer; padding: 4px; }
        .grouplabel {
          font-size: 12px; color: var(--amber); margin: 18px 0 8px;
          border-bottom: 1px solid var(--border); padding-bottom: 6px;
        }
        .grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 6px;
        }
        .cell {
          display: flex; flex-direction: column; gap: 3px;
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 3px; padding: 6px 4px; text-align: center;
        }
        .cell .ch { font-size: 13px; color: var(--ink); font-family: inherit; }
        .cell .code {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 12px; color: var(--amber); letter-spacing: 1px;
        }
        .hint { font-size: 12px; color: var(--ink-dim); margin-top: 22px; line-height: 1.6; }

        @media (max-width: 560px) {
          .wrap { padding: 24px 14px 36px; }
          .head { flex-wrap: wrap; }
          .sheetbtn { margin-left: 46px; }
          h1 { font-size: 22px; }
          .sub { font-size: 13px; max-width: none; }
          textarea { font-size: 15px; }
          .grid { grid-template-columns: repeat(3, 1fr); }
          .iconbtn span { display: inline; }
          .controls { gap: 6px; }
          .iconbtn { padding: 8px 10px; font-size: 12.5px; }
        }

        @media (max-width: 360px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="shell">
        <div className="head">
          <div className="brand">
            <span className="lamp" />
            <div>
              <h1>Morse Station</h1>
              <div className="sub">Type text or morse in either panel — the other updates as you go. Play the signal to hear it back.</div>
            </div>
          </div>
          <button className="sheetbtn" type="button" onClick={() => setShowSheet(true)}>
            <BookOpen size={15} />
            Cheat sheet
          </button>
        </div>

        <div className="panel">
          <label>Text</label>
          <textarea
            value={text}
            onChange={onTextChange}
            placeholder="Type a message…"
            spellCheck={false}
          />
        </div>

        <div className="swaprow">
          <div className="swap">
            <ArrowDownUp size={15} />
          </div>
        </div>

        <div className="panel morseInput">
          <label>Morse code</label>
          <textarea
            value={morse}
            onChange={onMorseChange}
            placeholder="Or type morse, e.g. ... --- ..."
            spellCheck={false}
          />
        </div>

        <div className="controls">
          <button className="iconbtn primary" type="button" onClick={play} disabled={!morse.trim()}>
            {isPlaying ? <Square size={15} /> : <Volume2 size={15} />}
            {isPlaying ? "Stop" : "Play signal"}
          </button>
          <CopyButton value={text} label="Copy text" />
          <CopyButton value={morse} label="Copy morse" />
          <button className="iconbtn" type="button" onClick={clearAll}>
            <Trash2 size={15} />
            Clear
          </button>
        </div>

        <div className="hint">
          Letters in a word are separated by a space in morse; words are separated by " / ". Unrecognized characters are skipped.
        </div>
      </div>

      {showSheet && (
        <div className="overlay" onClick={() => setShowSheet(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <h2>Cheat sheet</h2>
                <div className="sub">International Morse code reference.</div>
              </div>
              <button className="closebtn" type="button" onClick={() => setShowSheet(false)}>
                <X size={20} />
              </button>
            </div>
            {CHEAT_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="grouplabel">{group.label}</div>
                <div className="grid">
                  {group.entries.map(([ch, code]) => (
                    <div className="cell" key={ch}>
                      <span className="ch">{ch}</span>
                      <span className="code">{code}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
