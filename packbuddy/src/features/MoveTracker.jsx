
import React, { useState, useEffect, useMemo, useRef } from "react";
import "./MoveTracker.css";
/* =============================================================
   MoveBuddy – Move-in & move-out tracker for students
   React component.  Use it with:   import MoveTracker from "./MoveTracker";
                                    <MoveTracker />
   Styles are in MoveTracker.css (imported below).

   Everything the student types is saved in their own browser
   (localStorage), and photos are saved in the browser's photo
   storage (IndexedDB), so nothing is lost when they come back.
   ============================================================= */




/* =============================================================
   1. DATA – edit these lists to change the defaults
   ============================================================= */

// Move in – Part 1: furniture usually provided in UK student rooms
const DEFAULT_FURNITURE = [
  "Bed frame", "Mattress", "Desk", "Desk chair", "Wardrobe", "Chest of drawers",
  "Bedside table", "Bookshelf", "Desk lamp", "Mirror", "Curtains / blinds", "Noticeboard", "Bin"
];

const CONDITIONS = ["Not checked", "Good", "Minor wear", "Damaged", "Missing"];

// Move in – Part 2: areas of the room to photograph
const PHOTO_AREAS = [
  "Walls & ceiling", "Floor / carpet", "Bed & mattress", "Desk & chair", "Wardrobe & drawers",
  "Windows & curtains", "Door & lock", "Bathroom", "Kitchen", "Other"
];

// Move in – Part 3: things students often borrow from their accommodation
const BORROW_PRESETS = [
  "Iron", "Ironing board", "Vacuum cleaner", "Toilet cleaning kit", "Mop & bucket",
  "Heater", "Fan", "Extra chair", "Kettle", "Toolkit"
];
const BORROW_FROM = ["Reception / front desk", "Accommodation office", "Residence life team", "Flatmate", "Other"];

// Move out – Part 1: what to do with each item
const DECISIONS = [
  { id: "home",   label: "Take home",   icon: "🏠", cls: "home" },
  { id: "sell",   label: "Sell",        icon: "💷", cls: "sell" },
  { id: "donate", label: "Donate",      icon: "💝", cls: "donate" },
  { id: "store",  label: "Store",       icon: "📦", cls: "store" },
  { id: "bin",    label: "Recycle / bin", icon: "♻️", cls: "bin" }
];

// Types of item – used to build the packing plan
const ITEM_TYPES = [
  "Clothes", "Bedding & towels", "Books & stationery", "Kitchen items", "Electronics",
  "Toiletries", "Shoes", "Documents", "Fragile / decor", "Large item", "Other"
];

// Roughly how many standard storage boxes (51 × 41 × 31 cm) each type of item fills.
// Used to estimate storage costs in Move out Part 1.
const BOXES_PER_TYPE = {
  "Clothes": 1, "Bedding & towels": 1.5, "Books & stationery": 1, "Kitchen items": 1,
  "Electronics": 0.5, "Toiletries": 0.5, "Shoes": 1, "Documents": 0.25,
  "Fragile / decor": 1, "Large item": 3, "Other": 1
};

// Common student items – "Add common items" button in Move out Part 1
const COMMON_ITEMS = [
  ["Winter coats & jumpers", "Clothes"], ["Everyday clothes", "Clothes"],
  ["Duvet & pillows", "Bedding & towels"], ["Towels", "Bedding & towels"],
  ["Textbooks", "Books & stationery"], ["Pots, pans & plates", "Kitchen items"],
  ["Laptop & chargers", "Electronics"], ["Desk lamp", "Other"],
  ["Toiletries", "Toiletries"], ["Shoes & trainers", "Shoes"],
  ["Passport & documents", "Documents"], ["Mirror / photo frames", "Fragile / decor"],
  ["Mini fridge / bike", "Large item"]
];

/* Storage prices (rough, from 2026):
   - Student box storage with collection: from about £1.30 per box per week (Seven Seas Worldwide).
   - Self-storage unit: UK average about £27.40 per sq ft per year before VAT (SSA UK 2026 report). */
const STORAGE = {
  boxPerWeek: 1.30,
  unitPerSqFtYear: 27.40,
  vat: 1.2,
  sqFtPerBox: 1.5,       // stacked boxes need about 1.5 sq ft of floor each
  minUnitSqFt: 10        // smallest lockers are about 10 sq ft
};

// Move out – Part 2: where each type of item should go
const PACK_RULES = {
  "Clothes":            { home: "suitcase", store: "bag",  tip: "Roll clothes tightly, or use packing cubes" },
  "Bedding & towels":   { home: "bag",      store: "bag",  tip: "Vacuum bags shrink duvets to a third of the size" },
  "Books & stationery": { home: "box-s",    store: "box-s", tip: "Books are heavy – use small boxes (under 15 kg)" },
  "Kitchen items":      { home: "box",      store: "box",  tip: "Wrap plates and glasses in tea towels" },
  "Electronics":        { home: "hand",     store: "box",  tip: "Laptops and power banks must go in hand luggage when flying" },
  "Toiletries":         { home: "suitcase", store: "box",  tip: "Seal liquids in zip-lock bags; under 100 ml for hand luggage" },
  "Shoes":              { home: "suitcase", store: "bag",  tip: "Put shoes in bags at the bottom of the suitcase" },
  "Documents":          { home: "hand",     store: "hand", tip: "Never pack your passport or visa documents in checked bags" },
  "Fragile / decor":    { home: "box",      store: "box",  tip: "Pad with clothes or towels and write FRAGILE on the box" },
  "Large item":         { home: "large",    store: "large", tip: "Too big to pack – store it whole, sell it or donate it" },
  "Other":              { home: "box",      store: "box",  tip: "" }
};

// Containers students can add in Move out Part 2.
// capacity = roughly how many standard boxes' worth of stuff fits (used for the "how full" bar)
const CONTAINER_KINDS = {
  suitcase: { icon: "🧳", label: "Suitcase",     capacity: 2.5, note: "Heavy things at the wheel end. Check your airline's weight limit (often 23 kg)." },
  box:      { icon: "📦", label: "Box",          capacity: 1.5, note: "Pad with soft items. Keep heavy boxes small so they can still be lifted." },
  bag:      { icon: "🛍️", label: "Bag",          capacity: 2,   note: "Soft or vacuum bags for clothes, bedding and towels." },
  hand:     { icon: "🎒", label: "Hand luggage", capacity: 1,   note: "Stays with you: passport, documents, laptop, valuables." },
  large:    { icon: "🛋️", label: "Large item",   capacity: 99,  note: "Too big for a box – store or carry it as it is." }
};
// The packing suggestions above use "box-s" (small box for heavy books) – it becomes a Box with less room
const SUGGESTED_KIND = { "box-s": "box" };
const SUGGESTED_CAPACITY = { "box-s": 1 };

// Move out – Part 2: packing timeline
const TIMELINE = [
  ["3 weeks before", "List everything in Move out Part 1 and decide: home, sell, donate, store or bin"],
  ["3 weeks before", "Post items to sell (Facebook Marketplace, Vinted, Gumtree or your uni's buy/sell group)"],
  ["2 weeks before", "Book storage or a shipping/luggage service if you need one"],
  ["2 weeks before", "Get boxes, vacuum bags, tape and marker pens"],
  ["1 week before", "Pack things you won't need (books, winter clothes, decorations)"],
  ["1 week before", "Book a charity collection or drop off donations"],
  ["3 days before", "Return everything you borrowed from the accommodation"],
  ["2 days before", "Clean the room, defrost the fridge and empty the bins"],
  ["Moving day", "Take move-out photos from the same angles as your move-in photos"],
  ["Moving day", "Hand back keys, get a receipt and send your forwarding address"]
];


/* =============================================================
   2. HELPERS
   ============================================================= */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = n => "~£" + (n < 20 && Math.abs(n - Math.round(n)) > 0.004 ? n.toFixed(2) : Math.round(n));

function formatDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso) {
  if (!iso) return null;
  const a = new Date(todayISO() + "T00:00:00"), b = new Date(iso + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// Save a piece of state in the browser so it's still there next time
function useSaved(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (err) { /* fall through to the starting value */ }
    return typeof initial === "function" ? initial() : initial;
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* storage full or blocked */ }
  }, [key, value]);
  return [value, setValue];
}

