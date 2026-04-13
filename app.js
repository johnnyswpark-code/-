(function () {
  "use strict";

  const MAX_DIGITS = 12;
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.getElementById("keys");

  /** @type {number | null} */
  let stored = null;
  /** @type {string | null} */
  let pendingOp = null;
  let inputtingFresh = true;
  /** @type {string} */
  let displayRaw = "0";

  function formatForDisplay(num) {
    if (!Number.isFinite(num)) return "오류";
    const s = String(num);
    if (s.includes("e") || s.length > MAX_DIGITS + 2) {
      const exp = num.toExponential(6);
      return exp.length > MAX_DIGITS + 3 ? num.toExponential(4) : exp;
    }
    const rounded = Math.round(num * 1e10) / 1e10;
    let out = Object.is(rounded, -0) ? "0" : String(rounded);
    if (out.replace("-", "").replace(".", "").length > MAX_DIGITS) {
      return num.toExponential(4);
    }
    return out;
  }

  function updateDisplay() {
    if (displayRaw === "오류") {
      displayEl.textContent = "오류";
      expressionEl.textContent = "";
      keysEl.querySelectorAll(".key-op").forEach((btn) => btn.classList.remove("is-active"));
      return;
    }
    const n = parseFloat(displayRaw);
    displayEl.textContent = Number.isFinite(n) ? formatForDisplay(n) : displayRaw;
    if (stored !== null && pendingOp) {
      const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" }[pendingOp] || pendingOp;
      expressionEl.textContent = `${formatForDisplay(stored)} ${sym}`;
    } else {
      expressionEl.textContent = "";
    }
    keysEl.querySelectorAll(".key-op").forEach((btn) => {
      const op = btn.getAttribute("data-op");
      btn.classList.toggle("is-active", pendingOp === op && stored !== null);
    });
  }

  function applyPending() {
    const current = parseFloat(displayRaw);
    if (stored === null || !pendingOp) {
      stored = current;
      return;
    }
    let result = stored;
    switch (pendingOp) {
      case "+":
        result = stored + current;
        break;
      case "-":
        result = stored - current;
        break;
      case "*":
        result = stored * current;
        break;
      case "/":
        result = current === 0 ? NaN : stored / current;
        break;
      default:
        result = current;
    }
    stored = result;
    displayRaw = Number.isFinite(result) ? String(result) : "NaN";
  }

  function digit(d) {
    if (displayRaw === "NaN" || displayRaw === "오류") {
      displayRaw = "0";
      stored = null;
      pendingOp = null;
    }
    if (inputtingFresh) {
      displayRaw = d;
      inputtingFresh = false;
    } else {
      if (displayRaw === "0" && d !== "0") displayRaw = d;
      else if (displayRaw === "0" && d === "0") return;
      else if (displayRaw === "-0" && d !== "0") displayRaw = "-" + d;
      else if (displayRaw === "-0" && d === "0") return;
      else {
        const intPart = displayRaw.split(".")[0].replace("-", "");
        const decPart = displayRaw.includes(".") ? displayRaw.split(".")[1] : "";
        const digitCount = intPart.length + decPart.length + (displayRaw.startsWith("-") ? 1 : 0);
        if (digitCount >= MAX_DIGITS && !displayRaw.includes(".")) return;
        if (decPart.length >= 8 && displayRaw.includes(".")) return;
        displayRaw += d;
      }
    }
    updateDisplay();
  }

  function decimal() {
    if (displayRaw === "NaN" || displayRaw === "오류") {
      displayRaw = "0.";
      stored = null;
      pendingOp = null;
      inputtingFresh = false;
      updateDisplay();
      return;
    }
    if (inputtingFresh) {
      displayRaw = "0.";
      inputtingFresh = false;
    } else if (!displayRaw.includes(".")) {
      displayRaw += ".";
    }
    updateDisplay();
  }

  /** @param {string} op */
  function op(op) {
    if (displayRaw === "NaN" || displayRaw === "오류") {
      clearAll();
      return;
    }
    if (stored !== null && pendingOp && !inputtingFresh) {
      applyPending();
    } else if (stored === null) {
      stored = parseFloat(displayRaw);
    } else if (inputtingFresh) {
      stored = parseFloat(displayRaw);
    }
    pendingOp = op;
    inputtingFresh = true;
    if (Number.isFinite(stored)) displayRaw = String(stored);
    updateDisplay();
  }

  function equals() {
    if (displayRaw === "NaN" || displayRaw === "오류" || pendingOp === null) {
      updateDisplay();
      return;
    }
    applyPending();
    pendingOp = null;
    inputtingFresh = true;
    if (!Number.isFinite(stored)) {
      displayRaw = "오류";
      stored = null;
      pendingOp = null;
      inputtingFresh = true;
      updateDisplay();
      return;
    }
    displayRaw = String(stored);
    stored = null;
    updateDisplay();
  }

  function clearAll() {
    stored = null;
    pendingOp = null;
    inputtingFresh = true;
    displayRaw = "0";
    updateDisplay();
  }

  function toggleSign() {
    if (displayRaw === "NaN" || displayRaw === "오류") return;
    if (displayRaw === "0" || displayRaw === "0.") return;
    if (displayRaw.startsWith("-")) displayRaw = displayRaw.slice(1);
    else displayRaw = "-" + displayRaw;
    updateDisplay();
  }

  function percent() {
    if (displayRaw === "NaN") return;
    const n = parseFloat(displayRaw) / 100;
    displayRaw = String(n);
    inputtingFresh = true;
    updateDisplay();
  }

  keysEl.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest("button");
    if (!btn) return;

    const digitVal = btn.getAttribute("data-digit");
    if (digitVal !== null) {
      digit(digitVal);
      return;
    }
    const action = btn.getAttribute("data-action");
    if (action === "decimal") {
      decimal();
      return;
    }
    if (action === "clear") {
      clearAll();
      return;
    }
    if (action === "sign") {
      toggleSign();
      return;
    }
    if (action === "percent") {
      percent();
      return;
    }
    if (action === "op") {
      const o = btn.getAttribute("data-op");
      if (o) op(o);
      return;
    }
    if (action === "equals") {
      equals();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const k = e.key;
    if (k >= "0" && k <= "9") {
      e.preventDefault();
      digit(k);
      return;
    }
    if (k === "." || k === ",") {
      e.preventDefault();
      decimal();
      return;
    }
    if (k === "+" || k === "-" || k === "*" || k === "/") {
      e.preventDefault();
      op(k);
      return;
    }
    if (k === "Enter" || k === "=") {
      e.preventDefault();
      equals();
      return;
    }
    if (k === "Escape" || k === "c" || k === "C") {
      e.preventDefault();
      clearAll();
      return;
    }
    if (k === "Backspace") {
      e.preventDefault();
      if (displayRaw === "NaN" || displayRaw === "오류") {
        clearAll();
        return;
      }
      if (inputtingFresh) return;
      if (displayRaw.length <= 1 || (displayRaw.startsWith("-") && displayRaw.length === 2)) {
        displayRaw = "0";
        inputtingFresh = true;
      } else {
        displayRaw = displayRaw.slice(0, -1);
      }
      updateDisplay();
    }
  });

  updateDisplay();
})();
