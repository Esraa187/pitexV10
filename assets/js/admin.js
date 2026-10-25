import { db, auth, storage } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

/* ===== Interface strings: ONE language at a time (stored content is never translated) ===== */
const I = {
en: { "brand.sub":"Industrial dashboard","nav.lines":"Production Lines","nav.machines":"Machines Management","nav.site":"Visit Live Site","nav.logout":"Logout","nav.menu":"Menu",
"search.global":"Search machines, lines…","search.machines":"Search machines…","foot.copy":"© PITEX Industrial. All rights reserved.","dash":"Dashboard",
"login.title":"Administrator sign in","login.email":"Email","login.password":"Password","login.submit":"Sign in","login.err":"Incorrect email or password.",
"btn.cancel":"Cancel","btn.delete":"Delete","btn.edit":"Edit","btn.save":"Save Changes","btn.saveMachine":"Save Machine","btn.addLine":"Add New Line","btn.addMachine":"Add Machine","btn.manage":"Manage","btn.import":"Import current site data","btn.back":"Back","btn.preview":"Preview on site","btn.show":"Show on site","btn.hide":"Hide from site","btn.more":"More actions",
"lines.title":"Production Lines","lines.sub":"Manage all production lines shown on the public website.","lines.total":"Total lines","lines.visible":"Visible","lines.hidden":"Hidden","lines.machines":"Total machines","tab.all":"All Lines","tab.visible":"Visible","tab.hidden":"Hidden","lines.none":"No production lines yet. Use “Import current site data” to move the existing lines and machines into the database.","lines.nomatch":"No lines match your search.","lines.count":"{n} Machines","lines.shown":"Visible","lines.off":"Hidden",
"m.title":"Machines Management","m.sub":"Each machine has an image and a name, and belongs to one production line.","m.forLine":"Machines of {line}","m.col":"Machine","m.line":"Production Line","m.status":"Status","m.all":"All lines","m.sort":"Sort A–Z","m.none":"No machines yet.","m.nomatch":"No machines match.","m.showing":"Showing {a}–{b} of {n} machines","m.prev":"Previous","m.next":"Next",
"mf.add":"Add Machine","mf.edit":"Edit Machine","mf.core":"Machine","mf.nameEn":"Machine name (English)","mf.nameAr":"Machine name (Arabic)","mf.line":"Production line","mf.image":"Machine image",
"lf.add":"Add Production Line","lf.edit":"Edit Production Line","lf.subAdd":"Create a new line for the public website.","lf.subEdit":"Edit this line’s content and visibility.","lf.en":"English content","lf.ar":"Arabic content","lf.name":"Line name","lf.short":"Short description","lf.intro":"Page intro","lf.over":"Overview","lf.image":"Line image","lf.vis":"Visibility","lf.active":"Visible on public site","lf.activeSub":"Hidden lines disappear from the website.",
"img.choose":"Click to upload an image","img.hint":"JPG, PNG or WebP, up to 5 MB.","img.or":"Or image path / URL","img.type":"Only JPG, PNG or WebP images are allowed.","img.size":"The image must be 5 MB or smaller.","img.fail":"Image upload failed (check that Firebase Storage is enabled): ","img.req":"Please add an image.",
"v.req":"This field is required.","t.saved":"Saved successfully","t.added":"Added successfully","t.deleted":"Deleted successfully","t.shown":"Now visible on the site","t.hidden":"Now hidden from the site","t.fail":"Operation failed: ","t.load":"Could not load data: ","t.imported":"Import completed",
"c.delMachine":"Delete this machine?","c.delMachineTx":"“{n}” will be permanently deleted. This cannot be undone.","c.delLine":"Delete this production line?","c.delLineTx":"“{n}” will be permanently deleted. This cannot be undone.","c.hasMachines":"This line still has {n} machine(s). Delete or move them first.","c.import":"Move {l} lines and {m} machines to the database?","c.importStray":" {s} old test record(s) will be deleted.","saving":"Saving…","loading":"Loading…" },
ar: { "brand.sub":"لوحة التحكم الصناعية","nav.lines":"خطوط الإنتاج","nav.machines":"إدارة الآلات","nav.site":"زيارة الموقع","nav.logout":"تسجيل الخروج","nav.menu":"القائمة",
"search.global":"ابحث عن آلات أو خطوط…","search.machines":"ابحث عن آلة…","foot.copy":"© بيتكس الصناعية. جميع الحقوق محفوظة.","dash":"لوحة التحكم",
"login.title":"تسجيل دخول المسؤول","login.email":"البريد الإلكتروني","login.password":"كلمة المرور","login.submit":"دخول","login.err":"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
"btn.cancel":"إلغاء","btn.delete":"حذف","btn.edit":"تعديل","btn.save":"حفظ التغييرات","btn.saveMachine":"حفظ الآلة","btn.addLine":"إضافة خط جديد","btn.addMachine":"إضافة آلة","btn.manage":"إدارة","btn.import":"استيراد بيانات الموقع الحالية","btn.back":"رجوع","btn.preview":"معاينة في الموقع","btn.show":"إظهار في الموقع","btn.hide":"إخفاء من الموقع","btn.more":"المزيد",
"lines.title":"خطوط الإنتاج","lines.sub":"إدارة جميع خطوط الإنتاج الظاهرة في الموقع.","lines.total":"إجمالي الخطوط","lines.visible":"ظاهرة","lines.hidden":"مخفية","lines.machines":"إجمالي الآلات","tab.all":"كل الخطوط","tab.visible":"ظاهرة","tab.hidden":"مخفية","lines.none":"لا توجد خطوط بعد. استخدم «استيراد بيانات الموقع الحالية» لنقل الخطوط والآلات إلى قاعدة البيانات.","lines.nomatch":"لا توجد خطوط مطابقة للبحث.","lines.count":"{n} آلات","lines.shown":"ظاهر","lines.off":"مخفي",
"m.title":"إدارة الآلات","m.sub":"لكل آلة صورة واسم، وتتبع خط إنتاج واحدًا.","m.forLine":"آلات {line}","m.col":"الآلة","m.line":"خط الإنتاج","m.status":"الحالة","m.all":"كل الخطوط","m.sort":"ترتيب أبجدي","m.none":"لا توجد آلات بعد.","m.nomatch":"لا توجد آلات مطابقة.","m.showing":"عرض {a}–{b} من {n} آلة","m.prev":"السابق","m.next":"التالي",
"mf.add":"إضافة آلة","mf.edit":"تعديل آلة","mf.core":"الآلة","mf.nameEn":"اسم الآلة (بالإنجليزية)","mf.nameAr":"اسم الآلة (بالعربية)","mf.line":"خط الإنتاج","mf.image":"صورة الآلة",
"lf.add":"إضافة خط إنتاج","lf.edit":"تعديل خط الإنتاج","lf.subAdd":"أنشئ خطًا جديدًا للموقع.","lf.subEdit":"عدّل محتوى الخط وحالة ظهوره.","lf.en":"المحتوى الإنجليزي","lf.ar":"المحتوى العربي","lf.name":"اسم الخط","lf.short":"وصف مختصر","lf.intro":"مقدمة الصفحة","lf.over":"نظرة عامة","lf.image":"صورة الخط","lf.vis":"الظهور","lf.active":"ظاهر في الموقع","lf.activeSub":"الخطوط المخفية تختفي من الموقع.","img.choose":"اضغط لرفع صورة","img.hint":"JPG أو PNG أو WebP، حتى 5 ميجابايت.","img.or":"أو مسار / رابط الصورة","img.type":"مسموح فقط بصور JPG أو PNG أو WebP.","img.size":"يجب ألا يزيد حجم الصورة عن 5 ميجابايت.","img.fail":"فشل رفع الصورة (تأكد من تفعيل Firebase Storage): ","img.req":"من فضلك أضف صورة.",
"v.req":"هذا الحقل مطلوب.","t.saved":"تم الحفظ بنجاح","t.added":"تمت الإضافة بنجاح","t.deleted":"تم الحذف بنجاح","t.shown":"أصبح ظاهرًا في الموقع","t.hidden":"أصبح مخفيًا من الموقع","t.fail":"فشلت العملية: ","t.load":"تعذر تحميل البيانات: ","t.imported":"تم الاستيراد",
"c.delMachine":"حذف هذه الآلة؟","c.delMachineTx":"سيتم حذف «{n}» نهائيًا ولا يمكن التراجع.","c.delLine":"حذف خط الإنتاج هذا؟","c.delLineTx":"سيتم حذف «{n}» نهائيًا ولا يمكن التراجع.","c.hasMachines":"ما زال في هذا الخط {n} آلة. احذفها أو انقلها أولًا.","c.import":"نقل {l} خطوط و{m} آلة إلى قاعدة البيانات؟","c.importStray":" وسيتم حذف {s} سجل تجريبي قديم.","saving":"جارٍ الحفظ…","loading":"جارٍ التحميل…" } };

