/* PITEX — firestore-products.js
   Loads the visible production lines (productionLines) and their machines
   (machines) from Firestore and swaps them into window.PitexCategories.data
   and window.PitexProducts.data, then asks the existing i18n pipeline to
   repaint every grid. If a collection is empty or Firestore is unreachable,
   the built-in data stays in place, so the site never shows a blank page. */
import { db } from "./firebase-config.js";
import { collection, query, where, getDocs }
  from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const empty = { en: "", ar: "" };
const visible = (name) => getDocs(query(collection(db, name), where("isActive", "==", true)));

function normalizeLine(id, d) {
  return { ...d, slug: id, _order: d.order ?? 99 };
}

function normalizeMachine(id, d, lineBySlug) {
  const images = Array.isArray(d.images) ? d.images : [];
  const title = d.title || empty;
  const line = lineBySlug(d.category);
  return {
    id,
    title,
    category: d.category,
    categoryLabel: d.categoryLabel || (line ? line.label : empty),
    featured: !!d.featured,
    status: d.status || empty,
    image: d.image || images[0] || "",
    alt: d.alt || title.en || "",
    description: d.description || empty,
    longDescription: d.longDescription || d.description || empty,
    icons: d.icons || [],
    badges: d.badges || [],
    images,
    availability: d.availability || empty,
    exportReady: !!d.exportReady,
    warranty: d.warranty || empty,
    specifications: d.specifications || [],
    features: d.features || [],
    applications: d.applications || [],
    _order: d.order ?? 9999
  };
}

function swap(target, list) {
  target.splice(0, target.length, ...list); // same array object, so every helper sees the new data
}

function repaint() {
  const I = window.I18N;
  if (!I || !I.setLanguage) return;
  // <html lang> is already set to the visitor's language before first paint.
  I.setLanguage(document.documentElement.lang || (I.getLanguage && I.getLanguage()) || "en");
}

async function run() {
  try {
    const [ls, ms] = await Promise.all([visible("productionLines"), visible("machines")]);
    let changed = false;

    if (!ls.empty && window.PitexCategories) {
      swap(window.PitexCategories.data, ls.docs.map((d) => normalizeLine(d.id, d.data())).sort((a, b) => a._order - b._order));
      changed = true;
    }
    if (!ms.empty && window.PitexProducts) {
      const bySlug = (s) => window.PitexCategories && window.PitexCategories.data.find((c) => c.slug === s);
      swap(window.PitexProducts.data, ms.docs.map((d) => normalizeMachine(d.id, d.data(), bySlug)).sort((a, b) => a._order - b._order));
      changed = true;
    }

    if (!changed) return;
    if (document.readyState === "complete") repaint();
    else window.addEventListener("load", repaint, { once: true });
  } catch (err) {
    console.warn("[PITEX] Firestore unavailable, using built-in data:", err.message);
  }
}
run();