/* ---------- Photo storage ----------
   Each photo is kept as a small, self-contained JPEG image ("data URL"),
   so it can be shown anywhere. We try 3 places to save it, best first:
     1. IndexedDB     – the browser's big storage area (holds lots of photos)
     2. localStorage  – smaller backup (about 15–25 photos)
     3. memory        – only until the page is closed (last resort, we warn the student)
   ------------------------------------ */
const memoryPhotos = new Map();
const PHOTO_KEY = id => "movebuddy-photo-" + id;

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) { reject(new Error("no indexedDB")); return; }
      const req = window.indexedDB.open("movebuddy-photos", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("photos");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("blocked"));
    } catch (err) { reject(err); }   // some pages aren't allowed to use IndexedDB at all
  });
}

// Run one IndexedDB action. Returns { ok: true, value } or { ok: false }
async function photoDb(mode, fn) {
  try {
    const db = await openPhotoDb();
    return await new Promise(resolve => {
      const tx = db.transaction("photos", mode);
      const req = fn(tx.objectStore("photos"));
      tx.oncomplete = () => resolve({ ok: true, value: req && req.result });
      tx.onerror = () => resolve({ ok: false });
      tx.onabort = () => resolve({ ok: false });
    });
  } catch (err) { return { ok: false }; }
}

// Save a photo. Returns where it was saved: "device", "browser" or "session"
async function savePhoto(id, dataUrl) {
  memoryPhotos.set(id, dataUrl);
  const db = await photoDb("readwrite", store => store.put(dataUrl, id));
  if (db.ok) return "device";
  try { window.localStorage.setItem(PHOTO_KEY(id), dataUrl); return "browser"; }
  catch (err) { return "session"; }   // storage blocked or full
}

async function loadPhoto(id) {
  if (memoryPhotos.has(id)) return memoryPhotos.get(id);
  const db = await photoDb("readonly", store => store.get(id));
  let data = db.ok ? db.value : null;
  if (data && typeof data !== "string") data = await blobToDataUrl(data);   // photos saved by the older version
  if (!data) { try { data = window.localStorage.getItem(PHOTO_KEY(id)); } catch (err) { data = null; } }
  if (data) memoryPhotos.set(id, data);
  return data || null;
}

async function deletePhoto(id) {
  memoryPhotos.delete(id);
  await photoDb("readwrite", store => store.delete(id));
  try { window.localStorage.removeItem(PHOTO_KEY(id)); } catch (err) { /* ignore */ }
}

function blobToDataUrl(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

// Shrink a photo to max 1400 px (about 150–300 KB) so it saves quickly
// but is still clear enough to use as evidence. Returns a data URL.
function shrinkImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const original = reader.result;
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (err) { resolve(original); }
      };
      img.onerror = () => resolve(original);   // e.g. HEIC photos some browsers can't shrink
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}


/* =============================================================
   3. SMALL SHARED PIECES
   ============================================================= */

function PartHeader({ part, title, intro, children }) {
  return (
    <div className="mb-part-head">
      <div>
        <span className="mb-part-label">{part}</span>
        <h3>{title}</h3>
        <p className="mb-intro">{intro}</p>
      </div>
      {children && <div className="mb-part-tools">{children}</div>}
    </div>
  );
}

function Progress({ done, total, label }) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return (
    <div className="mb-progress">
      <div className="mb-progress-label"><span>{label}</span><strong>{done} / {total}</strong></div>
      <div className="mb-bar"><div className="mb-bar-fill" style={{ width: pct + "%" }} /></div>
    </div>
  );
}


/* =============================================================
   4. MOVE IN – PART 1: FURNITURE CHECKLIST
   ============================================================= */
function FurnitureChecklist({ items, setItems }) {
  const blank = { name: "", qty: 1, condition: "Good", note: "" };
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [justAdded, setJustAdded] = useState(null);   // highlights the new row for a moment
  const nameInput = useRef(null);
  const update = (id, change) => setItems(list => list.map(i => i.id === id ? { ...i, ...change } : i));
  const remove = id => setItems(list => list.filter(i => i.id !== id));

  // Add an item that isn't on the list as a new row in the table
  function add() {
    const name = form.name.trim();
    if (!name) {
      setMessage("Type the name of the item first, e.g. Mini fridge.");
      nameInput.current && nameInput.current.focus();
      return;
    }
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      setMessage(`"${name}" is already in the table. Change its number or condition there instead.`);
      return;
    }
    const id = uid();
    setItems(list => [...list, {
      id, name, provided: true,                       // you're adding it because it's in the room
      qty: Math.max(1, Number(form.qty) || 1), condition: form.condition, note: form.note.trim()
    }]);
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 2500);
    setMessage(`✓ Added "${name}" to the table.`);
    setForm(blank);
    nameInput.current && nameInput.current.focus();
  }
  const onEnter = e => { if (e.key === "Enter") { e.preventDefault(); add(); } };
  const provided = items.filter(i => i.provided).length;
  const problems = items.filter(i => i.condition === "Damaged" || i.condition === "Missing");

  return (
    <section className="mb-card" id="move-in-1">
      <PartHeader part="MOVE IN · PART 1" title="🛏️ What furniture was provided?"
        intro="Tick each item that's in your room on the first day, and note its condition. Anything damaged or missing? Report it to the accommodation straight away." />

      <Progress done={provided} total={items.length} label="Items provided" />
      {problems.length > 0 && (
        <div className="mb-alert bad">⚠️ {problems.length} item{problems.length === 1 ? " is" : "s are"} damaged or missing: <strong>{problems.map(p => p.name).join(", ")}</strong>. Take photos in Part 2 and report {problems.length === 1 ? "it" : "them"} to your accommodation in writing (email is best).</div>
      )}

      <div className="mb-table-wrap">
        <table className="mb-table">
          <thead><tr><th style={{ width: 70 }}>Provided</th><th>Item</th><th style={{ width: 80 }}>How many</th><th style={{ width: 150 }}>Condition</th><th>Notes</th><th className="mb-noprint" style={{ width: 40 }}></th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className={`${i.provided ? "is-done" : ""} ${i.id === justAdded ? "is-new" : ""}`}>
                <td><input type="checkbox" className="mb-check" checked={i.provided} onChange={e => update(i.id, { provided: e.target.checked, condition: e.target.checked && i.condition === "Not checked" ? "Good" : i.condition })} aria-label={`${i.name} provided`} /></td>
                <td className="mb-item-name">{i.name}</td>
                <td><input type="number" min="0" value={i.qty} onChange={e => update(i.id, { qty: e.target.value })} aria-label={`${i.name} quantity`} /></td>
                <td>
                  <select value={i.condition} onChange={e => update(i.id, { condition: e.target.value })} className={`mb-cond mb-cond-${i.condition.replace(/\s+/g, "-").toLowerCase()}`} aria-label={`${i.name} condition`}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td><input type="text" placeholder="e.g. stain on left side" value={i.note} onChange={e => update(i.id, { note: e.target.value })} aria-label={`${i.name} notes`} /></td>
                <td className="mb-noprint"><button type="button" className="mb-icon-btn" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-add-item mb-noprint">
        <h4>➕ Add an item that's not on the list</h4>
        <div className="mb-add-fields">
          <div className="mb-field mb-grow">
            <label htmlFor="mb-f-name">Item</label>
            <input id="mb-f-name" ref={nameInput} type="text" placeholder="e.g. Mini fridge, shoe rack, extra pillow"
              value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setMessage(""); }} onKeyDown={onEnter} />
          </div>
          <div className="mb-field mb-narrow">
            <label htmlFor="mb-f-qty">How many</label>
            <input id="mb-f-qty" type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} onKeyDown={onEnter} />
          </div>
          <div className="mb-field mb-cond-field">
            <label htmlFor="mb-f-cond">Condition</label>
            <select id="mb-f-cond" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
              {CONDITIONS.filter(c => c !== "Not checked").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="mb-field mb-grow">
            <label htmlFor="mb-f-note">Notes (optional)</label>
            <input id="mb-f-note" type="text" placeholder="e.g. door handle loose" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} onKeyDown={onEnter} />
          </div>
          <button type="button" className="mb-btn mb-btn-red mb-add-btn" onClick={add}>+ Add to table</button>
        </div>
        {message && <p className={`mb-add-msg ${message.startsWith("✓") ? "ok" : "err"}`} role="status">{message}</p>}
      </div>
    </section>
  );
}