const $ = (id) => document.getElementById(id);
const LINES = "productionLines", MACHINES = "machines", PAGE = 8;
let lang = localStorage.getItem("pitex_admin_lang") === "en" ? "en" : "ar";
const t = (k, v = {}) => (I[lang][k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
const FL = { en: { title: "English content", name: "Line name", s: "Short description", h: "Page intro", o: "Overview", mname: "Machine name" }, ar: { title: "المحتوى العربي", name: "اسم الخط", s: "وصف مختصر", h: "مقدمة الصفحة", o: "نظرة عامة", mname: "اسم الآلة" } };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
const clean = (o) => JSON.parse(JSON.stringify(o));
const slugify = (s) => s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const staticLines = () => (window.PitexCategories ? window.PitexCategories.data : []);
const staticMachines = () => (window.PitexProducts ? window.PitexProducts.data : []);
const ln = (l) => (l?.label?.[lang] || l?.label?.en || l?.label?.ar || l?.id || "").trim();
const mn = (m) => (m?.title?.[lang] || m?.title?.en || m?.title?.ar || m?.id || "").trim();
const confirmModal = () => new bootstrap.Modal($("confirmModal"));

let lines = [], machines = [], stray = [];
const S = { q: "", tab: "all", lineFilter: "", sort: "order", page: 1, pending: null };

function toast(text, err) {
  const d = document.createElement("div"); d.className = "toast-msg" + (err ? " toast-msg--err" : ""); d.textContent = text;
  $("toasts").appendChild(d); setTimeout(() => d.remove(), 4500);
}

/* ===== Language ===== */
function applyStatic() {
  document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = t(e.dataset.i18n)));
  document.querySelectorAll("[data-i18n-attr-placeholder]").forEach((e) => e.setAttribute("placeholder", t(e.dataset.i18nAttrPlaceholder)));
  document.querySelectorAll("[data-i18n-attr-aria-label]").forEach((e) => e.setAttribute("aria-label", t(e.dataset.i18nAttrAriaLabel)));
  document.querySelectorAll("[data-lang-label]").forEach((e) => (e.textContent = lang === "ar" ? "English" : "العربية"));
  $("confirmModal").querySelector("[data-i18n='btn.cancel']").textContent = t("btn.cancel");
}
function setLang(l) {
  lang = l; localStorage.setItem("pitex_admin_lang", l);
  const rtl = l === "ar", h = document.documentElement;
  h.lang = l; h.dir = rtl ? "rtl" : "ltr";
  $("bsCss").href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap" + (rtl ? ".rtl" : "") + ".min.css";
  document.title = "PITEX | " + t("nav.lines");
  applyStatic(); route();
}
document.querySelectorAll("[data-lang-toggle]").forEach((b) => b.addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar")));

/* ===== Auth ===== */
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); $("loginError").classList.add("d-none"); $("loginBtn").disabled = true;
  try { await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value); }
  catch { $("loginError").textContent = t("login.err"); $("loginError").classList.remove("d-none"); }
  finally { $("loginBtn").disabled = false; }
});
$("logoutBtn").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, (u) => {
  $("loginView").hidden = !!u; $("dashView").hidden = !u;
  if (u) { $("userMail").textContent = u.email; $("userAv").textContent = (u.email || "A").slice(0, 2).toUpperCase(); load(); }
});
$("menuBtn").addEventListener("click", () => { $("side").classList.toggle("is-open"); $("backdrop").classList.toggle("is-open"); });
$("backdrop").addEventListener("click", () => { $("side").classList.remove("is-open"); $("backdrop").classList.remove("is-open"); });

