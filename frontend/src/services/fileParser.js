/**
 * fileParser.js
 * Client-side file text extraction (runs in the browser, not the server).
 * The backend also parses files — this is used to show a live preview
 * before the upload completes and to validate the file isn't empty.
 *
 * PDF   → PDF.js (lazy-loaded from CDN)
 * DOCX  → mammoth (npm)
 * TXT   → FileReader
 */

import * as mammoth from "mammoth";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];
const MAX_SIZE_MB = 10;

// ── Validation ────────────────────────────────────────────────────

export function validateFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `".${ext}" is not supported. Please upload PDF, DOCX, DOC, or TXT.`
    );
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds the ${MAX_SIZE_MB} MB limit.`);
  }
}

// ── Readers ───────────────────────────────────────────────────────

function toArrayBuffer(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = (e) => res(e.target.result);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src     = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload  = res;
    s.onerror = () => rej(new Error("Failed to load PDF.js from CDN."));
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function parsePdf(file) {
  await loadPdfJs();
  const ab  = await toArrayBuffer(file);
  const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
  let text  = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text.trim();
}

async function parseDocx(file) {
  const ab     = await toArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return result.value.trim();
}

function parseTxt(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = (e) => res(e.target.result.trim());
    r.onerror = rej;
    r.readAsText(file, "utf-8");
  });
}

// ── Main export ───────────────────────────────────────────────────

/**
 * Extract plain text from an uploaded file in the browser.
 * Throws on unsupported type or extraction failure.
 */
export async function extractText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf")               return parsePdf(file);
  if (ext === "docx" || ext === "doc") return parseDocx(file);
  if (ext === "txt")               return parseTxt(file);
  throw new Error(`Unsupported format: .${ext}`);
}
