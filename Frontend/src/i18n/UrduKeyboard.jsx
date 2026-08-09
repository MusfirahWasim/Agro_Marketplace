import { useState, useRef, useEffect } from "react";
import { X, Delete, CornerDownLeft, GripHorizontal } from "lucide-react";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  gold: "#f0b84c",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
};

// Standard Urdu alphabet, qaida order (ا through ے).
const LETTERS = [
  "ا", "آ", "ب", "پ", "ت", "ٹ", "ث", "ج",
  "چ", "ح", "خ", "د", "ڈ", "ذ", "ر", "ڑ",
  "ز", "ژ", "س", "ش", "ص", "ض", "ط", "ظ",
  "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م",
  "ن", "ں", "و", "ہ", "ھ", "ء", "ی", "ے",
];

const DIGITS = ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۰"];

const PUNCTUATION = ["،", "۔", "؟", "؛", "-", "٪"];

// Only act on plain text inputs / textareas — never on selects, checkboxes, etc.
function getActiveTextEl() {
  const el = document.activeElement;
  if (!el) return null;
  if (el.tagName === "TEXTAREA") return el;
  if (
    el.tagName === "INPUT" &&
    ["text", "search", "email", "tel", "url", ""].includes(el.type)
  ) {
    return el;
  }
  return null;
}

// React controlled inputs track value via the native setter — calling
// el.value = x directly is invisible to React, so we go through the
// prototype's setter and fire a real "input" event to trigger onChange.
function setNativeValue(el, value) {
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertAtCursor(char) {
  const el = getActiveTextEl();
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const newValue = el.value.slice(0, start) + char + el.value.slice(end);
  setNativeValue(el, newValue);
  const cursor = start + char.length;
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = cursor;
  });
}

function backspace() {
  const el = getActiveTextEl();
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  let newValue, cursor;
  if (start !== end) {
    newValue = el.value.slice(0, start) + el.value.slice(end);
    cursor = start;
  } else if (start > 0) {
    newValue = el.value.slice(0, start - 1) + el.value.slice(start);
    cursor = start - 1;
  } else {
    return;
  }
  setNativeValue(el, newValue);
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = cursor;
  });
}

function Key({ children, onPress, wide = false, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      // onMouseDown (not onClick) + preventDefault keeps focus on the
      // real text input instead of stealing it to this button — that's
      // what lets document.activeElement still be the input on press.
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`flex items-center justify-center rounded-lg text-base font-medium transition-colors ${
        wide ? "col-span-4" : ""
      }`}
      style={{
        height: 40,
        backgroundColor: COLORS.greige,
        color: COLORS.ink,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e2e6d9")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.greige)}
    >
      {children}
    </button>
  );
}

export default function UrduKeyboard({ onClose, initialPosition }) {
  const [position, setPosition] = useState(
    initialPosition || { x: 100, y: 100 }
  );
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    if (!dragging) return;

    function clamp(pos) {
      const margin = 8;
      const maxX = window.innerWidth - 360 - margin;
      const maxY = window.innerHeight - 40 - margin;
      return {
        x: Math.min(Math.max(pos.x, margin), Math.max(margin, maxX)),
        y: Math.min(Math.max(pos.y, margin), Math.max(margin, maxY)),
      };
    }

    function onMove(e) {
      const point = e.touches ? e.touches[0] : e;
      setPosition(
        clamp({
          x: point.clientX - dragOffset.current.x,
          y: point.clientY - dragOffset.current.y,
        })
      );
    }
    function onUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  function startDrag(e) {
    const point = e.touches ? e.touches[0] : e;
    dragOffset.current = {
      x: point.clientX - position.x,
      y: point.clientY - position.y,
    };
    setDragging(true);
  }

  return (
    <div
      dir="rtl"
      className="w-[360px] rounded-xl shadow-2xl border overflow-hidden fixed z-50"
      style={{
        backgroundColor: "white",
        borderColor: COLORS.greige,
        left: position.x,
        top: position.y,
        userSelect: dragging ? "none" : "auto",
      }}
    >
      <div
        dir="ltr"
        onMouseDown={startDrag}
        onTouchStart={(e) => {
          e.preventDefault();
          startDrag(e);
        }}
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: COLORS.forest, cursor: dragging ? "grabbing" : "grab" }}
      >
        <div className="flex items-center gap-2 select-none">
          <GripHorizontal size={14} color="#c9d9c2" />
          <span className="text-sm font-medium text-white">اردو کی بورڈ · Urdu keyboard</span>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          <X size={16} color="#c9d9c2" />
        </button>
      </div>

      <div className="p-3 grid grid-cols-8 gap-1.5">
        {DIGITS.map((d) => (
          <Key key={d} onPress={() => insertAtCursor(d)}>
            {d}
          </Key>
        ))}

        {LETTERS.map((letter) => (
          <Key key={letter} onPress={() => insertAtCursor(letter)}>
            {letter}
          </Key>
        ))}

        {PUNCTUATION.map((p) => (
          <Key key={p} onPress={() => insertAtCursor(p)}>
            {p}
          </Key>
        ))}
      </div>

      <div dir="ltr" className="px-3 pb-3 grid grid-cols-8 gap-1.5">
        <Key wide onPress={() => insertAtCursor(" ")} ariaLabel="Space">
          Space
        </Key>
        <div className="col-span-2">
          <Key onPress={backspace} ariaLabel="Backspace">
            <Delete size={16} />
          </Key>
        </div>
        <div className="col-span-2">
          <Key onPress={() => insertAtCursor("\n")} ariaLabel="Enter">
            <CornerDownLeft size={16} />
          </Key>
        </div>
      </div>

      <p
        dir="ltr"
        className="text-xs text-center pb-3 px-3"
        style={{ color: COLORS.sub }}
      >
        Click a field, then tap letters to type Urdu
      </p>
    </div>
  );
}