/* ===== Data (same collections and fields as before) ===== */
async function load() {
  $("page").innerHTML = '<div class="empty">' + t("loading") + "</div>";
  try {
    const [ls, ms] = await Promise.all([getDocs(collection(db, LINES)), getDocs(collection(db, MACHINES))]);
    const slugs = staticLines().map((c) => c.slug);
    const all = ls.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Keep real (admin-created) lines too; only records that are neither built-in nor well-formed are treated as old test data.
    stray = all.filter((x) => !slugs.includes(x.id) && !x.label);
    lines = all.filter((x) => x.label).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    machines = ms.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    route();
  } catch (err) { console.error(err); toast(t("t.load") + err.message, true); $("page").innerHTML = ""; }
}
const countOf = (id) => machines.filter((m) => m.category === id).length;
const needImport = () => !lines.length || !machines.length || stray.length || staticLines().some((c) => !lines.find((l) => l.id === c.slug));

/* ===== Images ===== */
function checkImage(f) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return t("img.type");
  if (f.size > 5 * 1024 * 1024) return t("img.size");
  return "";
}
async function uploadImage(file, folder) {
  try {
    const r = sRef(storage, folder + "/" + Date.now() + "-" + file.name.replace(/[^\w.-]+/g, "_"));
    await uploadBytes(r, file); return await getDownloadURL(r);
  } catch (err) { throw new Error(t("img.fail") + err.message); }
}
function imageField(current) {
  return '<label class="drop" id="drop"><span id="dropTxt"' + (current ? " hidden" : "") + '><i class="bi bi-cloud-arrow-up fs-3 d-block"></i>' + t("img.choose") + "</span>" +
    (current ? '<img id="dropImg" src="' + esc(current) + '" alt="">' : '<img id="dropImg" alt="" hidden>') +
    '<input id="imgFile" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="imgErr" class="fb"></div>' +
    '<p class="hint">' + t("img.hint") + '</p><label class="form-label mt-2" for="imgUrl">' + t("img.or") + '</label><input id="imgUrl" class="form-control" dir="ltr" value="' + esc(current) + '" placeholder="assets/images/…">';
}
function wireImage() {
  const show = (src) => { $("dropImg").src = src; $("dropImg").hidden = !src; $("dropTxt").hidden = !!src; };
  $("imgFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; $("imgErr").textContent = "";
    if (!f) return;
    const bad = checkImage(f);
    if (bad) { $("imgErr").textContent = bad; e.target.value = ""; return; }
    show(URL.createObjectURL(f));
  });
  $("imgUrl").addEventListener("input", (e) => { if (!$("imgFile").files[0]) show(e.target.value.trim()); });
}
async function resolveImage(folder) {
  const f = $("imgFile").files[0];
  return f ? await uploadImage(f, folder) : $("imgUrl").value.trim();
}