/* =============================================================
   5. MOVE IN – PART 2: ROOM CONDITION PHOTOS
   ============================================================= */
function PhotoLog({ photos, setPhotos }) {
  const [area, setArea] = useState(PHOTO_AREAS[0]);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("All");
  const [images, setImages] = useState({});      // photo id → picture (data URL)
  const [missing, setMissing] = useState({});    // photo id → true if it couldn't be found on this device
  const [busy, setBusy] = useState("");
  const [viewIndex, setViewIndex] = useState(null);   // which photo is open in the viewer
  const [sessionOnly, setSessionOnly] = useState(false);
  const fileInput = useRef(null);

  const shown = filter === "All" ? photos : photos.filter(p => p.area === filter);
  const viewing = viewIndex !== null ? shown[viewIndex] : null;

  // Load saved photos whenever the list changes (e.g. when the page is opened again)
  useEffect(() => {
    let alive = true;
    (async () => {
      const found = {}, lost = {};
      for (const p of photos) {
        if (images[p.id]) continue;
        const data = await loadPhoto(p.id);
        if (data) found[p.id] = data; else lost[p.id] = true;
      }
      if (!alive) return;
      if (Object.keys(found).length) setImages(prev => ({ ...prev, ...found }));
      setMissing(lost);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Keyboard: ← → to move between photos, Esc to close
  useEffect(() => {
    if (viewIndex === null) return;
    const onKey = e => {
      if (e.key === "Escape") setViewIndex(null);
      if (e.key === "ArrowRight") setViewIndex(i => (i + 1) % shown.length);
      if (e.key === "ArrowLeft") setViewIndex(i => (i - 1 + shown.length) % shown.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewIndex, shown.length]);

  // If the open photo gets deleted or filtered away, keep the viewer valid
  useEffect(() => {
    if (viewIndex !== null && viewIndex >= shown.length) setViewIndex(shown.length ? shown.length - 1 : null);
  }, [shown.length, viewIndex]);

  async function addFiles(fileList) {
    const files = [...fileList].filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|heic|webp|gif)$/i.test(f.name));
    if (!files.length) return;
    const added = [];
    for (let n = 0; n < files.length; n++) {
      const file = files[n];
      setBusy(`⏳ Saving photo ${n + 1} of ${files.length}…`);
      const data = await shrinkImage(file);
      if (!data) continue;
      const id = uid();
      const savedIn = await savePhoto(id, data);
      if (savedIn === "session") setSessionOnly(true);
      setImages(prev => ({ ...prev, [id]: data }));        // show it straight away
      added.push({
        id, area, note: note.trim(), savedIn,
        takenAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
        addedAt: new Date().toISOString()
      });
    }
    setPhotos(list => [...list, ...added]);
    setNote("");
    setBusy(added.length ? `✓ added.lengthphoto{added.length === 1 ? "" : "s"} added – tap any photo to view it.` : "");
    setTimeout(() => setBusy(""), 4000);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function removePhoto(id) {
    if (!window.confirm("Delete this photo?")) return;
    await deletePhoto(id);
    setPhotos(list => list.filter(p => p.id !== id));
    setImages(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
  }

  const updatePhoto = (id, change) => setPhotos(list => list.map(p => p.id === id ? { ...p, ...change } : p));
  const covered = new Set(photos.map(p => p.area));
  const fmt = iso => iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "unknown";
  const missingCount = photos.filter(p => missing[p.id]).length;

  return (
    <section className="mb-card" id="move-in-2">
      <PartHeader part="MOVE IN · PART 2" title="📸 Record your room's condition"
        intro="Photograph every part of the room on move-in day, especially any existing damage. Each photo keeps the date it was taken, so you have proof the damage was already there.">
        {photos.length > 0 && <button type="button" className="mb-btn mb-btn-small mb-btn-red mb-noprint" onClick={() => { setFilter("All"); setViewIndex(0); }}>🖼️ View all {photos.length} photo{photos.length === 1 ? "" : "s"}</button>}
      </PartHeader>

      {sessionOnly && (
        <div className="mb-alert warn">⚠️ This page isn't allowed to save photos on your device (this happens in preview windows and some private-browsing modes). You can view them now, but they'll disappear when you close the page. Open the website normally in Chrome, Safari or Edge to keep them.</div>
      )}
      {missingCount > 0 && (
        <div className="mb-alert bad">⚠️ {missingCount} photo{missingCount === 1 ? " wasn't" : "s weren't"} found on this device. Photos are only saved on the phone or computer you took them on. If you cleared your browser data, please upload {missingCount === 1 ? "it" : "them"} again.</div>
      )}

      <div className="mb-upload mb-noprint"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
        <div className="mb-upload-fields">
          <div className="mb-field">
            <label htmlFor="mb-area">Part of the room</label>
            <select id="mb-area" value={area} onChange={e => setArea(e.target.value)}>
              {PHOTO_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="mb-field mb-grow">
            <label htmlFor="mb-note">Describe any damage (optional)</label>
            <input id="mb-note" type="text" placeholder="e.g. 5 cm scratch on desk, chip in wardrobe door" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="mb-upload-actions">
          <label className="mb-btn mb-btn-red mb-upload-btn">
            📷 Add photos
            <input ref={fileInput} type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files)} className="mb-hidden-input" />
          </label>
          {busy && <span className={`mb-upload-status ${busy.startsWith("✓") ? "ok" : ""}`} role="status">{busy}</span>}
        </div>
        <span className="mb-hint">On a phone this opens your camera or gallery. On a computer you can also drag photos here.</span>
      </div>

      <div className="mb-area-chips">
        {["All", ...PHOTO_AREAS].map(a => {
          const count = a === "All" ? photos.length : photos.filter(p => p.area === a).length;
          return (
            <button type="button" key={a} className={`mb-chip ${filter === a ? "active" : ""} ${a !== "All" && covered.has(a) ? "covered" : ""}`} onClick={() => setFilter(a)}>
              {a !== "All" && covered.has(a) ? "✓ " : ""}{a}{count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>
      <p className="mb-hint" style={{ marginBottom: 12 }}>✓ = you've photographed this part of the room. Tap any photo to view it full size.</p>

      {shown.length === 0 ? (
        <div className="mb-empty">No photos yet{filter !== "All" ? ` for ${filter}` : ""}. Take wide photos of each wall first, then close-ups of any marks, stains or broken parts.</div>
      ) : (
        <div className="mb-photo-grid">
          {shown.map((p, index) => (
            <figure key={p.id} className="mb-photo">
              <button type="button" className="mb-photo-img" onClick={() => setViewIndex(index)} aria-label={`View photo: ${p.area}`}>
                {images[p.id] ? <img src={images[p.id]} alt={`p.area{p.note ? ": " + p.note : ""}`} />
                  : missing[p.id] ? <span className="mb-photo-missing">⚠️ Photo not found on this device</span>
                  : <span>Loading…</span>}
                {images[p.id] && <span className="mb-photo-zoom">🔍 View</span>}
              </button>
              <figcaption>
                <strong>{p.area}</strong>
                <input type="text" value={p.note} placeholder="Add a description" onChange={e => updatePhoto(p.id, { note: e.target.value })} aria-label="Photo description" />
                <span className="mb-hint">📅 Taken {fmt(p.takenAt)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mb-tips">
        <strong>Tips for photos that count as evidence</strong>
        <ul>
          <li>Email the photos to your accommodation on move-in day, so there's a dated record on their side too.</li>
          <li>Put something in the close-up shots for scale, like a pen or coin.</li>
          <li>Photograph the inside of the wardrobe, drawers, fridge and under the mattress.</li>
          <li>Keep the original photos on your phone as well, because they hold the exact time they were taken.</li>
        </ul>
      </div>

      {/* ---------- Full-size photo viewer ---------- */}
      {viewing && (
        <div className="mb-lightbox" onClick={() => setViewIndex(null)} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="mb-lightbox-inner" onClick={e => e.stopPropagation()}>
            <div className="mb-lightbox-top">
              <span><strong>{viewIndex + 1}</strong> of {shown.length}{filter !== "All" ? ` · ${filter}` : ""}</span>
              <button type="button" className="mb-lightbox-close" onClick={() => setViewIndex(null)} aria-label="Close viewer">✕</button>
            </div>
            <div className="mb-lightbox-stage">
              {shown.length > 1 && <button type="button" className="mb-nav prev" onClick={() => setViewIndex(i => (i - 1 + shown.length) % shown.length)} aria-label="Previous photo">‹</button>}
              {images[viewing.id] ? <img src={images[viewing.id]} alt={viewing.area} />
                : <div className="mb-photo-missing big">⚠️ This photo isn't saved on this device. Please upload it again.</div>}
              {shown.length > 1 && <button type="button" className="mb-nav next" onClick={() => setViewIndex(i => (i + 1) % shown.length)} aria-label="Next photo">›</button>}
            </div>
            <div className="mb-lightbox-bar">
              <div className="mb-lightbox-fields">
                <div className="mb-field">
                  <label htmlFor="mb-v-area">Part of the room</label>
                  <select id="mb-v-area" value={viewing.area} onChange={e => updatePhoto(viewing.id, { area: e.target.value })}>
                    {PHOTO_AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="mb-field mb-grow">
                  <label htmlFor="mb-v-note">Description</label>
                  <input id="mb-v-note" type="text" placeholder="Describe the damage" value={viewing.note} onChange={e => updatePhoto(viewing.id, { note: e.target.value })} />
                </div>
              </div>
              <div className="mb-lightbox-meta">
                <span className="mb-hint">📅 Taken {fmt(viewing.takenAt)} · ⬆️ Uploaded {fmt(viewing.addedAt)}</span>
                <span>
                  {images[viewing.id] && <a className="mb-btn mb-btn-small mb-btn-outline" href={images[viewing.id]} download={`viewing.area.replace(/[a-z0-9]+/gi,"-")-{(viewing.takenAt || viewing.addedAt).slice(0, 10)}.jpg`}>⬇️ Download</a>}{" "}
                  <button type="button" className="mb-btn mb-btn-small mb-btn-ghost" onClick={() => removePhoto(viewing.id)}>🗑 Delete</button>
                </span>
              </div>
            </div>
          </div>
          {shown.length > 1 && (
            <div className="mb-thumbs" onClick={e => e.stopPropagation()}>
              {shown.map((p, i) => (
                <button type="button" key={p.id} className={`mb-thumb ${i === viewIndex ? "active" : ""}`} onClick={() => setViewIndex(i)} aria-label={`Photo ${i + 1}: ${p.area}`}>
                  {images[p.id] ? <img src={images[p.id]} alt="" /> : <span>?</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}


/* =============================================================
   6. MOVE IN – PART 3: BORROWED ITEMS
   ============================================================= */
function BorrowedItems({ items, setItems }) {
  const blank = { item: "", from: BORROW_FROM[0], borrowedOn: todayISO(), returnBy: "", note: "" };
  const [form, setForm] = useState(blank);
  const update = (id, change) => setItems(list => list.map(i => i.id === id ? { ...i, ...change } : i));
  const remove = id => setItems(list => list.filter(i => i.id !== id));
  const add = e => {
    if (e) e.preventDefault();
    if (!form.item.trim()) return;
    setItems(list => [...list, { ...form, item: form.item.trim(), id: uid(), returned: false }]);
    setForm({ ...blank, from: form.from });
  };

  const status = i => {
    if (i.returned) return { label: "Returned", cls: "good" };
    const d = daysUntil(i.returnBy);
    if (d === null) return { label: "No return date", cls: "grey" };
    if (d < 0) return { label: `Overdue by -dday{d === -1 ? "" : "s"}`, cls: "bad" };
    if (d === 0) return { label: "Return today", cls: "bad" };
    if (d <= 3) return { label: `Return in dday{d === 1 ? "" : "s"}`, cls: "warn" };
    return { label: `Return in ${d} days`, cls: "good-soft" };
  };

  // Not returned first, soonest return date first
  const sorted = [...items].sort((a, b) => (a.returned - b.returned) || ((a.returnBy || "9999") < (b.returnBy || "9999") ? -1 : 1));
  const out = items.filter(i => !i.returned);
  const urgent = out.filter(i => { const d = daysUntil(i.returnBy); return d !== null && d <= 3; });

  return (
    <section className="mb-card" id="move-in-3">
      <PartHeader part="MOVE IN · PART 3" title="🧹 Items you've borrowed"
        intro="Keep track of anything you borrow from the accommodation, who gave it to you and when it has to go back, so you don't get charged for it." />

      <div className="mb-stats">
        <div className="mb-stat"><strong>{out.length}</strong><span>still borrowed</span></div>
        <div className={`mb-stat ${urgent.length ? "bad" : ""}`}><strong>{urgent.length}</strong><span>due within 3 days</span></div>
        <div className="mb-stat"><strong>{items.length - out.length}</strong><span>returned</span></div>
      </div>

      <div className="mb-borrow-form mb-noprint" onKeyDown={e => { if (e.key === "Enter" && e.target.tagName === "INPUT") add(e); }}>
        <div className="mb-presets">
          {BORROW_PRESETS.map(p => (
            <button type="button" key={p} className={`mb-chip ${form.item === p ? "active" : ""}`} onClick={() => setForm(f => ({ ...f, item: p }))}>{p}</button>
          ))}
        </div>
        <div className="mb-borrow-fields">
          <div className="mb-field"><label htmlFor="mb-b-item">Item</label><input id="mb-b-item" type="text" placeholder="Pick above or type, e.g. Iron" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} /></div>
          <div className="mb-field"><label htmlFor="mb-b-from">Borrowed from</label>
            <select id="mb-b-from" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))}>{BORROW_FROM.map(b => <option key={b}>{b}</option>)}</select>
          </div>
          <div className="mb-field"><label htmlFor="mb-b-on">Borrowed on</label><input id="mb-b-on" type="date" value={form.borrowedOn} onChange={e => setForm(f => ({ ...f, borrowedOn: e.target.value }))} /></div>
          <div className="mb-field"><label htmlFor="mb-b-by">Return by</label><input id="mb-b-by" type="date" value={form.returnBy} onChange={e => setForm(f => ({ ...f, returnBy: e.target.value }))} /></div>
          <div className="mb-field mb-grow"><label htmlFor="mb-b-note">Notes (optional)</label><input id="mb-b-note" type="text" placeholder="e.g. signed for it, £10 deposit, name of staff member" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
        </div>
        <button type="button" className="mb-btn mb-btn-red" onClick={add}>+ Add borrowed item</button>
      </div>

      {items.length === 0 ? <div className="mb-empty">Nothing borrowed yet. When you borrow something, add it here straight away.</div> : (
        <div className="mb-table-wrap">
          <table className="mb-table">
            <thead><tr><th style={{ width: 80 }}>Returned</th><th>Item</th><th>Borrowed from</th><th>Borrowed on</th><th>Return by</th><th>Status</th><th>Notes</th><th className="mb-noprint" style={{ width: 40 }}></th></tr></thead>
            <tbody>
              {sorted.map(i => { const s = status(i); return (
                <tr key={i.id} className={i.returned ? "is-done" : ""}>
                  <td><input type="checkbox" className="mb-check" checked={i.returned} onChange={e => update(i.id, { returned: e.target.checked })} aria-label={`${i.item} returned`} /></td>
                  <td className="mb-item-name">{i.item}</td>
                  <td>{i.from}</td>
                  <td>{formatDate(i.borrowedOn)}</td>
                  <td><input type="date" value={i.returnBy} onChange={e => update(i.id, { returnBy: e.target.value })} aria-label={`${i.item} return date`} /></td>
                  <td><span className={`mb-tag ${s.cls}`}>{s.label}</span></td>
                  <td>{i.note || "–"}</td>
                  <td className="mb-noprint"><button type="button" className="mb-icon-btn" onClick={() => remove(i.id)} aria-label={`Remove ${i.item}`}>✕</button></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


/* =============================================================
   7. MOVE OUT – PART 1: TAKE HOME / SELL / DONATE / STORE
   ============================================================= */
function MoveOutPlan({ items, setItems, borrowed, weeks, setWeeks }) {
  const blank = { item: "", decision: "home", type: "Clothes", value: "", note: "" };
  const [form, setForm] = useState(blank);
  const update = (id, change) => setItems(list => list.map(i => i.id === id ? { ...i, ...change } : i));
  const remove = id => setItems(list => list.filter(i => i.id !== id));
  const add = e => {
    if (e) e.preventDefault();
    if (!form.item.trim()) return;
    setItems(list => [...list, { ...form, item: form.item.trim(), id: uid() }]);
    setForm({ ...blank, decision: form.decision, type: form.type });
  };
  const addCommon = () => setItems(list => [
    ...list,
    ...COMMON_ITEMS.filter(([name]) => !list.some(i => i.item === name))
      .map(([item, type]) => ({ id: uid(), item, type, decision: type === "Large item" ? "sell" : "home", value: "", note: "" }))
  ]);

  const counts = Object.fromEntries(DECISIONS.map(d => [d.id, items.filter(i => i.decision === d.id).length]));
  const sellTotal = items.filter(i => i.decision === "sell").reduce((s, i) => s + (Number(i.value) || 0), 0);
  const storeBoxes = Math.ceil(items.filter(i => i.decision === "store").reduce((s, i) => s + (BOXES_PER_TYPE[i.type] || 1), 0));
  const unitSqFt = Math.max(STORAGE.minUnitSqFt, Math.ceil(storeBoxes * STORAGE.sqFtPerBox / 5) * 5);
  const boxCost = storeBoxes * STORAGE.boxPerWeek * weeks;
  const unitCost = unitSqFt * STORAGE.unitPerSqFtYear * STORAGE.vat / 52 * weeks;
  const notReturned = borrowed.filter(b => !b.returned);

  return (
    <section className="mb-card" id="move-out-1">
      <PartHeader part="MOVE OUT · PART 1" title="🗂️ Plan what happens to your things"
        intro="For the long holiday or the end of your tenancy, decide what to take home, sell, donate or put in storage.">
        <button type="button" className="mb-btn mb-btn-small mb-btn-outline mb-noprint" onClick={addCommon}>+ Add common student items</button>
      </PartHeader>

      {notReturned.length > 0 && (
        <div className="mb-alert warn">🧹 Don't forget: you still have <strong>{notReturned.length}</strong> borrowed item{notReturned.length === 1 ? "" : "s"} to return before you leave: {notReturned.map(b => b.item).join(", ")}.</div>
      )}

      <div className="mb-decision-summary">
        {DECISIONS.map(d => (
          <div key={d.id} className={`mb-decision-box ${d.cls}`}>
            <span className="mb-decision-icon">{d.icon}</span>
            <strong>{counts[d.id]}</strong>
            <span>{d.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-plan-form mb-noprint" onKeyDown={e => { if (e.key === "Enter" && e.target.tagName === "INPUT") add(e); }}>
        <div className="mb-field mb-grow"><label htmlFor="mb-p-item">Item</label><input id="mb-p-item" type="text" placeholder="e.g. Rice cooker" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} /></div>
        <div className="mb-field"><label htmlFor="mb-p-dec">What to do</label>
          <select id="mb-p-dec" value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}>{DECISIONS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}</select></div>
        <div className="mb-field"><label htmlFor="mb-p-type">Type</label>
          <select id="mb-p-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        {form.decision === "sell" && <div className="mb-field mb-narrow"><label htmlFor="mb-p-val">Price (£)</label><input id="mb-p-val" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>}
        <button type="button" className="mb-btn mb-btn-red" onClick={add}>+ Add</button>
      </div>

      {items.length === 0 ? <div className="mb-empty">Nothing on your list yet. Add items one by one, or press <strong>Add common student items</strong> to start with a ready-made list.</div> : (
        <div className="mb-table-wrap">
          <table className="mb-table">
            <thead><tr><th>Item</th><th style={{ width: 160 }}>What to do</th><th style={{ width: 180 }}>Type</th><th style={{ width: 100 }}>Sell price</th><th>Notes</th><th className="mb-noprint" style={{ width: 40 }}></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td className="mb-item-name">{i.item}</td>
                  <td>
                    <select className={`mb-dec-select ${DECISIONS.find(d => d.id === i.decision).cls}`} value={i.decision} onChange={e => update(i.id, { decision: e.target.value })} aria-label={`What to do with ${i.item}`}>
                      {DECISIONS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                    </select>
                  </td>
                  <td><select value={i.type} onChange={e => update(i.id, { type: e.target.value })} aria-label={`${i.item} type`}>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
                  <td>{i.decision === "sell" ? <input type="number" min="0" placeholder="£" value={i.value} onChange={e => update(i.id, { value: e.target.value })} aria-label={`${i.item} price`} /> : <span className="mb-hint">–</span>}</td>
                  <td><input type="text" placeholder="e.g. ask flatmate first" value={i.note} onChange={e => update(i.id, { note: e.target.value })} aria-label={`${i.item} notes`} /></td>
                  <td className="mb-noprint"><button type="button" className="mb-icon-btn" onClick={() => remove(i.id)} aria-label={`Remove ${i.item}`}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-info-grid">
        <div className="mb-info sell">
          <h4>💷 Selling</h4>
          <p>You could make about <strong>{money(sellTotal)}</strong> from {counts.sell} item{counts.sell === 1 ? "" : "s"}.</p>
          <p className="mb-hint">Try Facebook Marketplace, Vinted (clothes), Gumtree, or your university's buy/sell group. Post 2–3 weeks before you leave.</p>
        </div>
        <div className="mb-info donate">
          <h4>💝 Donating</h4>
          <p><strong>{counts.donate}</strong> item{counts.donate === 1 ? "" : "s"} to donate.</p>
          <p className="mb-hint">Many universities run end-of-year reuse or donation points. Charity shops take clothes, books and kitchenware; some charities collect furniture for free.</p>
        </div>
        <div className="mb-info store">
          <h4>📦 Storage over the holiday</h4>
          {storeBoxes === 0 ? <p>Nothing marked to store yet.</p> : <>
            <p>About <strong>{storeBoxes} box{storeBoxes === 1 ? "" : "es"}</strong> to store.</p>
            <div className="mb-field mb-inline"><label htmlFor="mb-weeks">For how many weeks?</label><input id="mb-weeks" type="number" min="1" max="52" value={weeks} onChange={e => setWeeks(Math.max(1, Number(e.target.value) || 1))} /></div>
            <ul className="mb-storage-list">
              <li><span>Student box storage (collected from you)</span><strong>{money(boxCost)}</strong></li>
              <li><span>Self-storage unit (~{unitSqFt} sq ft)</span><strong>{money(unitCost)}</strong></li>
            </ul>
            <p className="mb-hint">Rough guide: box storage from about £1.30 per box per week; self-storage averages about £27.40 per sq ft per year plus VAT. Always get a real quote.</p>
          </>}
        </div>
      </div>
    </section>
  );
}


/* =============================================================
   8. MOVE OUT – PART 2: PACKING PLAN
   ============================================================= */
function PackingPlan({ items, packing, setPacking, steps, setSteps, moveOut }) {
  // Every item from Part 1 appears here automatically (including ones added later)
  const toPack = items;
  const { containers, assign } = packing;
  const [dragId, setDragId] = useState(null);       // item being dragged
  const [overId, setOverId] = useState(null);       // container the item is hovering over
  const [newDest, setNewDest] = useState("home");

  const containerOf = item => containers.find(c => c.id === assign[item.id]) || null;
  const unpacked = toPack.filter(i => !containerOf(i));
  const itemsIn = c => toPack.filter(i => assign[i.id] === c.id);
  const used = list => list.reduce((sum, i) => sum + (BOXES_PER_TYPE[i.type] || 1), 0);

  /* ---- changing the plan ---- */
  const moveItem = (itemId, containerId) =>
    setPacking(p => {
      const next = { ...p.assign };
      if (containerId) next[itemId] = containerId; else delete next[itemId];
      return { ...p, assign: next };
    });

  function nextName(kind, list) {
    const label = CONTAINER_KINDS[kind].label;
    let n = 1;
    while (list.some(c => c.name === `${label} ${n}`)) n++;
    return `${label} ${n}`;
  }

  const addContainer = kind => setPacking(p => ({
    ...p,
    containers: [...p.containers, { id: uid(), kind, name: nextName(kind, p.containers), dest: newDest, packed: false }]
  }));

  const updateContainer = (id, change) => setPacking(p => ({ ...p, containers: p.containers.map(c => c.id === id ? { ...c, ...change } : c) }));

  function removeContainer(id) {
    const c = containers.find(x => x.id === id);
    const count = itemsIn(c).length;
    if (count && !window.confirm(`Remove ${c.name}? Its countitem{count === 1 ? "" : "s"} will go back to "Not packed yet".`)) return;
    setPacking(p => {
      const next = { ...p.assign };
      Object.keys(next).forEach(k => { if (next[k] === id) delete next[k]; });
      return { containers: p.containers.filter(x => x.id !== id), assign: next };
    });
  }

  // ✨ Auto-pack: make containers and fill them using the packing suggestions
  function autoPack() {
    if (containers.length && !window.confirm("Auto-pack will replace your current containers and start again. Continue?")) return;
    const made = [], assignment = {};
    const open = {};   // the container currently being filled, per destination + kind
    ["home", "store", "donate"].forEach(dest => {
      toPack.filter(i => i.decision === dest).forEach(i => {
        const rule = PACK_RULES[i.type] || PACK_RULES.Other;
        // Donations go into charity bags (or stay whole if they're large); home / store follow the suggestions
        const suggestion = dest === "donate" ? (i.type === "Large item" ? "large" : "bag") : rule[dest];
        const kind = SUGGESTED_KIND[suggestion] || suggestion;
        const capacity = SUGGESTED_CAPACITY[suggestion] || CONTAINER_KINDS[kind].capacity;
        const size = BOXES_PER_TYPE[i.type] || 1;
        const key = dest + "|" + suggestion;
        let c = open[key];
        // Start a new container if there isn't one yet, or it's full (large items always get their own)
        if (!c || kind === "large" || c.fill + size > capacity) {
          let name = kind === "large" ? i.item : nextName(kind, made);
          if (dest === "donate" && kind !== "large") {
            let n = 1; while (made.some(x => x.name === `Charity bag ${n}`)) n++;
            name = `Charity bag ${n}`;
          }
          c = { id: uid(), kind, name, dest, packed: false, fill: 0 };
          made.push(c);
          open[key] = c;
        }
        c.fill += size;
        assignment[i.id] = c.id;
      });
    });
    // Things you're selling or binning stay in "Not packed yet" – drag them somewhere if you want to
    setPacking({ containers: made.map(({ fill, ...c }) => c), assign: assignment });
  }

  function clearAll() {
    if (!window.confirm("Remove all containers and unpack everything?")) return;
    setPacking({ containers: [], assign: {} });
  }

  /* ---- drag and drop (computer) ---- */
  const dragProps = item => ({
    draggable: true,
    onDragStart: e => { setDragId(item.id); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", item.id); } catch (err) { /* old browsers */ } },
    onDragEnd: () => { setDragId(null); setOverId(null); }
  });
  const dropProps = containerId => ({
    onDragOver: e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overId !== (containerId || "tray")) setOverId(containerId || "tray"); },
    onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverId(null); },
    onDrop: e => {
      e.preventDefault();
      let id = dragId;
      try { id = e.dataTransfer.getData("text/plain") || dragId; } catch (err) { /* use dragId */ }
      if (id) moveItem(id, containerId);
      setDragId(null); setOverId(null);
    }
  });

  /* ---- warnings for an item in a container ---- */
  function warningFor(item, c) {
    if (!c) return null;
    const goingTo = { home: "is going home", store: "is going to storage", donate: "is going to charity" }[c.dest];
    const marked = DECISIONS.find(d => d.id === item.decision);
    if (["home", "store", "donate"].includes(item.decision) && item.decision !== c.dest)
      return `Marked ${marked.label} in Part 1, but ${c.name} ${goingTo}`;
    if (c.dest === "home" && (item.type === "Documents" || item.type === "Electronics") && c.kind !== "hand")
      return item.type === "Documents" ? "Keep documents in hand luggage" : "Laptops & power banks must go in hand luggage when flying";
    if (item.type === "Large item" && c.kind !== "large") return "Probably too big for this";
    return null;
  }

  /* ---- one item "chip" ---- */
  const renderItem = (item, container) => {
    const warn = warningFor(item, container);
    return (
      <li key={item.id} className={`mb-pack-item ${dragId === item.id ? "dragging" : ""}`} {...dragProps(item)}>
        <span className="mb-grip" aria-hidden="true">⠿</span>
        <span className="mb-pack-item-main">
          <span className="mb-pack-item-name">{item.item}</span>
          <span className="mb-pack-item-meta">
            <span className={`mb-mini-tag ${item.decision}`}>{(DECISIONS.find(d => d.id === item.decision) || DECISIONS[0]).icon} {(DECISIONS.find(d => d.id === item.decision) || DECISIONS[0]).label}</span>
            {item.type}
          </span>
          {warn && <span className="mb-pack-warn">⚠️ {warn}</span>}
        </span>
        <select className="mb-move-select" value={container ? container.id : ""} onChange={e => moveItem(item.id, e.target.value || null)} aria-label={`Move ${item.item} to`}>
          <option value="">{container ? "↩ Unpack" : "Move to…"}</option>
          {containers.map(c => <option key={c.id} value={c.id}>{CONTAINER_KINDS[c.kind].icon} {c.name}</option>)}
        </select>
      </li>
    );
  };

  /* ---- one container card ---- */
  const renderContainer = c => {
    const kind = CONTAINER_KINDS[c.kind];
    const list = itemsIn(c);
    const fill = c.kind === "large" ? null : used(list) / kind.capacity;
    return (
      <div key={c.id} className={`mb-container-card ${overId === c.id ? "drop-over" : ""} ${c.packed ? "is-packed" : ""}`} {...dropProps(c.id)}>
        <div className="mb-container-head">
          <span className="mb-container-icon">{kind.icon}</span>
          <input className="mb-container-name" value={c.name} onChange={e => updateContainer(c.id, { name: e.target.value })} aria-label="Container name" />
          <button type="button" className="mb-icon-btn" onClick={() => removeContainer(c.id)} aria-label={`Remove ${c.name}`}>✕</button>
        </div>
        <div className="mb-container-controls">
          <select value={c.dest} onChange={e => updateContainer(c.id, { dest: e.target.value })} aria-label={`Where ${c.name} is going`}>
            <option value="home">🏠 Going home</option>
            <option value="store">📦 Going to storage</option>
            <option value="donate">💝 Going to charity</option>
          </select>
          <label className="mb-packed-check">
            <input type="checkbox" className="mb-check" checked={c.packed} onChange={e => updateContainer(c.id, { packed: e.target.checked })} />
            Packed &amp; labelled
          </label>
        </div>
        {fill !== null && (
          <div className="mb-fill">
            <div className="mb-bar"><div className={`mb-bar-fill ${fill > 1 ? "over" : fill > 0.85 ? "nearly" : ""}`} style={{ width: Math.min(100, fill * 100) + "%" }} /></div>
            <span className={`mb-hint ${fill > 1 ? "mb-over-text" : ""}`}>
              {list.length === 0 ? "Empty" : fill > 1 ? "Too full – move some things to another one" : `About ${Math.round(fill * 100)}% full`}
            </span>
          </div>
        )}
        {list.length === 0 ? (
          <div className="mb-drop-hint">Drag items here{containers.length ? " – or use “Move to…” on an item" : ""}</div>
        ) : (
          <ul className="mb-pack-list">{list.map(i => renderItem(i, c))}</ul>
        )}
        <p className="mb-hint mb-container-note">{kind.note}</p>
      </div>
    );
  };

  // Smart "pack these together" tips, based on what's on the list
  const types = new Set(toPack.map(i => i.type));
  const together = [];
  if (types.has("Kitchen items") && (types.has("Bedding & towels") || types.has("Clothes")))
    together.push(["🍽️ + 🧺", "Wrap plates, mugs and glasses in towels or T-shirts. No bubble wrap needed, and you save space."]);
  if (types.has("Shoes") && types.has("Clothes"))
    together.push(["👟 + 🧦", "Stuff socks and underwear inside shoes, then put the shoes in a bag at the bottom of the suitcase."]);
  if (types.has("Books & stationery"))
    together.push(["📚 + 🧣", "Put books in small boxes and fill the gaps with scarves or soft items so nothing slides."]);
  if (types.has("Electronics"))
    together.push(["💻 + 🔌", "Keep each device with its own cable and plug in a labelled zip bag."]);
  if (types.has("Toiletries") && types.has("Electronics"))
    together.push(["🧴 ✕ 💻", "Never pack liquids next to electronics. Seal toiletries in zip-lock bags on their own."]);
  if (types.has("Fragile / decor"))
    together.push(["🖼️ + 🛏️", "Pack frames and mirrors upright between pillows or folded duvets."]);
  if (types.has("Documents"))
    together.push(["🛂 + 🎒", "Passport, visa/eVisa details, tenancy papers and bank cards go together in your hand luggage."]);
  together.push(["🏷️", "Label every box and bag with your name, phone number, what's inside and \"HOME\" or \"STORAGE\"."]);

  const packedCount = containers.filter(c => c.packed).length;
  const lanes = [["home", "🏠 Going home with you", "Flying home? Check your airline's baggage allowance before you pack."],
                 ["store", "📦 Going into storage", "Use strong boxes of the same size so they stack safely."],
                 ["donate", "💝 Going to charity", "Drop these at a charity shop or your university's reuse point, or book a free collection."]];

  return (
    <section className="mb-card" id="move-out-2">
      <PartHeader part="MOVE OUT · PART 2" title="🧳 Your packing plan"
        intro="Add your suitcases, boxes and bags, then drag each thing you're taking home or storing into the right one. Or press Auto-pack and adjust it." />

      {toPack.length === 0 ? (
        <div className="mb-empty">Add your things in <strong>Part 1</strong> and they'll appear here automatically, ready to pack.</div>
      ) : <>
        {/* ---- toolbar ---- */}
        <div className="mb-pack-toolbar">
          <div className="mb-add-containers">
            <span className="mb-toolbar-label">Add a container going to</span>
            <select value={newDest} onChange={e => setNewDest(e.target.value)} aria-label="New container destination">
              <option value="home">🏠 Home</option>
              <option value="donate">💝 Charity</option>
              <option value="store">📦 Storage</option>
            </select>
            {Object.entries(CONTAINER_KINDS).map(([kind, k]) => (
              <button type="button" key={kind} className="mb-btn mb-btn-small mb-btn-outline" onClick={() => addContainer(kind)}>+ {k.icon} {k.label}</button>
            ))}
          </div>
          <div className="mb-pack-actions">
            <button type="button" className="mb-btn mb-btn-small mb-btn-red" onClick={autoPack}>✨ Auto-pack for me</button>
            {containers.length > 0 && <button type="button" className="mb-btn mb-btn-small mb-btn-ghost" onClick={clearAll}>Clear all</button>}
          </div>
        </div>

        <div className="mb-pack-progress">
          <Progress done={toPack.length - unpacked.length} total={toPack.length} label="Items packed" />
          {containers.length > 0 && <Progress done={packedCount} total={containers.length} label="Containers packed & labelled" />}
        </div>

        {/* ---- not packed yet tray ---- */}
        <div className={`mb-tray ${overId === "tray" ? "drop-over" : ""}`} {...dropProps(null)}>
          <h4>🧺 Not packed yet <span className="mb-count">{unpacked.length}</span></h4>
          {unpacked.length === 0
            ? <p className="mb-tray-done">🎉 Everything is packed!</p>
            : <>
                <p className="mb-hint">
                  {containers.length ? "Drag each item into a container below, or use “Move to…” (easier on a phone)." : "First add a suitcase, box or bag above, or press ✨ Auto-pack for me."}
                  {unpacked.some(i => i.decision === "sell" || i.decision === "bin") && " Things you're selling or recycling can stay here, or go in a box if you need one."}
                </p>
                <ul className="mb-pack-list mb-tray-list">{unpacked.map(i => renderItem(i, null))}</ul>
              </>}
        </div>

        {/* ---- containers, split by destination ---- */}
        {lanes.map(([dest, title, intro]) => {
          const list = containers.filter(c => c.dest === dest);
          if (!list.length) return null;
          return (
            <div key={dest} className="mb-pack-dest">
              <h4>{title} <span className="mb-count">{list.length}</span></h4>
              <p className="mb-hint">{intro}</p>
              <div className="mb-container-grid">{list.map(c => renderContainer(c))}</div>
            </div>
          );
        })}
      </>}

      <div className="mb-together">
        <h4>🤝 Pack these together</h4>
        <ul>
          {together.map(([icons, text], i) => <li key={i}><span className="mb-together-icons">{icons}</span><span>{text}</span></li>)}
        </ul>
      </div>

      <MoveOutTimeline steps={steps} setSteps={setSteps} moveOut={moveOut} />
    </section>
  );
}


/* =============================================================
   8b. MOVE OUT – PART 2: EDITABLE MOVE-OUT TIMELINE
   ============================================================= */
const WHEN_SUGGESTIONS = ["4 weeks before", "3 weeks before", "2 weeks before", "1 week before", "5 days before",
  "3 days before", "2 days before", "1 day before", "Moving day", "After moving"];

const defaultSteps = () => TIMELINE.map(([when, task]) => ({ id: uid(), when, task, done: false }));

// Turn "3 weeks before" / "2 days before" / "Moving day" into a real date, using the move-out date
function stepDate(when, moveOut) {
  if (!moveOut) return null;
  const base = new Date(moveOut + "T00:00:00");
  const text = when.toLowerCase();
  const m = text.match(/(\d+)\s*(day|week)s?\s*before/);
  let d = null;
  if (m) d = new Date(base.getTime() - Number(m[1]) * (m[2] === "week" ? 7 : 1) * 86400000);
  else if (/moving day|on the day|move-out day/.test(text)) d = base;
  else if (/day before/.test(text)) d = new Date(base.getTime() - 86400000);
  else if (/week before/.test(text)) d = new Date(base.getTime() - 7 * 86400000);
  if (!d) return null;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function MoveOutTimeline({ steps, setSteps, moveOut }) {
  const [editing, setEditing] = useState(false);
  const [newStep, setNewStep] = useState({ when: "1 week before", task: "" });
  const [message, setMessage] = useState("");
  const taskInput = useRef(null);

  const update = (id, change) => setSteps(list => list.map(s => s.id === id ? { ...s, ...change } : s));
  const remove = id => setSteps(list => list.filter(s => s.id !== id));
  const move = (index, by) => setSteps(list => {
    const next = [...list];
    const target = index + by;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  function addStep() {
    const task = newStep.task.trim();
    if (!task) { setMessage("Type what needs doing first, e.g. Book a taxi to the airport."); taskInput.current && taskInput.current.focus(); return; }
    setSteps(list => [...list, { id: uid(), when: newStep.when.trim() || "Before moving", task, done: false }]);
    setNewStep(n => ({ ...n, task: "" }));
    setMessage(`✓ Added "${task}".`);
    setTimeout(() => setMessage(""), 3000);
    taskInput.current && taskInput.current.focus();
  }

  function reset() {
    if (!window.confirm("Replace your timeline with the suggested steps? Your own steps and ticks will be removed.")) return;
    setSteps(defaultSteps());
  }

  const done = steps.filter(s => s.done).length;

  return (
    <div className="mb-timeline">
      <div className="mb-timeline-head">
        <h4>🗓️ Move-out timeline</h4>
        <Progress done={done} total={steps.length} label="Done" />
      </div>
      <div className="mb-timeline-tools">
        <span className="mb-hint">{moveOut ? `Dates are worked out from your move-out date (${formatDate(moveOut)}).` : "Add your move-out date at the top of the page to see real dates for each step."}</span>
        <span>
          <button type="button" className={`mb-btn mb-btn-small ${editing ? "mb-btn-red" : "mb-btn-outline"}`} onClick={() => setEditing(e => !e)}>{editing ? "✓ Done editing" : "✏️ Edit timeline"}</button>
          {editing && <>{" "}<button type="button" className="mb-btn mb-btn-small mb-btn-ghost" onClick={reset}>Reset to suggested steps</button></>}
        </span>
      </div>

      {steps.length === 0 ? <div className="mb-empty">No steps yet. Add your first step below, or press Edit timeline → Reset to suggested steps.</div> : (
        <ul className={editing ? "mb-timeline-edit" : ""}>
          {steps.map((s, i) => {
            const date = stepDate(s.when, moveOut);
            return editing ? (
              <li key={s.id} className="mb-step-edit">
                <input type="checkbox" className="mb-check" checked={s.done} onChange={e => update(s.id, { done: e.target.checked })} aria-label={`Done: ${s.task}`} />
                <input type="text" className="mb-step-when" list="mb-when-list" value={s.when} onChange={e => update(s.id, { when: e.target.value })} aria-label="When" />
                <input type="text" className="mb-step-task" value={s.task} onChange={e => update(s.id, { task: e.target.value })} aria-label="What to do" />
                <span className="mb-step-buttons">
                  <button type="button" className="mb-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className="mb-icon-btn" onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="mb-icon-btn" onClick={() => remove(s.id)} aria-label={`Delete step: ${s.task}`}>✕</button>
                </span>
              </li>
            ) : (
              <li key={s.id} className={s.done ? "is-done" : ""}>
                <label>
                  <input type="checkbox" className="mb-check" checked={s.done} onChange={e => update(s.id, { done: e.target.checked })} />
                  <span className="mb-when">{s.when}{date && <small>{date}</small>}</span>
                  <span>{s.task}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mb-add-step">
        <input type="text" className="mb-step-when" list="mb-when-list" placeholder="When" value={newStep.when}
          onChange={e => setNewStep(n => ({ ...n, when: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} aria-label="When (new step)" />
        <input ref={taskInput} type="text" className="mb-step-task" placeholder="Add your own step, e.g. Book a taxi to the airport" value={newStep.task}
          onChange={e => { setNewStep(n => ({ ...n, task: e.target.value })); setMessage(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} aria-label="What to do (new step)" />
        <button type="button" className="mb-btn mb-btn-small mb-btn-red" onClick={addStep}>+ Add step</button>
      </div>
      {message && <p className={`mb-add-msg ${message.startsWith("✓") ? "ok" : "err"}`} role="status">{message}</p>}
      <datalist id="mb-when-list">{WHEN_SUGGESTIONS.map(w => <option key={w} value={w} />)}</datalist>
    </div>
  );
}


/* =============================================================
   9. THE PAGE
   ============================================================= */
function MoveTracker() {
  const [tab, setTab] = useSaved("movebuddy-tab", "in");
  const [profile, setProfile] = useSaved("movebuddy-profile", { accommodation: "", room: "", moveIn: todayISO(), moveOut: "" });
  const [furniture, setFurniture] = useSaved("movebuddy-furniture", () =>
    DEFAULT_FURNITURE.map(name => ({ id: uid(), name, provided: false, qty: 1, condition: "Not checked", note: "" })));
  const [photos, setPhotos] = useSaved("movebuddy-photos", []);
  const [borrowed, setBorrowed] = useSaved("movebuddy-borrowed", []);
  const [plan, setPlan] = useSaved("movebuddy-plan", []);
  const [weeks, setWeeks] = useSaved("movebuddy-storage-weeks", 12);
  const [steps, setSteps] = useSaved("movebuddy-timeline-steps", () => {
    // Keep ticks from the older version of the timeline, if there are any
    let oldTicks = {};
    try { oldTicks = JSON.parse(window.localStorage.getItem("movebuddy-timeline")) || {}; } catch (err) { /* none */ }
    return defaultSteps().map((step, i) => ({ ...step, done: !!oldTicks[i] }));
  });
  const [packing, setPacking] = useSaved("movebuddy-packing", { containers: [], assign: {} });

  const setP = key => e => setProfile(p => ({ ...p, [key]: e.target.value }));
  const daysToMoveOut = daysUntil(profile.moveOut);
  const borrowedOut = borrowed.filter(b => !b.returned).length;

  function startOver() {
    if (!window.confirm("Clear everything and start again? This deletes your checklists, photos and plans on this device.")) return;
    photos.forEach(p => deletePhoto(p.id));
    setFurniture(DEFAULT_FURNITURE.map(name => ({ id: uid(), name, provided: false, qty: 1, condition: "Not checked", note: "" })));
    setPhotos([]); setBorrowed([]); setPlan([]); setSteps(defaultSteps()); setWeeks(12);
    setPacking({ containers: [], assign: {} });
    setProfile({ accommodation: "", room: "", moveIn: todayISO(), moveOut: "" });
  }

  return (
    <div className="movebuddy">

      {/* ================= HERO ================= */}
      <section className="mb-hero">
        <div className="mb-container">
          <h1>Move in with proof. Move out with a plan.</h1>
          <p>MoveBuddy helps students record their room on move-in day, keep track of borrowed items, and plan a stress-free move-out.</p>
          <div className="mb-hero-steps">
            <div>🛏️ Furniture checklist</div><div>📸 Room condition photos</div><div>🧹 Borrowed items</div>
            <div>🗂️ Take home, sell, donate or store</div><div>🧳 Packing plan</div>
          </div>
        </div>
      </section>

      <div className="mb-container mb-main">

        {/* ================= MY ROOM DETAILS ================= */}
        <section className="mb-card mb-profile">
          <div className="mb-profile-grid">
            <div className="mb-field"><label htmlFor="mb-acc">Accommodation</label><input id="mb-acc" type="text" placeholder="e.g. Riverside Hall" value={profile.accommodation} onChange={setP("accommodation")} /></div>
            <div className="mb-field"><label htmlFor="mb-room">Room / flat number</label><input id="mb-room" type="text" placeholder="e.g. Flat 4, Room B" value={profile.room} onChange={setP("room")} /></div>
            <div className="mb-field"><label htmlFor="mb-in">Move-in date</label><input id="mb-in" type="date" value={profile.moveIn} onChange={setP("moveIn")} /></div>
            <div className="mb-field"><label htmlFor="mb-out">Move-out date</label><input id="mb-out" type="date" value={profile.moveOut} onChange={setP("moveOut")} /></div>
          </div>
          <div className="mb-profile-foot">
            <span className="mb-hint">
              💾 Everything saves automatically on this device.
              {daysToMoveOut !== null && daysToMoveOut >= 0 && <> · <strong>{daysToMoveOut} day{daysToMoveOut === 1 ? "" : "s"}</strong> until move-out.</>}
            </span>
            <span className="mb-noprint">
              <button type="button" className="mb-btn mb-btn-small mb-btn-ghost" onClick={startOver}>Start over</button>
            </span>
          </div>
        </section>

        {/* ================= MOVE IN / MOVE OUT TABS ================= */}
        <div className="mb-tabs mb-noprint" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "in"} className={`mb-tab ${tab === "in" ? "active" : ""}`} onClick={() => setTab("in")}>
            <span className="mb-tab-icon">🔑</span><span><strong>Move in</strong><small>Furniture · Photos · Borrowed items</small></span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "out"} className={`mb-tab ${tab === "out" ? "active" : ""}`} onClick={() => setTab("out")}>
            <span className="mb-tab-icon">📦</span><span><strong>Move out</strong><small>What to do with things · Packing plan</small></span>
            {borrowedOut > 0 && <span className="mb-tab-badge" title="Borrowed items not returned yet">{borrowedOut}</span>}
          </button>
        </div>

        {tab === "in" ? (
          <div className="mb-stack">
            <nav className="mb-subnav mb-noprint"><a href="#move-in-1">1 · Furniture</a><a href="#move-in-2">2 · Photos</a><a href="#move-in-3">3 · Borrowed items</a></nav>
            <FurnitureChecklist items={furniture} setItems={setFurniture} />
            <PhotoLog photos={photos} setPhotos={setPhotos} />
            <BorrowedItems items={borrowed} setItems={setBorrowed} />
          </div>
        ) : (
          <div className="mb-stack">
            <nav className="mb-subnav mb-noprint"><a href="#move-out-1">1 · Plan your things</a><a href="#move-out-2">2 · Packing plan</a></nav>
            <MoveOutPlan items={plan} setItems={setPlan} borrowed={borrowed} weeks={weeks} setWeeks={setWeeks} />
            <PackingPlan items={plan} packing={packing} setPacking={setPacking} steps={steps} setSteps={setSteps} moveOut={profile.moveOut} />
          </div>
        )}
      </div>
    </div>
  );
}



export default MoveTracker