/* ===== Router ===== */
function crumbs(parts) {
  $("crumbs").innerHTML = ['<a href="#/lines">' + t("dash") + "</a>"].concat(parts.map((p) => (p.h ? '<a href="' + p.h + '">' + esc(p.l) + "</a>" : "<span>" + esc(p.l) + "</span>"))).join('<i class="bi bi-chevron-' + (lang === "ar" ? "left" : "right") + '"></i>');
}
function route() {
  if ($("dashView").hidden) return;
  const h = (location.hash || "#/lines").replace(/^#\/?/, "").split("/"), [a, b] = h;
  document.querySelectorAll("[data-nav]").forEach((x) => x.classList.toggle("is-active", x.dataset.nav === (a === "machines" ? "machines" : "lines")));
  $("side").classList.remove("is-open"); $("backdrop").classList.remove("is-open");
  if (a === "machines" && b) return machineForm(b === "new" ? null : decodeURIComponent(b));
  if (a === "machines") return machinesView();
  if (a === "lines" && b) return lineForm(b === "new" ? null : decodeURIComponent(b));
  linesView();
}
window.addEventListener("hashchange", route);
const go = (h) => (location.hash === h ? route() : (location.hash = h));
function syncSearch(v) { S.q = v; S.page = 1; $("globalSearch").value = v; }
$("globalSearch").addEventListener("input", (e) => { syncSearch(e.target.value); const a = location.hash.split("/")[1]; if (!a || a === "lines" || a === "machines") { if (location.hash.includes("machines")) machinesView(true); else if (!location.hash.split("/")[2]) linesView(true); } });

const rel = (ts) => {
  const d = ts?.toDate?.(); if (!d) return "";
  const s = (d - Date.now()) / 1000, f = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  for (const [u, n] of [["day", 86400], ["hour", 3600], ["minute", 60]]) if (Math.abs(s) >= n) return f.format(Math.round(s / n), u);
  return f.format(0, "second");
};

/* ===== Production lines list ===== */
function linesView(keep) {
  crumbs([{ l: t("nav.lines") }]);
  const on = lines.filter((l) => l.isActive).length;
  const list = lines.filter((l) => (S.tab === "all" || (S.tab === "visible") === !!l.isActive) && (!S.q || ((l.label?.ar || "") + " " + (l.label?.en || "")).toLowerCase().includes(S.q.toLowerCase())));
  const st = (c, ic, k, n) => '<div class="stat ' + c + '"><div><small>' + t(k) + '</small><span class="stat__num">' + n + '</span></div><span class="stat__ic"><i class="bi ' + ic + '"></i></span></div>';
  const cards = list.map((l) => '<article class="card line ' + (l.isActive ? "" : "is-off") + '" data-id="' + esc(l.id) + '"><div class="line__img"><img src="' + esc(l.image) + '" alt="" loading="lazy"><span class="badge-st ' + (l.isActive ? "" : "off") + '">' + t(l.isActive ? "lines.shown" : "lines.off") + '</span></div><div class="line__body"><div class="line__top"><h3>' + esc(ln(l)) + '</h3>' +
    '<div class="dropdown"><button class="dots" data-bs-toggle="dropdown" aria-label="' + t("btn.more") + '" type="button"><i class="bi bi-three-dots-vertical"></i></button><ul class="dropdown-menu dropdown-menu-end"><li><button class="dropdown-item" data-act="preview" type="button">' + t("btn.preview") + '</button></li><li><button class="dropdown-item" data-act="toggle" type="button">' + t(l.isActive ? "btn.hide" : "btn.show") + '</button></li><li><button class="dropdown-item text-danger" data-act="del" type="button">' + t("btn.delete") + "</button></li></ul></div></div>" +
    '<p class="line__desc">' + esc(l.shortDesc?.[lang] || l.shortDesc?.en || "") + '</p><div class="line__meta"><span><i class="bi bi-cpu"></i>' + t("lines.count", { n: countOf(l.id) }) + "</span>" + (l.updatedAt ? '<span><i class="bi bi-activity"></i>' + rel(l.updatedAt) + "</span>" : "") + '</div>' +
    '<div class="line__acts"><button class="btn btn-soft" data-act="edit" type="button"><i class="bi bi-sliders"></i> ' + t("btn.edit") + '</button><button class="btn btn-pitex" data-act="manage" type="button"><i class="bi bi-layers"></i> ' + t("btn.manage") + "</button></div></div></article>").join("");
  if (keep && $("linesGrid")) { $("linesGrid").innerHTML = cards || '<div class="card empty" style="grid-column:1/-1">' + t("lines.nomatch") + "</div>"; return; }
  $("page").innerHTML = '<div class="head"><div><h1>' + t("lines.title") + "</h1><p>" + t("lines.sub") + '</p></div><div class="head__acts">' + (needImport() ? '<button id="importBtn" class="btn btn-soft" type="button"><i class="bi bi-cloud-arrow-up"></i> ' + t("btn.import") + "</button>" : "") + '<a class="btn btn-pitex" href="#/lines/new"><i class="bi bi-plus-lg"></i> ' + t("btn.addLine") + "</a></div></div>" +
    '<section class="stats">' + st("", "bi-grid-1x2", "lines.total", lines.length) + st("stat--ok", "bi-eye", "lines.visible", on) + st("stat--off", "bi-eye-slash", "lines.hidden", lines.length - on) + st("stat--m", "bi-gear-wide-connected", "lines.machines", machines.length) + "</section>" +
    '<div class="bar"><div class="tabs" role="tablist">' + ["all", "visible", "hidden"].map((k) => '<button type="button" role="tab" data-tab="' + k + '" class="' + (S.tab === k ? "is-on" : "") + '">' + t("tab." + k) + "</button>").join("") + "</div></div>" +
    (lines.length ? '<div id="linesGrid" class="lines">' + (cards || '<div class="card empty" style="grid-column:1/-1">' + t("lines.nomatch") + "</div>") + "</div>" : '<div class="card empty">' + t("lines.none") + "</div>");
}
$("page").addEventListener("click", async (e) => {
  const tab = e.target.closest("[data-tab]"); if (tab) { S.tab = tab.dataset.tab; return linesView(); }
  if (e.target.closest("#importBtn")) return importData();
  const b = e.target.closest("[data-act]"); if (!b) return;
  const card = b.closest(".line"), row = b.closest(".row-d");
  if (card) {
    const l = lines.find((x) => x.id === card.dataset.id); if (!l) return;
    if (b.dataset.act === "edit") go("#/lines/" + encodeURIComponent(l.id));
    if (b.dataset.act === "manage") { S.lineFilter = l.id; S.page = 1; go("#/machines"); }
    if (b.dataset.act === "preview") window.open("products.html?category=" + encodeURIComponent(l.id), "_blank", "noopener");
    if (b.dataset.act === "toggle") {
      try { await updateDoc(doc(db, LINES, l.id), { isActive: !l.isActive, updatedAt: serverTimestamp() }); toast(t(l.isActive ? "t.hidden" : "t.shown")); await load(); }
      catch (err) { toast(t("t.fail") + err.message, true); }
    }
    if (b.dataset.act === "del") {
      const n = countOf(l.id);
      if (n) return toast(t("c.hasMachines", { n }), true);
      ask(t("c.delLine"), t("c.delLineTx", { n: ln(l) }), async () => { await deleteDoc(doc(db, LINES, l.id)); });
    }
  }
  if (row) {
    const m = machines.find((x) => x.id === row.dataset.id); if (!m) return;
    if (b.dataset.act === "edit") go("#/machines/" + encodeURIComponent(m.id));
    if (b.dataset.act === "del") ask(t("c.delMachine"), t("c.delMachineTx", { n: mn(m) }), async () => { await deleteDoc(doc(db, MACHINES, m.id)); });
  }
});
function ask(title, text, fn) {
  $("cfTitle").textContent = title; $("cfText").textContent = text;
  const modal = confirmModal(), ok = $("cfOk"), fresh = ok.cloneNode(true); ok.replaceWith(fresh);
  fresh.textContent = t("btn.delete");
  fresh.addEventListener("click", async () => {
    fresh.disabled = true;
    try { await fn(); modal.hide(); toast(t("t.deleted")); await load(); }
    catch (err) { console.error(err); toast(t("t.fail") + err.message, true); modal.hide(); }
    finally { fresh.disabled = false; }
  });
  modal.show();
}

/* ===== Machines list (image + name, Edit / Delete only) ===== */
function machinesView(keep) {
  const cur = lines.find((l) => l.id === S.lineFilter);
  crumbs(cur ? [{ l: t("nav.machines"), h: "#/machines" }, { l: ln(cur) }] : [{ l: t("nav.machines") }]);
  let list = machines.filter((m) => (!S.lineFilter || m.category === S.lineFilter) && (!S.q || ((m.title?.ar || "") + " " + (m.title?.en || "")).toLowerCase().includes(S.q.toLowerCase())));
  if (S.sort === "az") list = [...list].sort((a, b) => mn(a).localeCompare(mn(b), lang));
  const pages = Math.max(1, Math.ceil(list.length / PAGE)); S.page = Math.min(S.page, pages);
  const slice = list.slice((S.page - 1) * PAGE, S.page * PAGE);
  const rows = slice.map((m) => { const img = (m.images && m.images[0]) || m.image || "";
    return '<div class="row-d" data-id="' + esc(m.id) + '"><div class="mc"><img src="' + esc(img) + '" alt="" loading="lazy"><strong>' + esc(mn(m)) + '</strong></div><div>' + esc(ln(lines.find((l) => l.id === m.category)) || m.category) + '</div><div><span class="pill ' + (m.isActive ? "" : "off") + '">' + t(m.isActive ? "lines.shown" : "lines.off") + '</span></div><div class="row-a"><button class="btn btn-soft btn-sm" data-act="edit" type="button"><i class="bi bi-pencil"></i> ' + t("btn.edit") + '</button><button class="btn btn-soft btn-sm text-danger" data-act="del" type="button"><i class="bi bi-trash3"></i> ' + t("btn.delete") + "</button></div></div>"; }).join("");
  const body = (list.length ? '<div class="row-h row-h2"></div>' : "");
  const table = list.length ? '<div class="row-h"><span>' + t("m.col") + "</span><span>" + t("m.line") + "</span><span>" + t("m.status") + "</span><span></span></div>" + rows +
    '<div class="pager"><span>' + t("m.showing", { a: (S.page - 1) * PAGE + 1, b: Math.min(S.page * PAGE, list.length), n: list.length }) + '</span><span><button data-pg="' + (S.page - 1) + '" ' + (S.page <= 1 ? "disabled" : "") + ' type="button">' + t("m.prev") + "</button>" + Array.from({ length: pages }, (_, i) => '<button data-pg="' + (i + 1) + '" class="' + (S.page === i + 1 ? "is-on" : "") + '" type="button">' + (i + 1) + "</button>").join("") + '<button data-pg="' + (S.page + 1) + '" ' + (S.page >= pages ? "disabled" : "") + ' type="button">' + t("m.next") + "</button></span></div>"
    : '<div class="empty">' + t(machines.length ? "m.nomatch" : "m.none") + "</div>";
  if (keep && $("mTable")) { $("mTable").innerHTML = table; return; }
  $("page").innerHTML = '<div class="head"><div><h1>' + (cur ? t("m.forLine", { line: esc(ln(cur)) }) : t("m.title")) + "</h1><p>" + t("m.sub") + '</p></div><div class="head__acts"><a class="btn btn-pitex" href="#/machines/new"><i class="bi bi-plus-lg"></i> ' + t("btn.addMachine") + "</a></div></div>" +
    '<div class="card tool"><label class="search"><i class="bi bi-search"></i><input id="mSearch" type="search" value="' + esc(S.q) + '" placeholder="' + t("search.machines") + '"></label><select id="mLineSel" class="form-select" aria-label="' + t("m.line") + '"><option value="">' + t("m.all") + "</option>" + lines.map((l) => '<option value="' + esc(l.id) + '"' + (l.id === S.lineFilter ? " selected" : "") + ">" + esc(ln(l)) + "</option>").join("") + '</select><button id="mSort" class="btn btn-soft ' + (S.sort === "az" ? "is-on" : "") + '" type="button" aria-pressed="' + (S.sort === "az") + '"><i class="bi bi-arrow-down-up"></i> ' + t("m.sort") + '</button></div><div id="mTable" class="card tbl">' + table + "</div>";
  $("mSearch").addEventListener("input", (e) => { syncSearch(e.target.value); machinesView(true); });
  $("mLineSel").addEventListener("change", (e) => { S.lineFilter = e.target.value; S.page = 1; machinesView(); });
  $("mSort").addEventListener("click", () => { S.sort = S.sort === "az" ? "order" : "az"; machinesView(); });
}
$("page").addEventListener("click", (e) => { const p = e.target.closest("[data-pg]"); if (p && !p.disabled) { S.page = +p.dataset.pg; machinesView(true); } });

/* ===== Machine form: name + image (+ line assignment), nothing else ===== */
function machineForm(id) {
  const m = id ? machines.find((x) => x.id === id) : null;
  crumbs([{ l: t("nav.machines"), h: "#/machines" }, { l: t(m ? "mf.edit" : "mf.add") }]);
  if (id && !m) return go("#/machines");
  const img = m ? (m.images && m.images[0]) || m.image || "" : "";
  const line = m?.category || S.lineFilter || lines[0]?.id || "";
  $("page").innerHTML = '<form id="mForm" novalidate><div class="head"><div><h1>' + t(m ? "mf.edit" : "mf.add") + '</h1></div></div><div class="grid2"><div class="card sec"><h2><i class="bi bi-sliders"></i>' + t("mf.core") + '</h2><div class="row g-3">' +
    '<div class="col-md-6"><label class="form-label" for="mEn">' + FL.en.mname + ' <span class="req">*</span></label><input id="mEn" class="form-control" dir="ltr" value="' + esc(m?.title?.en) + '" required><div class="fb" id="mEnE"></div></div>' +
    '<div class="col-md-6" dir="rtl"><label class="form-label" for="mAr">' + FL.ar.mname + ' <span class="req">*</span></label><input id="mAr" class="form-control" dir="rtl" value="' + esc(m?.title?.ar) + '" required><div class="fb" id="mArE"></div></div>' +
    '<div class="col-12"><label class="form-label" for="mLine">' + t("mf.line") + ' <span class="req">*</span></label><select id="mLine" class="form-select">' + lines.map((l) => '<option value="' + esc(l.id) + '"' + (l.id === line ? " selected" : "") + ">" + esc(ln(l)) + "</option>").join("") + '</select></div></div></div>' +
    '<div class="card sec"><h2><i class="bi bi-image"></i>' + t("mf.image") + "</h2>" + imageField(img) + '</div></div><div class="actbar"><a class="btn btn-soft" href="#/machines">' + t("btn.cancel") + '</a><button id="mSave" class="btn btn-pitex" type="submit"><i class="bi bi-save"></i> ' + t("btn.saveMachine") + "</button></div></form>";
  wireImage();
  $("mForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const en = $("mEn").value.trim(), ar = $("mAr").value.trim();
    $("mEnE").textContent = en ? "" : t("v.req"); $("mArE").textContent = ar ? "" : t("v.req");
    if (!en || !ar || !$("mLine").value) return;
    $("mSave").disabled = true; $("mSave").textContent = t("saving");
    try {
      const url = await resolveImage("machines");
      if (!url) { $("imgErr").textContent = t("img.req"); return; }
      const cat = lines.find((l) => l.id === $("mLine").value);
      const data = { title: { en, ar }, category: cat.id, categoryLabel: { en: cat.label.en, ar: (cat.label.ar || "").trim() }, alt: en, updatedAt: serverTimestamp() };
      if (m) { data.image = url; data.images = [url, ...(m.images || []).slice(1)]; await updateDoc(doc(db, MACHINES, m.id), data); } // keeps every other stored field
      else {
        let nid = slugify(en) || "machine-" + Date.now(); if (machines.some((x) => x.id === nid)) nid += "-" + Date.now().toString(36);
        Object.assign(data, { image: url, images: [url], isActive: true, featured: false, order: machines.reduce((x, y) => Math.max(x, y.order ?? 0), 0) + 1, createdAt: serverTimestamp() });
        await setDoc(doc(db, MACHINES, nid), data);
      }
      toast(t(m ? "t.saved" : "t.added")); S.lineFilter = cat.id; await load(); go("#/machines");
    } catch (err) { console.error(err); toast(err.message.startsWith(t("img.fail")) ? err.message : t("t.fail") + err.message, true); }
    finally { if ($("mSave")) { $("mSave").disabled = false; $("mSave").innerHTML = '<i class="bi bi-save"></i> ' + t("btn.saveMachine"); } }
  });
}

/* ===== Production line form ===== */
function lineForm(id) {
  const l = id ? lines.find((x) => x.id === id) : null;
  if (id && !l) return go("#/lines");
  crumbs([{ l: t("nav.lines"), h: "#/lines" }, { l: t(l ? "lf.edit" : "lf.add") }]);
  const f = (lg, pre) => { const dir = lg === "en" ? "ltr" : "rtl", v = (k) => esc(l?.[k]?.[lg] ?? (k === "label" && lg === "ar" ? "" : ""));
    return '<div class="card sec" dir="' + dir + '"><h2><i class="bi bi-translate"></i>' + FL[lg].title + '</h2><div class="mb-3"><label class="form-label" for="' + pre + 'N">' + FL[lg].name + ' <span class="req">*</span></label><input id="' + pre + 'N" class="form-control" dir="' + dir + '" value="' + esc((l?.label?.[lg] || "").trim()) + '"><div class="fb" id="' + pre + 'NE"></div></div>' +
      [["S", "shortDesc", FL[lg].s, 2], ["H", "heroDesc", FL[lg].h, 3], ["O", "overviewDesc", FL[lg].o, 4]].map(([k, key, lab, r]) => '<div class="mb-3"><label class="form-label" for="' + pre + k + '">' + t(lab) + '</label><textarea id="' + pre + k + '" class="form-control" rows="' + r + '" dir="' + dir + '">' + esc(l?.[key]?.[lg] || "") + "</textarea></div>").join("") + "</div>"; };
  $("page").innerHTML = '<form id="lForm" novalidate><div class="head"><div><h1>' + t(l ? "lf.edit" : "lf.add") + "</h1><p>" + t(l ? "lf.subEdit" : "lf.subAdd") + '</p></div></div><div class="grid2"><div>' + f("en", "e") + f("ar", "a") + '</div><div><div class="card sec"><h2><i class="bi bi-image"></i>' + t("lf.image") + "</h2>" + imageField(l?.image || "") + '</div><div class="card sec"><h2><i class="bi bi-eye"></i>' + t("lf.vis") + '</h2><div class="sw"><div><strong>' + t("lf.active") + "</strong><small>" + t("lf.activeSub") + '</small></div><div class="form-check form-switch m-0"><input id="lAct" class="form-check-input" type="checkbox" role="switch" aria-label="' + t("lf.active") + '" ' + (!l || l.isActive ? "checked" : "") + "></div></div></div></div></div>" +
    '<div class="actbar"><a class="btn btn-soft" href="#/lines"><i class="bi bi-x-lg"></i> ' + t("btn.cancel") + '</a><button id="lSave" class="btn btn-pitex" type="submit"><i class="bi bi-save"></i> ' + t("btn.save") + "</button></div></form>";
  wireImage();
  $("lForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (i) => $(i).value.trim(), en = v("eN"), ar = v("aN");
    $("eNE").textContent = en ? "" : t("v.req"); $("aNE").textContent = ar ? "" : t("v.req");
    if (!en || !ar) return;
    $("lSave").disabled = true; $("lSave").textContent = t("saving");
    try {
      const url = await resolveImage("productionLines");
      if (!url) { $("imgErr").textContent = t("img.req"); return; }
      const data = { label: { ar, en }, shortDesc: { ar: v("aS"), en: v("eS") }, heroDesc: { ar: v("aH"), en: v("eH") }, overviewDesc: { ar: v("aO"), en: v("eO") }, image: url, isActive: $("lAct").checked, updatedAt: serverTimestamp() };
      if (l) await updateDoc(doc(db, LINES, l.id), data);
      else {
        let nid = slugify(en) || "line-" + Date.now(); if (lines.some((x) => x.id === nid)) nid += "-" + Date.now().toString(36);
        Object.assign(data, { icon: "bi-diagram-3", alt: en, applications: [], advantages: [], badges: [], order: lines.reduce((x, y) => Math.max(x, y.order ?? 0), 0) + 1, createdAt: serverTimestamp() });
        await setDoc(doc(db, LINES, nid), data);
      }
      toast(t(l ? "t.saved" : "t.added")); await load(); go("#/lines");
    } catch (err) { console.error(err); toast(err.message.startsWith(t("img.fail")) ? err.message : t("t.fail") + err.message, true); }
    finally { if ($("lSave")) { $("lSave").disabled = false; $("lSave").innerHTML = '<i class="bi bi-save"></i> ' + t("btn.save"); } }
  });
}

/* ===== One-time import of the built-in site data (unchanged behaviour) ===== */
async function importData() {
  const sl = staticLines(), sm = staticMachines();
  if (!sl.length || !sm.length) return toast(t("t.fail") + "static data", true);
  if (!confirm(t("c.import", { l: sl.length, m: sm.length }) + (stray.length ? t("c.importStray", { s: stray.length }) : ""))) return;
  $("importBtn").disabled = true;
  try {
    const haveL = new Set(lines.map((x) => x.id)), haveM = new Set(machines.map((x) => x.id)), batch = writeBatch(db);
    stray.forEach((x) => batch.delete(doc(db, LINES, x.id)));
    sl.forEach((c, i) => { if (!haveL.has(c.slug)) batch.set(doc(db, LINES, c.slug), { ...clean(c), isActive: true, order: i + 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); });
    sm.forEach((p, i) => { if (!haveM.has(p.id)) batch.set(doc(db, MACHINES, p.id), { ...clean(p), isActive: true, order: i + 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); });
    await batch.commit(); toast(t("t.imported")); await load();
  } catch (err) { console.error(err); toast(t("t.fail") + err.message, true); }
}

setLang(lang);
