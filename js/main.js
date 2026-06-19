import { supabase } from "./supabase.js";
const SESSION_KEY = "ef_user_session";
const ADMIN_FERIA_FILTER_KEY = "ef_admin_feria_filter";
const APP_VERSION = "1.0.0";
const FERIA_TYPES = ["Feria Cientifica y Tecnologica", "Feria Expotecnica", "Festival Estudiantil de las Artes"];
const FESTIVAL_FERIA_NAME = "Festival Estudiantil de las Artes";
const FESTIVAL_CATEGORIES = ["Artes Visuales", "Artes Literarias", "Artes Digitales", "Artes Musicales", "Artes Escenicas"];
const FESTIVAL_SUBCATEGORIES = {
  "Artes Escenicas": [
    "COREOGRAFIA DE BAILE",
    "COREOGRAFIA CONCEPTUAL",
    "COREOGRAFIA DE PROYECCION FOLCLORICA COSTARRICENSE",
    "COREOGRAFIA FOLCLORICA INTERNACIONAL",
    "CUENTACUENTOS",
    "NARRACION O RELATO ORAL INDIGENA ORIGINAL",
    "NARRACION O RELATO INDIGENA DE TRADICION ANCESTRAL",
    "POESIA CORAL",
    "RETAHILA",
    "TEATRO DE MUNECOS O TITERES",
    "TEATRO DE NINOS Y NINAS",
    "TEATRO",
    "TEATRO DE NINOS Y NINAS INDIGENA",
    "TEATRO INDIGENA",
    "DANZA CULTURAL INDIGENA COSTARRICENSE",
    "DANZA CULTURAL INDIGENA INTERNACIONAL"
  ],
  "Artes Musicales": [
    "BANDA DE GARAJE",
    "CANCION ORIGINAL",
    "CANCION ORIGINAL DE NINOS Y NINAS",
    "CANCION POPULAR",
    "CANCION POPULAR DE NINOS Y NINAS",
    "CANCION TIPICA ORIGINAL COSTARRICENSE",
    "CANCION TIPICA POPULAR COSTARRICENSE",
    "CANTAUTOR/A",
    "CANTO INDIGENA ORIGINAL",
    "CANTO INDIGENA TRADICIONAL O ANCESTRAL",
    "CANTO INDIGENA ORIGINAL DE NINOS Y NINAS",
    "CANTO INDIGENA DE NINOS Y NINAS: TRADICIONAL O ANCESTRAL",
    "CIMARRONA",
    "CORO",
    "ENSAMBLE DE FLAUTAS DULCES",
    "ENSAMBLE INSTRUMENTAL CON MATERIALES RECICLABLES O REUTILIZABLES",
    "ESTUDIANTINA",
    "GRUPO INSTRUMENTAL EXPERIMENTAL",
    "GRUPO INSTRUMENTAL",
    "GRUPO MUSICAL CULTURAL INSTRUMENTAL INDIGENA",
    "GRUPO MUSICAL CULTURAL INDIGENA",
    "MARIMBA",
    "PERCUSION CORPORAL",
    "RAP"
  ],
  "Artes Digitales": [
    "ILUSTRACION DIGITAL",
    "MICRORRELATO ILUSTRADO DIGITAL",
    "MUSICA DIGITAL"
  ],
  "Artes Literarias": [
    "CANTO POETICO INDIGENA",
    "CUENTO",
    "CUENTO ILUSTRADO",
    "FOTONOVELA",
    "MICRORRELATO",
    "NOVELA GRAFICA",
    "POESIA",
    "POESIA INDIGENA"
  ],
  "Artes Visuales": [
    "COLLAGE",
    "DIBUJO",
    "DIBUJO OBJETO",
    "ESCULTURA",
    "ESCULTURAS VIVIENTES",
    "FOTOGRAFIA",
    "GRABADO",
    "MASCARA INDIGENA",
    "MASCARA O CARETA",
    "MASCARADA TRADICIONAL COSTARRICENSE",
    "MURAL",
    "PINTURA",
    "PINTURA CORPORAL",
    "PRODUCCION AUDIOVISUAL",
    "TENIDO TEXTIL",
    "DIBUJO INDIGENA",
    "ESCULTURA INDIGENA",
    "MURAL INDIGENA",
    "OBJETO CULTURAL INDIGENA",
    "PINTURA INDIGENA",
    "INSTALACION ARTISTICA"
  ]
};
const EXPOTECNICA_CATEGORIES = ["DESAFIO STEAM", "EMPRENDIMIENTO E INNOVACION"];
const EXPOTECNICA_EJES = [
  "PRODUCCION AGRICOLA Y PECUARIA",
  "INDUSTRIA ALIMENTARIA",
  "ENERGIAS RENOVABLES",
  "INGENIERIA AMBIENTAL",
  "MECATRONICA",
  "TECNOLOGIAS DE LA INFORMACION APLICADAS A LA INFORMATICA",
  "INGENIERIA MECANICA",
  "INGENIERIA DE MATERIALES",
  "INDUSTRIA CREATIVA",
  "CONTABILIDAD, FINANZAS Y BANCA",
  "SERVICIOS SECRETARIALES",
  "HOSTELERIA Y SERVICIOS TURISTICOS",
  "GESTION DE SUMINISTROS",
  "MERCADEO",
  "SEGURIDAD Y PROTECCION LABORAL"
];

function showToast(message, type = "info") {
  const existing = document.querySelector(".toast-container");
  if (!existing) {
    const container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.querySelector(".toast-container").appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showSkeleton(container, rows = 4) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    const div = document.createElement("div");
    div.className = "skeleton skeleton-row";
    container.appendChild(div);
  }
}

function showSkeletonCard(container) {
  if (!container) return;
  container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
}



function normalizeRoleName(roleName) {
  const normalized = String(roleName ?? "").trim().toLowerCase();

  if (normalized === "juez") {
    return "Juez";
  }

  if (normalized === "admin" || normalized === "administrador") {
    return "administrador";
  }

  return String(roleName ?? "").trim();
}

function setMessage(target, text, kind = "info") {
  if (!target) {
    return;
  }

  target.textContent = text;
  target.dataset.kind = kind;
}

function isMissingColumnError(error, columnPrefix) {
  const message = String(error?.message ?? "").toLowerCase();
  const missingColumnSignals = [
    "does not exist",
    "could not find",
    "schema cache"
  ];

  return missingColumnSignals.some((signal) => message.includes(signal)) && message.includes(columnPrefix.toLowerCase());
}

function updateProjectFormFieldsByFeria(projectForm) {
  if (!projectForm) {
    return;
  }

  const feriaInput = projectForm.querySelector('input[name="tipo_feria"]');
  const sections = projectForm.querySelectorAll("[data-feria-section]");
  const selectedFeria = String(feriaInput?.value ?? "");

  sections.forEach((section) => {
    const sectionFeria = String(section.dataset.feriaSection ?? "");
    const isActive = sectionFeria === selectedFeria;
    section.hidden = !isActive;
  });

  const isFestival = selectedFeria === FESTIVAL_FERIA_NAME;
  const isExpotecnica = selectedFeria === "Feria Expotecnica";

  const festivalCategorySelect = projectForm.querySelector('select[name="categoria_festival"]');
  const festivalSubcategorySelect = projectForm.querySelector('select[name="subcategoria_festival"]');
  const festivalCategoryValue = String(festivalCategorySelect?.value ?? "");
  const hasFestivalCategory = isFestival && FESTIVAL_CATEGORIES.includes(festivalCategoryValue);

  if (isFestival) {
    if (festivalSubcategorySelect) {
      const subcategories = FESTIVAL_SUBCATEGORIES[festivalCategoryValue] ?? [];
      const previousValue = String(festivalSubcategorySelect.value ?? "");

      festivalSubcategorySelect.innerHTML = [
        '<option value="">Selecciona una subcategoria</option>',
        ...subcategories.map((item) => `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`)
      ].join("");

      if (subcategories.includes(previousValue)) {
        festivalSubcategorySelect.value = previousValue;
      } else {
        festivalSubcategorySelect.value = "";
      }
    }

    const festivalSubcategoryWrap = projectForm.querySelector("[data-festival-subcategory-wrap]");
    if (festivalSubcategoryWrap) {
      festivalSubcategoryWrap.hidden = !hasFestivalCategory;
    }
    if (festivalCategorySelect) {
      festivalCategorySelect.required = true;
    }
    if (festivalSubcategorySelect) {
      festivalSubcategorySelect.required = hasFestivalCategory;
      if (!hasFestivalCategory) {
        festivalSubcategorySelect.value = "";
      }
    }
  } else {
    if (festivalCategorySelect) {
      festivalCategorySelect.required = false;
      festivalCategorySelect.value = "";
    }
    if (festivalSubcategorySelect) {
      festivalSubcategorySelect.required = false;
      festivalSubcategorySelect.value = "";
    }
  }

  const expotecnicaCategorySelect = projectForm.querySelector('select[name="categoria_expotecnica"]');
  const expotecnicaEjeSelect = projectForm.querySelector('select[name="eje_tematico"]');
  const expoCategoryValue = String(expotecnicaCategorySelect?.value ?? "");
  const hasExpoCategory = isExpotecnica && EXPOTECNICA_CATEGORIES.includes(expoCategoryValue);

  if (isExpotecnica) {
    if (expotecnicaCategorySelect) {
      expotecnicaCategorySelect.required = true;
    }
    const expotecnicaEjeWrap = projectForm.querySelector("[data-expotecnica-eje-wrap]");
    if (expotecnicaEjeWrap) {
      expotecnicaEjeWrap.hidden = !hasExpoCategory;
    }
    if (expotecnicaEjeSelect) {
      expotecnicaEjeSelect.required = hasExpoCategory;
      if (!hasExpoCategory) {
        expotecnicaEjeSelect.value = "";
      }
    }
  } else {
    if (expotecnicaCategorySelect) {
      expotecnicaCategorySelect.required = false;
      expotecnicaCategorySelect.value = "";
    }
    if (expotecnicaEjeSelect) {
      expotecnicaEjeSelect.required = false;
      expotecnicaEjeSelect.value = "";
    }
  }
}

function fillSelect(select, items, placeholder, valueKey = "id", labelKey = "nombre") {
  if (!select) {
    return;
  }

  select.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = placeholder;
  select.appendChild(firstOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item[valueKey]);
    option.textContent = String(item[labelKey]);
    select.appendChild(option);
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ADMIN_FERIA_FILTER_KEY);
}

function getAdminFeriaFilter(defaultValue = "") {
  try {
    return sessionStorage.getItem(ADMIN_FERIA_FILTER_KEY) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveAdminFeriaFilter(value) {
  sessionStorage.setItem(ADMIN_FERIA_FILTER_KEY, String(value ?? ""));
}

function setupHamburgerMenu() {
  const hamburger = document.querySelector("[data-hamburger]");
  const header = document.querySelector("header");
  if (!hamburger || !header) return;

  hamburger.addEventListener("click", () => {
    header.classList.toggle("nav-open");
    document.body.classList.toggle("nav-open");
  });

  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) {
      header.classList.remove("nav-open");
      document.body.classList.remove("nav-open");
    }
  });

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      document.body.classList.remove("nav-open");
    });
  });
}

function setupHideOnScroll() {
  const header = document.querySelector("header");
  if (!header) return;
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const current = window.scrollY;
    if (current > lastScroll && current > 60) {
      header.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
    }
    lastScroll = current;
  }, { passive: true });
}

function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function bindLogout() {
  const link = document.querySelector("[data-logout-link]");

  if (!link) {
    return;
  }

  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const user = getSession();

    if (user && normalizeRoleName(user.role) === "Juez") {
      showLogoutModal(user);
    } else {
      clearSession();
      window.location.href = "index.html";
    }
  });
}

let jspdfPromise = null;
function loadJSPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve();
  if (jspdfPromise) return jspdfPromise;
  jspdfPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => { if (window.jspdf?.jsPDF) resolve(); else reject(new Error("jsPDF not found after load")); };
    s.onerror = () => reject(new Error("Failed to load jspdf library"));
    document.head.appendChild(s);
  });
  return jspdfPromise;
}

function showLogoutModal(user) {
  const existing = document.getElementById("logout-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "logout-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      </div>
      <h3 class="modal-title">Cerrar sesion</h3>
      <p class="modal-desc">Descarga tu reporte de evaluaciones antes de salir o cierra sesion directamente.</p>
      <div class="modal-actions">
        <button class="btn-modal btn-modal-pdf" id="modal-download-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
          Descargar PDF
        </button>
        <button class="btn-modal btn-modal-danger" id="modal-logout-btn">Salir sin descargar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById("modal-logout-btn").addEventListener("click", () => {
    overlay.remove();
    clearSession();
    window.location.href = "index.html";
  });

  document.getElementById("modal-download-btn").addEventListener("click", async () => {
    const btn = document.getElementById("modal-download-btn");
    btn.disabled = true;
    btn.textContent = "Verificando...";

    const { data: evalCheck } = await supabase
      .from("evaluaciones_proyectos")
      .select("id")
      .eq("juez_id", user.id)
      .limit(1);

    if (!evalCheck || evalCheck.length === 0) {
      showToast("No tienes evaluaciones guardadas para exportar. Cierra sesion sin descargar.", "info");
      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg> Descargar PDF';
      return;
    }

    btn.textContent = "Generando PDF...";
    try {
      await generateJudgePDF(user);
    } catch (e) {
      console.error("Error generating PDF:", e);
      showToast("No se pudo generar el PDF. Revisa la conexion e intenta de nuevo.", "error");
      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg> Descargar PDF';
      return;
    }
    overlay.remove();
    clearSession();
    window.location.href = "index.html";
  });
}



async function generateJudgePDF(user) {
  await loadJSPDF();
  const { data, error } = await supabase
    .from("evaluaciones_proyectos")
    .select("proyecto_id, criterio, nota, proyectos_ferias(titulo)")
    .eq("juez_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data || !data.length) {
    showToast("No tienes evaluaciones guardadas para exportar.", "info");
    return;
  }

  const grouped = new Map();
  data.forEach((item) => {
    const titulo = item.proyectos_ferias?.titulo || "Proyecto";
    if (!grouped.has(titulo)) {
      grouped.set(titulo, { items: [], total: 0 });
    }
    const g = grouped.get(titulo);
    g.items.push(item);
    g.total += Number(item.nota || 0);
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 15;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ministerio de Educacion Publica", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Direccion Regional de Educacion Central del Pacifico", margin, y);
  y += 4;
  doc.text("Sistema de Evaluacion de Ferias Institucionales", margin, y);
  y += 7;

  doc.setDrawColor(13, 42, 91);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Reporte de Evaluaciones del Juez", margin, y);
  y += 10;

  const now = new Date();
  const infoLines = [
    `Juez: ${user.nombre}`,
    `Fecha: ${now.toLocaleDateString("es-CR")}`,
    `Hora: ${now.toLocaleTimeString("es-CR")}`,
    user.tipo_feria ? `Feria: ${user.tipo_feria}` : ""
  ].filter(Boolean);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  const boxX = margin;
  const boxY = y;
  const boxW = pageW - 2 * margin;
  const boxH = infoLines.length * 6 + 6;
  doc.setDrawColor(199, 154, 46);
  doc.setFillColor(255, 252, 240);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");
  doc.setTextColor(13, 42, 91);
  infoLines.forEach((line, i) => {
    doc.text(line, margin + 4, boxY + 5 + i * 6);
  });
  doc.setTextColor(0, 0, 0);
  y = boxY + boxH + 12;

  let grandTotal = 0;
  const pageLimit = 270;
  const col1X = margin;
  const col3X = margin + 120;

  for (const [titulo, g] of grouped) {
    if (y > pageLimit - 22) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(13, 42, 91);
    doc.setDrawColor(13, 42, 91);
    doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(titulo, margin + 2, y + 5.5);
    y += 11;

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Criterio de evaluacion", col1X, y);
    doc.text("Nota", col3X, y);
    y += 4;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    for (const item of g.items) {
      if (y > pageLimit - 8) {
        doc.addPage();
        y = margin;
      }
      doc.text(item.criterio, col1X, y);
      doc.text(String(item.nota), col3X, y);
      y += 6;
    }

    y += 2;
    doc.setDrawColor(199, 154, 46);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(13, 42, 91);
    doc.text("Total del proyecto:", col1X, y);
    doc.text(String(g.total), col3X, y);
    y += 10;
    grandTotal += g.total;
  }

  y += 4;
  if (y > pageLimit - 15) {
    doc.addPage();
    y = margin;
  }
  doc.setDrawColor(13, 42, 91);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(13, 42, 91);
  doc.text("PUNTAJE TOTAL GENERAL", margin, y);
  doc.text(`${grandTotal} puntos`, pageW - margin - 20, y, { align: "right" });
  y += 10;

  const footerY = doc.internal.pageSize.height - 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento generado el ${now.toLocaleDateString("es-CR")} a las ${now.toLocaleTimeString("es-CR")} | Sistema de Evaluacion de Ferias`,
    margin,
    footerY
  );

  doc.save(`evaluaciones_${user.nombre}.pdf`);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

async function passwordMatches(inputPassword, storedPassword) {
  const normalizedStoredPassword = String(storedPassword ?? "").trim();

  if (inputPassword === normalizedStoredPassword || inputPassword.trim() === normalizedStoredPassword) {
    return true;
  }

  try {
    const hashedInputPassword = await hashPassword(inputPassword);
    return hashedInputPassword === normalizedStoredPassword;
  } catch {
    return false;
  }
}

async function loadProjects(feriaType = "") {
  const withMembers = await supabase
    .from("proyectos_ferias")
    .select("id, titulo, descripcion, tipo_feria, integrante_1, integrante_2, integrante_3, categoria_festival, subcategoria_festival, participacion, categoria_expotecnica, eje_tematico")
    .order("titulo", { ascending: true });

  let projects = [];

  if (withMembers.error) {
    const needsFallback =
      isMissingColumnError(withMembers.error, "integrante_") ||
      isMissingColumnError(withMembers.error, "tipo_feria") ||
      isMissingColumnError(withMembers.error, "categoria_festival") ||
      isMissingColumnError(withMembers.error, "subcategoria_festival") ||
      isMissingColumnError(withMembers.error, "participacion") ||
      isMissingColumnError(withMembers.error, "categoria_expotecnica") ||
      isMissingColumnError(withMembers.error, "eje_tematico");

    if (!needsFallback) {
      throw withMembers.error;
    }

    const withFeriaOnly = await supabase
      .from("proyectos_ferias")
      .select("id, titulo, tipo_feria")
      .order("titulo", { ascending: true });

    if (!withFeriaOnly.error) {
      projects = (withFeriaOnly.data ?? []).map((item) => ({
        ...item,
        integrante_1: null,
        integrante_2: null,
        integrante_3: null,
        categoria_festival: null,
        subcategoria_festival: null,
        participacion: null,
        categoria_expotecnica: null,
        eje_tematico: null
      }));
    } else {
      const fallback = await supabase.from("proyectos_ferias").select("id, titulo").order("titulo", { ascending: true });

      if (fallback.error) {
        throw fallback.error;
      }

      projects = (fallback.data ?? []).map((item) => ({
        ...item,
        tipo_feria: null,
        integrante_1: null,
        integrante_2: null,
        integrante_3: null,
        categoria_festival: null,
        subcategoria_festival: null,
        participacion: null,
        categoria_expotecnica: null,
        eje_tematico: null
      }));
    }
  } else {
    projects = withMembers.data ?? [];
  }

  if (!feriaType) {
    return projects;
  }

  return projects.filter((item) => String(item.tipo_feria ?? "") === feriaType);
}

async function loadJudges(feriaType = "") {
  const [{ data: users, error: usersError }, { data: roles, error: rolesError }] = await Promise.all([
    supabase.from("usuarios").select("id, nombre, role_id, tipo_feria").order("nombre", { ascending: true }),
    supabase.from("roles").select("id, nombre")
  ]);

  if (usersError) {
    throw usersError;
  }

  if (rolesError) {
    throw rolesError;
  }

  const roleNamesById = new Map((roles ?? []).map((role) => [role.id, normalizeRoleName(role.nombre)]));

  return (users ?? []).filter((item) => {
    const isJudge = roleNamesById.get(item.role_id) === "Juez";
    const feriaMatches = !feriaType || String(item.tipo_feria ?? "") === feriaType;
    return isJudge && feriaMatches;
  });
}

async function loadJudgeAssignments() {
  const { data, error } = await supabase
    .from("asignaciones_jueces")
    .select("juez_id, proyecto_id")
    .order("juez_id", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadAssignedProjectsForJudge(judgeId) {
  const { data: assignments, error: assignmentsError } = await supabase
    .from("asignaciones_jueces")
    .select("proyecto_id")
    .eq("juez_id", judgeId);

  if (assignmentsError) {
    throw assignmentsError;
  }

  const projectIds = [...new Set((assignments ?? []).map((item) => item.proyecto_id).filter(Boolean))];

  if (projectIds.length === 0) {
    return [];
  }

  const { data: projects, error: projectsError } = await supabase
    .from("proyectos_ferias")
    .select("id, titulo, tipo_feria, categoria_festival, subcategoria_festival, categoria_expotecnica, eje_tematico")
    .in("id", projectIds)
    .order("titulo", { ascending: true });

  if (projectsError) {
    if (!isMissingColumnError(projectsError, "categoria_festival") &&
        !isMissingColumnError(projectsError, "subcategoria_festival") &&
        !isMissingColumnError(projectsError, "categoria_expotecnica") &&
        !isMissingColumnError(projectsError, "eje_tematico")) {
      throw projectsError;
    }

      const fallback = await supabase
      .from("proyectos_ferias")
      .select("id, titulo, tipo_feria")
      .in("id", projectIds)
      .order("titulo", { ascending: true });

    if (fallback.error) {
      throw fallback.error;
    }

    return (fallback.data ?? []).map((item) => ({
      ...item,
      categoria_festival: null,
      subcategoria_festival: null,
      categoria_expotecnica: null,
      eje_tematico: null
    }));
  }

  return projects ?? [];
}

async function loadUsers() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, role_id, tipo_feria")
    .order("nombre", { ascending: true });

  if (error) {
    // Backward compatibility when DB migration for tipo_feria has not been executed yet.
    if (isMissingColumnError(error, "tipo_feria")) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("usuarios")
        .select("id, nombre, role_id")
        .order("nombre", { ascending: true });

      if (fallbackError) {
        throw fallbackError;
      }

      return (fallbackData ?? []).map((item) => ({
        ...item,
        tipo_feria: null
      }));
    }

    throw error;
  }

  return data ?? [];
}

function filterByFeria(items, feriaType) {
  if (!feriaType) {
    return items;
  }

  return (items ?? []).filter((item) => String(item.tipo_feria ?? "") === feriaType);
}

async function loadUserForLogin(username) {
  const tryWithFeria = await supabase
    .from("usuarios")
    .select("id, nombre, contrasena_hash, role_id, tipo_feria")
    .ilike("nombre", username)
    .maybeSingle();

  if (!tryWithFeria.error) {
    return tryWithFeria;
  }

  if (!isMissingColumnError(tryWithFeria.error, "tipo_feria")) {
    return tryWithFeria;
  }

  const fallback = await supabase
    .from("usuarios")
    .select("id, nombre, contrasena_hash, role_id")
    .ilike("nombre", username)
    .maybeSingle();

  if (fallback.data) {
    return {
      data: {
        ...fallback.data,
        tipo_feria: null
      },
      error: fallback.error
    };
  }

  return fallback;
}

function renderUsersTable(users, roles) {
  const tbody = document.querySelector("[data-users-table]");
  const status = document.querySelector("[data-users-table-status]");

  if (!tbody) {
    return;
  }

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay usuarios registrados.</td></tr>';
    setMessage(status, "", "info");
    return;
  }

  const roleNamesById = new Map((roles ?? []).map((role) => [role.id, normalizeRoleName(role.nombre)]));

  tbody.innerHTML = users
    .map((item) => {
      const roleName = roleNamesById.get(item.role_id) ?? "Sin rol";
      const roleClass = roleName === "administrador" ? "role-badge role-admin" : roleName === "Juez" ? "role-badge role-judge" : "role-badge";
      return `<tr>
        <td>${escapeHTML(item.nombre)}</td>
        <td><span class="${roleClass}">${escapeHTML(roleName)}</span></td>
        <td>${escapeHTML(item.tipo_feria ?? "-")}</td>
        <td>
          <button class="table-action-btn edit-user-btn" data-edit-user='${JSON.stringify({ id: item.id, nombre: item.nombre, role_id: item.role_id, tipo_feria: item.tipo_feria })}'>Editar</button>
          <button class="table-action-btn delete-user-btn" data-delete-user-id="${item.id}">Eliminar</button>
        </td>
      </tr>`;
    })
    .join("");

  setMessage(status, "Usuarios cargados.", "success");
}

function renderProjectsManagementTable(projects) {
  const tbody = document.querySelector("[data-projects-table]");
  const status = document.querySelector("[data-projects-table-status]");

  if (!tbody) {
    return;
  }

  if (!projects.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay proyectos registrados para esta feria.</td></tr>';
    setMessage(status, "", "info");
    return;
  }

  tbody.innerHTML = projects
    .map(
      (item) => {
        const feriaType = String(item.tipo_feria ?? "");
        const isFestival = feriaType === FESTIVAL_FERIA_NAME;
        const isExpotecnica = feriaType === "Feria Expotecnica";
        let detailText = "-";

        if (isFestival) {
          const parts = [];
          const category = String(item.categoria_festival ?? "").trim();
          const subcategory = String(item.subcategoria_festival ?? "").trim();
          const participation = String(item.participacion ?? "").trim();

          if (category) {
            parts.push(`Categoria: ${category}`);
          }

          if (subcategory) {
            parts.push(`Subcategoria: ${subcategory}`);
          }

          if (participation) {
            parts.push(`Participacion: ${participation}`);
          }

          detailText = parts.length ? parts.join(" | ") : "-";
        } else if (isExpotecnica) {
          const parts = [];
          const category = String(item.categoria_expotecnica ?? "").trim();
          const eje = String(item.eje_tematico ?? "").trim();

          if (category) {
            parts.push(`Categoria: ${category}`);
          }

          if (eje) {
            parts.push(`Eje: ${eje}`);
          }

          detailText = parts.length ? parts.join(" | ") : "-";
        } else {
          const integrantes = [item.integrante_1, item.integrante_2, item.integrante_3]
            .map((name) => String(name ?? "").trim())
            .filter(Boolean);
          detailText = integrantes.length ? integrantes.join(" | ") : "-";
        }

        return `
        <tr>
          <td>${escapeHTML(item.titulo)}</td>
          <td>${escapeHTML(item.tipo_feria ?? "-")}</td>
          <td>${escapeHTML(detailText)}</td>
          <td>${item.id}</td>
          <td>
            <button class="table-action-btn delete-project-btn" data-delete-project-id="${item.id}">Eliminar</button>
          </td>
        </tr>
      `;
      }
    )
    .join("");

  setMessage(status, "Proyectos cargados.", "success");
}

function getAllowedRolesForUserForm(roles) {
  const roleList = roles ?? [];
  const judgeRole = roleList.find((role) => normalizeRoleName(role.nombre) === "Juez") ?? null;
  const adminRole = roleList.find((role) => normalizeRoleName(role.nombre) === "administrador") ?? null;
  const allowed = [];

  if (adminRole) {
    allowed.push({
      id: adminRole.id,
      nombre: "Admin"
    });
  }

  if (judgeRole) {
    allowed.push({
      id: judgeRole.id,
      nombre: "Juez"
    });
  }

  return allowed;
}

function getRubricIndicatorsByFeria(feriaType) {
  if (feriaType === "Feria Expotecnica") {
    return [
      "Planteamiento y justificacion del proyecto",
      "Metodologia aplicada",
      "Calidad tecnica y funcionalidad",
      "Presentacion y comunicacion",
      "Viabilidad e impacto"
    ];
  }

  if (feriaType === "Festival Estudiantil de las Artes") {
    return [
      "Creatividad e originalidad",
      "Calidad artistica y tecnica",
      "Expresion y comunicacion",
      "Puesta en escena y presentacion"
    ];
  }

  return [
    "Dominio del tema cientifico",
    "Metodologia e investigacion",
    "Innovacion del proyecto",
    "Presentacion y comunicacion"
  ];
}

function getExpotecnicaRubricByCategory(category) {
  if (category === "DESAFIO STEAM") {
    return {
      title: "ExpoTEC-7 - Exposicion del proyecto Desafio STEAM (111 pts)",
      sections: [
        {
          title: "I. Identificacion y formulacion del problema",
          indicators: [
            "a. Define el problema de forma precisa.",
            "b. Plantea alternativas de solucion con conceptos teorico-practicos atinentes.",
            "c. Propone objetivos vinculados a la busqueda de soluciones.",
            "d. Evidencia el impacto social, cientifico o tecnologico a corto y largo plazo.",
            "e. Demuestra capacidad para expresar ideas con seguridad y defender el proyecto."
          ]
        },
        {
          title: "II. Elaboracion del proyecto",
          indicators: [
            "a. Demuestra una linea de investigacion y desarrollo coherente y clara.",
            "b. Argumenta el analisis e interpretacion de datos recopilados.",
            "c. Evidencia gestion de recursos y busqueda de apoyo.",
            "d. Demuestra originalidad y autoria propia.",
            "e. Aplica la normativa vigente.",
            "f. Se evidencia la factibilidad e implementacion comercial o industrial a futuro."
          ]
        },
        {
          title: "III. Prototipo",
          indicators: [
            "a. Presenta una linea de trabajo coherente y clara.",
            "b. Da respuesta a la necesidad u objetivos planteados.",
            "c. Evidencia uso optimo de los recursos disponibles.",
            "d. Demuestra precision tecnica en elaboracion y funcionamiento (aplicando correctamente conocimientos cientificos y tecnologicos).",
            "e. Respeta las normativas de seguridad vigentes.",
            "f. Muestra actualidad tecnologica en el campo de trabajo.",
            "g. Evidencia el funcionamiento correcto segun la solucion planteada.",
            "h. Demuestra creatividad e innovacion en ideas nuevas o mejoradas."
          ]
        },
        {
          title: "IV. Exposicion del proyecto",
          indicators: [
            "a. Evidencia apropiacion y dominio del tema.",
            "b. Demuestra claridad y coherencia en la exposicion ante el panel de jueces.",
            "c. Utiliza lenguaje tecnico acorde con el nivel academico y el campo.",
            "d. Argumenta de forma solida y fundamentada la propuesta.",
            "e. Emplea recursos afines (disenos, diagramas, graficos, esquemas, modelos, programas, equipos).",
            "f. Describe la metodologia para implementacion, evaluacion y perfeccionamiento de la solucion.",
            "g. Presenta resultados consistentes con los objetivos y la solucion al problema.",
            "h. Brinda conclusiones precisas y objetivas basadas en los resultados.",
            "i. Denota colaboracion y comunicacion efectiva del equipo.",
            "j. Demuestra capacidad de recibir, analizar y aplicar sugerencias de mejora."
          ]
        },
        {
          title: "V. Documentacion del proyecto - Informe escrito",
          indicators: [
            "a. Congruencia entre lo expuesto y el informe escrito.",
            "b. Uso de lenguaje tecnico afin al tema.",
            "c. Estipula los procedimientos tecnicos utilizados."
          ]
        },
        {
          title: "V. Documentacion del proyecto - Bitacora",
          indicators: [
            "a. investigacion.",
            "b. implementacion.",
            "c. experimentacion."
          ]
        },
        {
          title: "V. Documentacion del proyecto - Cartel/recursos audiovisuales",
          indicators: [
            "a. Contiene informacion relevante para la exposicion.",
            "b. Utiliza el cartel como recurso de apoyo para el desarrollo de la exposicion."
          ]
        }
      ]
    };
  }

  if (category === "EMPRENDIMIENTO E INNOVACION") {
    return {
      title: "ExpoTEC-8/9 - Exposicion del Modelo/Plan de Negocios",
      sections: [
        {
          title: "Indicadores de evaluacion",
          indicators: [
            "a. Define de forma precisa la operacion basica de la potencial empresa.",
            "b. Plantea las alternativas de solucion que la empresa brindara al problema o necesidad.",
            "c. Describe los productos o servicios que brindan valor a los clientes.",
            "d. Evidencia el impacto de la potencial empresa desde diversos ambitos, a corto y largo plazo.",
            "e. Argumenta las diferencias con la competencia.",
            "f. Demuestra entendimiento del mercado, la competencia y aspectos financieros.",
            "g. Argumenta con solidez que hace unico al negocio y por que es una buena oportunidad.",
            "h. Demuestra gestion de recursos de forma sostenible y responsable.",
            "i. Demuestra claridad y coherencia en la exposicion ante el panel de jueces.",
            "j. Utiliza lenguaje tecnico acorde con el nivel academico y el campo del negocio.",
            "k. Evidencia capacidad de comunicacion oral y dominio de la propuesta de valor.",
            "l. Define los canales para hacer llegar la propuesta de valor a los clientes.",
            "m. Caracteriza el segmento de clientes (necesidades, comportamientos, atributos).",
            "n. Expone una propuesta innovadora y creativa con respecto al mercado.",
            "o. Describe las demandas del segmento y el seguimiento para asegurar calidad de bienes/servicios.",
            "p. Expone las fuentes de ingresos y estructura de costos.",
            "q. Describe las alianzas estrategicas de su propuesta de valor."
          ]
        }
      ]
    };
  }

  return {
    title: "Evaluacion general - ExpoTECNICA",
    sections: [{ title: "Criterios generales", indicators: getRubricIndicatorsByFeria("Feria Expotecnica") }]
  };
}

function getFestivalAdvancedScoreOptions() {
  return [
    { value: 3, label: "3 Avanzado" },
    { value: 2, label: "2 Basico" },
    { value: 1, label: "1 Intermedio" }
  ];
}

function getFestivalRubricBySubcategory(subcategory) {
  const normalizedSubcategory = String(subcategory ?? "").trim();

  const rubricBySubcategory = {
    "COREOGRAFIA DE BAILE": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
      "La coreografia y los temas musicales respetan la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes acorde con los objetivos, la Normativa y el Manual.",
      "La coreografia es original.",
      "Respeta la cantidad de integrantes: minimo de 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Participan unicamente estudiantes en escena.",
      "Dominio tecnico y expresivo del movimiento.",
      "Coherencia estetica, creatividad y relacion con el concepto."
    ],
    "COREOGRAFIA CONCEPTUAL": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "La coreografia se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El contenido, mensaje general y temas musicales respetan la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "La obra artistica incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes.",
      "La coreografia es original y desarrolla una historia, tema o idea clara con secuencias logicas.",
      "Respeta la cantidad de integrantes: minimo de 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Participan unicamente estudiantes en escena.",
      "Desarrollo conceptual y narrativo en la coreografia.",
      "Coherencia tecnico-artistica y estetica del concepto escenico."
    ],
    "COREOGRAFIA DE PROYECCION FOLCLORICA COSTARRICENSE": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
      "La coreografia y los temas musicales respetan la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes.",
      "Respeta la cantidad de integrantes: minimo 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Transmite ideas, sensaciones o conceptos que reflejan el folclor, las tradiciones y costumbres costarricenses.",
      "Representa o desarrolla una historia o anecdota tradicional, tipica o de costumbres costarricenses.",
      "Participan unicamente estudiantes en escena.",
      "Uso de ritmos y elementos coreograficos.",
      "Aspectos tecnico-artisticos, coherencia estetica y proyeccion escenica."
    ],
    "COREOGRAFIA FOLCLORICA INTERNACIONAL": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
      "La coreografia y los temas musicales respetan la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes.",
      "Respeta la cantidad de integrantes: minimo de 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Transmite ideas, sensaciones o conceptos que reflejan el folclor, las tradiciones y costumbres del pais que representa.",
      "Representa o desarrolla una historia o anecdota tradicional, tipica o de costumbres del pais que proyecta.",
      "Presenta pasos, figuras, niveles, formas y vestuarios acordes con la musica que baila.",
      "Participan unicamente estudiantes en escena.",
      "Aspectos tecnico-artisticos, coherencia estetica y proyeccion escenica."
    ],
    "CUENTACUENTOS": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta en su totalidad la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje de la obra artistica incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "El cuento u obra es original.",
      "Respeta la cantidad de integrantes: 1 estudiante.",
      "Respeta la duracion maxima de 5 minutos.",
      "Expresion oral: diccion y proyeccion vocal.",
      "Expresion corporal: postura, movimientos y desplazamiento.",
      "Entonacion.",
      "Uso del espacio escenico.",
      "Interpretacion.",
      "Sentido de la verdad.",
      "Aspectos tecnico-artisticos, estetica y proyeccion escenica intercultural."
    ],
    "NARRACION O RELATO ORAL INDIGENA ORIGINAL": [
      "La propuesta se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta en su totalidad la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje de la obra artistica incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica de docentes, autoridades tradicionales y personas gestoras culturales.",
      "La narracion o relato oral indigena es original.",
      "Respeta la cantidad de integrantes: 1 estudiante.",
      "Respeta la duracion maxima de 5 minutos.",
      "Oralidad, voz y transmision del relato.",
      "Expresion general.",
      "Dinamica de la voz.",
      "Uso del espacio y simbolos.",
      "Apropiacion, sentido cultural y memoria.",
      "Presentacion."
    ],
    "NARRACION O RELATO INDIGENA DE TRADICION ANCESTRAL": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta en su totalidad la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje de la obra artistica incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La narracion o relato indigena es tradicional o ancestral.",
      "Respeta la cantidad de integrantes: 1 estudiante.",
      "Respeta la duracion maxima de 5 minutos.",
      "Oralidad, voz y transmision del relato.",
      "Expresion general.",
      "Dinamica de la voz.",
      "Uso del espacio y simbolos.",
      "Interpretacion.",
      "Apropiacion, sentido cultural y memoria."
    ],
    "POESIA CORAL": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La poesia coral es original.",
      "Respeta la cantidad de integrantes: minimo tres estudiantes.",
      "Respeta la duracion maxima de 5 minutos.",
      "Participan unicamente estudiantes en escena.",
      "Uso de figuras literarias.",
      "Utilizacion de figuras de construccion.",
      "Unidad de sentido o motivo lirico.",
      "Ritmo, musicalidad y desempeno grupal.",
      "Emotividad.",
      "Expresion oral.",
      "Expresion corporal.",
      "Relacion de la puesta en escena con la poesia.",
      "La poesia coral carece de rima."
    ],
    "RETAHILA": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La retahila es original.",
      "Respeta la cantidad de integrantes: 1 estudiante.",
      "Si el texto es presentado a mano utiliza letra legible; si es impreso, preferiblemente letra 12 Times New Roman.",
      "Uso de palabras autoctonas o adecuadas a la disciplina.",
      "Uso de figuras de construccion y de sentido.",
      "Tematica alusiva al festival.",
      "Concatenacion de ideas.",
      "Desempeno escenico.",
      "Originalidad.",
      "Musicalidad.",
      "Diccion."
    ],
    "TEATRO DE MUNECOS O TITERES": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad humana, diversidad, derechos humanos y equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La obra de teatro de titeres o munecos es original.",
      "Respeta la cantidad de integrantes: minimo 2 y maximo 5 estudiantes.",
      "Respeta la duracion maxima de 5 minutos.",
      "Participan unicamente estudiantes como titiriteros/as.",
      "Expresion oral, diccion, entonacion, proyeccion y caracterizacion de voces.",
      "Manipulacion del titere.",
      "Unidad y comunicacion grupal.",
      "Fluidez del espectaculo.",
      "Creatividad y originalidad.",
      "Originalidad en el uso de materiales.",
      "Uniformidad y concordancia entre los titeres y la dramaturgia.",
      "Dramaturgia."
    ],
    "TEATRO DE NINOS Y NINAS": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad humana, diversidad, derechos humanos y equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La obra de teatro de ninos y ninas es original.",
      "Respeta la cantidad de integrantes: minimo 2 y maximo 10 estudiantes.",
      "Respeta la duracion maxima de 5 minutos.",
      "Participan unicamente ninos y ninas de primaria.",
      "Expresion oral, diccion y proyeccion vocal.",
      "Expresion corporal.",
      "Maquillaje y vestuario.",
      "Uso del espacio escenico.",
      "Interpretacion.",
      "Sentido de la verdad.",
      "Unidad y comunicacion grupal.",
      "Fluidez.",
      "Dramaturgia."
    ],
    "TEATRO": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad humana, diversidad, derechos humanos y equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La obra de teatro es original.",
      "Respeta la cantidad de integrantes: minimo 2 y maximo 10 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Participan unicamente personas adolescentes, jovenes o adultas matriculadas en primaria o secundaria.",
      "Expresion oral, diccion y proyeccion vocal.",
      "Expresion corporal.",
      "Maquillaje y vestuario.",
      "Uso del espacio escenico.",
      "Interpretacion.",
      "Sentido de la verdad.",
      "Unidad y comunicacion grupal.",
      "Fluidez.",
      "Dramaturgia."
    ],
    "TEATRO DE NINOS Y NINAS INDIGENA": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad humana, diversidad, derechos humanos y equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La obra de teatro de ninos y ninas indigena es original.",
      "Respeta la cantidad de integrantes: minimo 2 y maximo 12 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Participan unicamente ninos y ninas indigenas de primaria.",
      "Tematica indigena.",
      "Uso de la palabra y la voz.",
      "Expresion corporal.",
      "Maquillaje y vestuario.",
      "Uso del espacio escenico.",
      "Interpretacion.",
      "Sentido de la verdad.",
      "Unidad y comunicacion grupal.",
      "Fluidez.",
      "Dramaturgia."
    ],
    "TEATRO INDIGENA": [
      "La obra se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "La obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Respeta la dignidad humana, diversidad, derechos humanos y equidad de genero.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La obra de teatro indigena es original.",
      "Respeta la cantidad de integrantes: minimo 2 y maximo 12 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Participan unicamente personas adolescentes, jovenes o adultas matriculadas en primaria o secundaria.",
      "Tematica indigena.",
      "Uso de la palabra y la voz.",
      "Expresion corporal.",
      "Maquillaje y vestuario.",
      "Uso del espacio escenico.",
      "Interpretacion.",
      "Sentido de la verdad.",
      "Unidad y comunicacion grupal.",
      "Fluidez.",
      "Dramaturgia."
    ],
    "DANZA CULTURAL INDIGENA COSTARRICENSE": [
      "La propuesta se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
      "Respeta la dignidad, diversidad humana y cosmovision indigena.",
      "Es evidente la mediacion pedagogica desde derechos humanos e interculturalidad.",
      "Respeta la cantidad de integrantes: minimo 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Transmite ideas o sensaciones de la cosmovision, saberes y tradiciones indigenas costarricenses.",
      "Representa relatos, vivencias o expresiones culturales indigenas de Costa Rica.",
      "Participan unicamente estudiantes en escena.",
      "Movimientos y elementos dancisticos.",
      "Coherencia cultural y respeto a la cosmovision indigena.",
      "Aspectos generales: coordinacion grupal, presencia escenica, uso del espacio, claridad de movimientos, vestuario y accesorios acordes."
    ],
    "DANZA CULTURAL INDIGENA INTERNACIONAL": [
      "La propuesta se acoge al articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
      "Respeta la dignidad, diversidad humana y cosmovision indigena.",
      "Es evidente la mediacion pedagogica desde derechos humanos e interculturalidad.",
      "Respeta la cantidad de integrantes: minimo 2 estudiantes.",
      "Respeta la duracion maxima de 6 minutos.",
      "Transmite ideas o sensaciones de la cosmovision, saberes y tradiciones culturales indigenas.",
      "Representa relatos, vivencias o expresiones culturales propias de otros pueblos indigenas del mundo.",
      "Participan unicamente estudiantes en escena.",
      "Movimientos y elementos dancisticos.",
      "Coherencia cultural y respeto a la cosmovision indigena.",
      "Aspectos generales: coordinacion grupal, presencia escenica, uso del espacio, claridad de movimientos, vestuario y accesorios acordes."
    ],
    "BANDA DE GARAJE": [
      "La cancion se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "La letra de la cancion se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El contenido general y mensaje de la cancion incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La cancion es original.",
      "Respeta la cantidad de integrantes: minimo 3 y maximo 8 estudiantes.",
      "Respeta la duracion maxima de 5 minutos.",
      "Respeta la instrumentacion base de banda de garaje.",
      "Participan unicamente estudiantes en interpretacion y direccion musical.",
      "Relacion y desarrollo de melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion.",
      "Estabilidad en el pulso.",
      "Afinacion vocal e instrumental.",
      "Mensaje de la letra.",
      "Interpretacion en vivo."
    ],
    "CANCION ORIGINAL": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival y sugerencias de temas.",
      "El contenido y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "La letra es adecuada a la etapa de desarrollo de adolescentes y jovenes.",
      "Es evidente la mediacion pedagogica docente.",
      "La cancion es original.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza un unico instrumento como base armonica.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion."
    ],
    "CANCION ORIGINAL DE NINOS Y NINAS": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "El contenido y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "La letra es adecuada a la edad y etapa de desarrollo de ninos y ninas.",
      "Es evidente la mediacion pedagogica docente.",
      "La cancion es original.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Es cantada unicamente por un nino o una nina.",
      "Utiliza un unico instrumento como base armonica.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion."
    ],
    "CANCION POPULAR": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "El contenido incorpora una reflexion critica y analitica de la realidad actual.",
      "La letra es adecuada para adolescentes y jovenes.",
      "Es evidente la mediacion pedagogica docente.",
      "La letra promueve valores y buenas practicas.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza un unico instrumento como base armonica.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion."
    ],
    "CANCION POPULAR DE NINOS Y NINAS": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "La letra es adecuada para la edad del nino o nina.",
      "Es evidente la mediacion pedagogica docente.",
      "La cancion tiene un mensaje positivo para la ninez.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza un unico instrumento como base armonica.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion."
    ],
    "CANCION TIPICA ORIGINAL COSTARRICENSE": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "El contenido incorpora una reflexion critica y analitica de la realidad actual.",
      "La letra es adecuada a la edad de quien la canta.",
      "Es evidente la mediacion pedagogica docente.",
      "La cancion es original.",
      "Expone aspectos propios de la identidad cultural y folclor costarricense.",
      "Utiliza ritmos tradicionales o tipicos costarricenses.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Puede haber hasta 3 personas en escena y maximo 3 instrumentos.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion."
    ],
    "CANCION TIPICA POPULAR COSTARRICENSE": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La obra se acoge a los objetivos del festival.",
      "La letra es adecuada a la edad de quien la canta.",
      "Es evidente la mediacion pedagogica docente.",
      "La letra expone aspectos propios de la identidad cultural y folclor costarricense.",
      "Utiliza ritmos tradicionales o tipicos costarricenses.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Puede haber hasta 3 personas en escena y maximo 3 instrumentos.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion.",
      "Letra con rescate de tradiciones, costumbres e historias costarricenses."
    ],
    "CANTAUTOR/A": [
      "La cancion se acoge al articulo 3 de la Normativa.",
      "La obra se acoge a los objetivos del festival.",
      "El contenido incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la mediacion pedagogica docente.",
      "La cancion es original y compuesta por quien la canta.",
      "La letra promueve valores y experiencias positivas.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza un unico instrumento ejecutado por quien compuso la cancion.",
      "Relacion y desarrollo melodia-armonia-ritmo y letra.",
      "Diccion.",
      "Proyeccion de la voz.",
      "Precision en la ejecucion vocal y estabilidad en el ritmo.",
      "Entonacion y afinacion.",
      "Creatividad en la letra."
    ],
    "CANTO INDIGENA ORIGINAL": [
      "El canto se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "La letra es adecuada a la etapa de desarrollo de quien la interpreta.",
      "Es evidente la mediacion pedagogica docente.",
      "El canto es original.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza maximo 2 instrumentos.",
      "Presenta elementos de cosmovision, memoria viva y saberes indigenas.",
      "Aborda temas relacionados con territorios indigenas, naturaleza, convivencia, familia y valores."
    ],
    "CANTO INDIGENA TRADICIONAL O ANCESTRAL": [
      "El canto se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "La letra es adecuada a la etapa de desarrollo de quien la interpreta.",
      "Es evidente la mediacion pedagogica docente.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza maximo 2 instrumentos.",
      "Presenta elementos de cosmovision, memoria viva y saberes indigenas.",
      "Aborda temas relacionados con territorios indigenas, naturaleza, convivencia, familia y valores."
    ],
    "CANTO INDIGENA ORIGINAL DE NINOS Y NINAS": [
      "El canto se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "La letra es adecuada a la etapa de desarrollo de ninos y ninas.",
      "Es evidente la mediacion pedagogica docente.",
      "El canto es original.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza maximo 2 instrumentos.",
      "Presenta aspectos propios de la cosmovision y saberes indigenas.",
      "Aborda temas relacionados con naturaleza, territorio, convivencia, aprendizaje, juego, familia y valores."
    ],
    "CANTO INDIGENA DE NINOS Y NINAS: TRADICIONAL O ANCESTRAL": [
      "El canto se acoge al articulo 3 de la Normativa.",
      "La letra se acoge a los objetivos del festival.",
      "La letra es adecuada a la etapa de desarrollo de ninos y ninas.",
      "Es evidente la mediacion pedagogica docente.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "Utiliza maximo 2 instrumentos.",
      "Presenta aspectos propios de la cosmovision y saberes indigenas.",
      "Aborda temas relacionados con naturaleza, territorio, convivencia, aprendizaje, juego, familia y valores."
    ],
    "CIMARRONA": [
      "La obra artistica se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "El titulo de la obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El titulo incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La obra musical es original.",
      "Respeta la cantidad de integrantes: minimo 5 y maximo 12 estudiantes.",
      "Respeta la duracion maxima de 5 minutos.",
      "Participan unicamente estudiantes tanto en la interpretacion como en la direccion musical.",
      "Mantiene el formato tradicional de la cimarrona costarricense.",
      "Desarrollo ritmico, melodico y armonico.",
      "Precision en la ejecucion ritmica.",
      "Afinacion general.",
      "Utiliza ritmos tipicos, folcloricos o tradicionales costarricenses."
    ],
    "CORO": [
      "La cancion se acoge al articulo 3 de la Normativa FEA 2026.",
      "La letra responde a los objetivos y temas del festival.",
      "El mensaje incorpora reflexion critica y analitica.",
      "Existe mediacion pedagogica docente.",
      "La cancion es original.",
      "Minimo 4 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Utiliza un instrumento o puede interpretarse a capela.",
      "Participan unicamente estudiantes en el coro.",
      "Relacion melodia-armonia-ritmo-letra.",
      "Diccion.",
      "Proyeccion vocal.",
      "Precision en la ejecucion.",
      "Estabilidad en el pulso.",
      "Afinacion vocal e instrumental.",
      "Mensaje positivo de la letra.",
      "Interpretacion totalmente en vivo."
    ],
    "ENSAMBLE DE FLAUTAS DULCES": [
      "La obra se acoge a la normativa del festival.",
      "El titulo responde a objetivos y temas del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Minimo 3 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Participan unicamente estudiantes.",
      "Utiliza unicamente flautas dulces.",
      "Relacion armonica entre melodia y armonia.",
      "Afinacion, entonacion y armonizacion.",
      "Precision ritmica.",
      "Interpretacion totalmente en vivo."
    ],
    "ENSAMBLE INSTRUMENTAL CON MATERIALES RECICLABLES O REUTILIZABLES": [
      "Se acoge al articulo 3 de la normativa.",
      "El titulo responde a los objetivos del festival.",
      "El titulo incorpora reflexion critica.",
      "Promueve sostenibilidad ambiental.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Minimo 4 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Solo participan estudiantes.",
      "Utiliza instrumentos construidos con materiales reciclables o reutilizables.",
      "Acople ritmico grupal.",
      "Creatividad e innovacion.",
      "Precision y claridad ritmica.",
      "Interpretacion totalmente en vivo."
    ],
    "ESTUDIANTINA": [
      "La cancion se acoge a la normativa.",
      "La letra responde a objetivos y temas del festival.",
      "Incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La cancion es original.",
      "Minimo 10 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Participan unicamente estudiantes.",
      "Mantiene caracteristicas propias de una estudiantina.",
      "Relacion melodia-armonia-ritmo-letra.",
      "Diccion.",
      "Proyeccion vocal.",
      "Precision en la ejecucion.",
      "Estabilidad en el pulso.",
      "Afinacion vocal e instrumental.",
      "Mensaje positivo de la letra.",
      "Interpretacion totalmente en vivo."
    ],
    "GRUPO INSTRUMENTAL EXPERIMENTAL": [
      "La obra se acoge a la normativa.",
      "El titulo responde a los objetivos del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Minimo 5 y maximo 15 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Integrado unicamente por estudiantes.",
      "Experimenta con al menos 3 de las 4 categorias sonoras establecidas.",
      "La obra es instrumental y experimental.",
      "Relacion melodia-armonia-ritmo.",
      "Precision en la ejecucion.",
      "Estabilidad en el pulso.",
      "Afinacion instrumental."
    ],
    "GRUPO INSTRUMENTAL": [
      "La obra se acoge a la normativa.",
      "El titulo responde a objetivos y temas del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Minimo 3 y maximo 15 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Los instrumentos son ejecutados unicamente por estudiantes.",
      "Relacion precisa entre armonia y melodia.",
      "Uso de melodia, armonia y ritmo.",
      "Afinacion correcta.",
      "Precision ritmica.",
      "Interpretacion totalmente en vivo."
    ],
    "GRUPO MUSICAL CULTURAL INSTRUMENTAL INDIGENA": [
      "La propuesta se acoge a la normativa.",
      "El titulo responde a objetivos y temas del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "Minimo 2 y maximo 15 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Solo estudiantes participan y dirigen.",
      "Interpretacion instrumental totalmente en vivo.",
      "Presenta cosmovision, memoria viva y saberes indigenas.",
      "Aborda territorios indigenas, naturaleza, convivencia y valores.",
      "Puede integrar danza, narracion, poesia y dramatizacion."
    ],
    "GRUPO MUSICAL CULTURAL INDIGENA": [
      "La propuesta se acoge a la normativa.",
      "El titulo responde a objetivos y temas del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "Minimo 2 y maximo 15 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Solo estudiantes participan y dirigen.",
      "Interpretacion totalmente en vivo con canto.",
      "Presenta cosmovision, memoria viva y saberes indigenas.",
      "Aborda territorios indigenas, naturaleza, convivencia y valores.",
      "Puede integrar danza, narracion, poesia y dramatizacion."
    ],
    "MARIMBA": [
      "La obra se acoge a la normativa.",
      "El titulo responde a objetivos y temas del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Utiliza unicamente ritmos folcloricos costarricenses autorizados.",
      "Individual o agrupacion de maximo 15 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Solo estudiantes interpretan la obra.",
      "La marimba es el instrumento principal.",
      "Relacion armonica entre melodia y armonia.",
      "Afinacion y armonizacion.",
      "Precision ritmica.",
      "Interpretacion totalmente en vivo."
    ],
    "PERCUSION CORPORAL": [
      "La obra se acoge a la normativa.",
      "El titulo responde a los objetivos del festival.",
      "El titulo incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La obra es original.",
      "Minimo 2 estudiantes.",
      "Duracion maxima de 5 minutos.",
      "Solo participan estudiantes.",
      "Utiliza unicamente el cuerpo humano como instrumento.",
      "Presenta elementos coreograficos o formaciones.",
      "Acople ritmico grupal.",
      "Originalidad y creatividad.",
      "Precision y claridad ritmica.",
      "Musicalidad.",
      "Interpretacion totalmente en vivo."
    ],
    "RAP": [
      "El rap se acoge a la normativa.",
      "La letra responde a los objetivos y temas del festival.",
      "Incorpora reflexion critica.",
      "Existe mediacion pedagogica docente.",
      "La cancion es original.",
      "Participacion estrictamente individual.",
      "Duracion maxima de 5 minutos.",
      "La mayor parte de la obra es rapeada.",
      "Utiliza un unico instrumento, pista o puede ser a capela.",
      "Relacion entre ritmo y letra.",
      "Diccion.",
      "Precision vocal y estabilidad ritmica.",
      "Proyeccion vocal.",
      "Precision en la ejecucion.",
      "Estabilidad en el pulso.",
      "Uso correcto del vocabulario."
    ],
    "ILUSTRACION DIGITAL": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "La obra artistica incorpora una reflexion critica y analitica de la realidad actual.",
      "La propuesta artistica no visibiliza algun tipo de discriminacion.",
      "En el titulo de la obra incorpora un uso de lenguaje correcto y se basa en las sugerencias de temas del festival.",
      "Incorpora el uso de lenguaje correcto.",
      "Es evidente la mediacion pedagogica de las personas docentes y del centro educativo.",
      "La obra es original y no constituye copia o replica directa de disenos existentes.",
      "La obra constituye una ilustracion digital creada integramente con herramientas digitales.",
      "El dibujo, pintura, diseno, color, modelado digital, efectos y edicion son realizados por estudiantes.",
      "La obra evidencia uso de composicion, proporciones, iluminacion y color.",
      "La participacion es estrictamente individual.",
      "Integra intencionalmente los elementos del lenguaje visual: linea, forma, color, textura e iluminacion.",
      "Mantiene coherencia estetica y conceptual entre planificacion e ilustracion final.",
      "Desarrolla una composicion equilibrada mediante color, luz, sombra y jerarquias visuales.",
      "Emplea adecuadamente herramientas digitales de dibujo, pintura, capas, pinceles y ajustes.",
      "Produce la ilustracion en el formato, orientacion y resolucion establecidos."
    ],
    "MICRORRELATO ILUSTRADO DIGITAL": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema propuesto.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "El microrrelato ilustrado, tanto texto como ilustraciones, es original.",
      "Participacion individual o maximo 2 estudiantes.",
      "Respeta la extension de minimo 7 y maximo 200 palabras.",
      "Cumple con el formato digital de presentacion establecido.",
      "Presenta la ficha tecnica visible en la obra.",
      "Presenta narratividad y recursos discursivos como ironia, humor o parodia.",
      "Posee estructura simple, personajes minimamente caracterizados y condensacion temporal.",
      "Emplea adecuadamente recursos tematicos como intertextualidad o metaficcion.",
      "Utiliza correctamente puntuacion y ortografia.",
      "Mantiene extrema brevedad.",
      "Presenta concision, sintesis y condensacion narrativa.",
      "La ilustracion mantiene coherencia estetica y conceptual con el texto.",
      "Utiliza adecuadamente los elementos del lenguaje visual.",
      "Emplea herramientas digitales de ilustracion.",
      "Presenta una composicion equilibrada y clara visualmente."
    ],
    "MUSICA DIGITAL": [
      "La obra musical se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "El titulo de la obra se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El titulo y la letra incorporan una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La obra musical es original.",
      "Participacion individual o maximo 10 estudiantes.",
      "Respeta la duracion maxima de 10 minutos.",
      "Los dispositivos digitales, hardware, software y controladores son ejecutados unicamente por estudiantes.",
      "Presenta creatividad en la composicion.",
      "La armonia y melodia son coherentes.",
      "Utiliza preferiblemente los elementos constitutivos de la musica.",
      "Presenta precision general en la ejecucion.",
      "La ejecucion se realiza unicamente en vivo.",
      "Responde a las caracteristicas propias de la disciplina de musica digital.",
      "No utiliza instrumentos musicales acusticos, electroacusticos o electricos tradicionales."
    ],
    "CANTO POETICO INDIGENA": [
      "La propuesta se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "Participacion estrictamente individual.",
      "Respeta la duracion maxima de 5 minutos.",
      "Presenta caracter poetico, musical, cantado o narrado.",
      "Contiene memorias colectivas culturales, espirituales, linguisticas, territoriales o simbolicas propias de los pueblos indigenas.",
      "Presenta formatos como canto narrativo, canto ritual, poema cantado, relato poetico o fraseos musicales.",
      "Representa aspectos o elementos creativos basados en la tradicion oral ancestral de los pueblos originarios.",
      "Puede incorporar elementos contemporaneos propios de la creatividad estudiantil."
    ],
    "CUENTO": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "El cuento es original.",
      "Participacion estrictamente individual.",
      "Respeta la extension establecida: mas de 2 paginas y maximo 7 paginas.",
      "Presenta creatividad en la construccion narrativa.",
      "Desarrolla adecuadamente el tema.",
      "Presenta espacios narrativos coherentes.",
      "Existe efectividad del narrador.",
      "Presenta desarrollo adecuado de la trama.",
      "Emplea correctamente puntuacion y ortografia.",
      "Contiene introduccion.",
      "Contiene desarrollo.",
      "Contiene conclusion o desenlace."
    ],
    "CUENTO ILUSTRADO": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "El cuento ilustrado es original.",
      "Las ilustraciones se colocan de manera creativa y coherente.",
      "Participacion individual o maximo 2 estudiantes.",
      "Respeta la extension minima de 5 paginas.",
      "Presenta un minimo de 5 escenas ilustradas.",
      "Las ilustraciones estan en consonancia con el tema.",
      "Existe cohesion entre narracion e imagen.",
      "Emplea correctamente ortografia y puntuacion.",
      "Presenta prosa clara y fluida.",
      "Demuestra originalidad.",
      "Presenta creatividad en el empleo de tecnicas."
    ],
    "FOTONOVELA": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La fotonovela es original.",
      "Las fotografias se colocan de manera creativa y coherente.",
      "Participacion individual o maximo 2 estudiantes.",
      "Respeta la extension maxima de 15 paginas.",
      "Utiliza material adecuado y mantiene tama�o carta.",
      "Presenta calidad fotografica.",
      "Las fotografias son originales y alusivas al tema.",
      "Presenta una historia y trama coherente.",
      "Emplea correctamente ortografia y puntuacion.",
      "Presenta prosa clara y fluida.",
      "Demuestra creatividad mediante el empleo de diversas tecnicas."
    ],
    "MICRORRELATO": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "El microrrelato es original.",
      "Participacion estrictamente individual.",
      "Respeta la extension minima de 7 palabras y maxima de 200 palabras.",
      "Presenta narratividad y recursos como ironia, parodia o humor.",
      "Posee estructura simple.",
      "Presenta personajes minimamente caracterizados.",
      "Utiliza espacios esquematicos y condensacion temporal.",
      "Emplea recursos como intertextualidad y metaficcion.",
      "Utiliza correctamente puntuacion y ortografia.",
      "Mantiene extrema brevedad.",
      "Presenta concision, sintesis y condensacion narrativa."
    ],
    "NOVELA GRAFICA": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La novela grafica es original.",
      "Las imagenes se colocan de manera creativa y coherente.",
      "Participacion individual o maximo 3 estudiantes.",
      "Respeta la extension establecida en el manual.",
      "Presenta secuencia de introduccion, desarrollo, climax y conclusion.",
      "Existe relacion entre texto e imagen.",
      "Presenta originalidad en historia, personajes y disenos.",
      "Los personajes tienen representacion visual coherente.",
      "Utiliza correctamente ortografia y puntuacion.",
      "Presenta coherencia textual.",
      "Utiliza diferentes planos visuales.",
      "Crea un mundo narrado propio.",
      "Es una obra ficcional.",
      "Utiliza intertextos, intratextos o metaficcion.",
      "Presenta multiples personajes.",
      "Tiene narrador.",
      "Presenta hilo conductor.",
      "Utiliza vi�etas.",
      "Presenta textos narrativos, dialogos y onomatopeyas.",
      "Utiliza diferentes globos de texto.",
      "Incluye prologo como guia inicial de la historia."
    ],
    "POESIA": [
      "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La poesia es original.",
      "Participacion estrictamente individual.",
      "Se presenta en forma escrita.",
      "Emplea lenguaje poetico y figuras literarias.",
      "Presenta y desarrolla el motivo lirico.",
      "Expresa adecuadamente el yo lirico.",
      "Presenta fuerza lirica.",
      "Comunica emotividad.",
      "Posee calidad eufonica.",
      "Presenta capacidad de sintesis expresiva.",
      "Emplea correctamente las normas ortograficas.",
      "Carece de rima, acorde con las tendencias contemporaneas."
    ],
    "POESIA INDIGENA": [
      "La poesia se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y al tema.",
      "Respeta la dignidad y diversidad humana, los derechos humanos y la equidad de genero.",
      "El contenido general y mensaje incorpora una reflexion critica y analitica de la realidad actual.",
      "Es evidente la intervencion y mediacion pedagogica de las personas docentes y del centro educativo.",
      "La poesia es original.",
      "Participacion estrictamente individual.",
      "Se presenta de forma escrita con letra legible.",
      "Desde un enfoque de derechos humanos, interculturalidad y no discriminacion, desarrolla una narrativa respetuosa y culturalmente pertinente.",
      "Mantiene coherencia con saberes, valores, cosmovisiones y formas de expresion de los pueblos indigenas.",
      "Resguarda el sentido educativo y formativo de la propuesta."
    ],
    "COLLAGE": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Promueve derechos humanos, identidad cultural, convivencia pacifica, igualdad, equidad, cultura de paz y conservacion ambiental.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "No visibiliza ningun tipo de discriminacion.",
      "El titulo utiliza lenguaje correcto y acorde con las tematicas del festival.",
      "Es evidente la mediacion pedagogica de las personas docentes y del centro educativo.",
      "La obra es original y no constituye una copia o imitacion.",
      "Se presenta sin marco.",
      "Respeta las dimensiones establecidas (minimo tama�o carta y maximo 30 x 40 cm).",
      "Utiliza materiales permitidos para la tecnica de collage.",
      "Participacion estrictamente individual.",
      "Organiza los elementos con distribucion espacial equilibrada y coherente.",
      "Experimenta con colores, texturas y formas de manera armonica.",
      "Presenta limpieza, acabados adecuados y atencion al detalle."
    ],
    "DIBUJO": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "El titulo utiliza lenguaje correcto y acorde con las tematicas propuestas.",
      "Evidencia mediacion pedagogica por parte del centro educativo.",
      "La obra es original.",
      "Se presenta sin marco.",
      "Respeta las dimensiones establecidas.",
      "Utiliza materiales y tecnicas permitidas.",
      "Participacion estrictamente individual.",
      "Emplea adecuadamente elementos como linea, forma, textura, luz, sombra y volumen.",
      "Demuestra dominio tecnico de los materiales utilizados.",
      "Relaciona el lenguaje visual con el mensaje o significado de la obra.",
      "Presenta soporte firme y adecuado.",
      "Mantiene limpieza y calidad en la ejecucion artistica."
    ],
    "DISENO DE OBJETO": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "No visibiliza ningun tipo de discriminacion.",
      "El titulo utiliza lenguaje correcto.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales resistentes y adecuados.",
      "Respeta las dimensiones y caracteristicas establecidas.",
      "Incluye pedestal proporcional cuando corresponde.",
      "Participacion individual o maximo tres estudiantes.",
      "Aplica principios de diseno como equilibrio, proporcion y contraste.",
      "Relaciona el lenguaje visual con el mensaje conceptual de la obra.",
      "Considera ergonomia, estabilidad y funcionalidad.",
      "Presenta acabados limpios y estetica adecuada."
    ],
    "ESCULTURA": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Incorpora una reflexion critica y analitica de la realidad actual.",
      "No visibiliza discriminacion.",
      "El titulo utiliza lenguaje correcto.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza tecnicas escultricas permitidas.",
      "Respeta dimensiones y materiales establecidos.",
      "Participacion estrictamente individual.",
      "Utiliza adecuadamente volumen, textura, equilibrio y proporcion.",
      "Relaciona el lenguaje visual con el significado de la obra.",
      "Evidencia dominio tecnico y buen manejo de materiales.",
      "Presenta base o pedestal estable.",
      "Logra una composicion tridimensional armonica."
    ],
    "ESCULTURAS VIVIENTES": [
      "La propuesta respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos del festival y a las sugerencias de temas.",
      "Incorpora reflexion critica de la realidad actual.",
      "No presenta contenidos discriminatorios.",
      "El titulo utiliza lenguaje correcto.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales seguros para la piel y el cuerpo.",
      "Presenta una propuesta integral de vestuario, maquillaje y utileria.",
      "Respeta los tiempos de preparacion establecidos.",
      "Participacion individual o maximo tres estudiantes.",
      "Utiliza adecuadamente la expresion corporal.",
      "Aprovecha el espacio escenico de forma pertinente.",
      "Emplea materiales y maquillaje coherentes con la propuesta.",
      "Caracteriza adecuadamente al personaje o escena representada.",
      "Relaciona el lenguaje visual con el mensaje de la obra."
    ],
    "FOTOGRAFIA": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos y tematicas del festival.",
      "Promueve convivencia, identidad cultural y respeto a la diversidad.",
      "Incorpora reflexion critica y analitica.",
      "No presenta discriminacion.",
      "El titulo utiliza lenguaje correcto.",
      "Evidencia mediacion pedagogica.",
      "La fotografia es original.",
      "Fue tomada por la persona estudiante participante.",
      "Respeta las dimensiones establecidas.",
      "Participacion estrictamente individual.",
      "Utiliza adecuadamente encuadre, iluminacion y composicion.",
      "Emplea composiciones fotograficas pertinentes.",
      "Presenta buena calidad de impresion y nitidez.",
      "Demuestra dominio tecnico en el uso de la imagen.",
      "Relaciona los elementos visuales con el mensaje artistico."
    ],
    "GRABADO": [
      "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos y tematicas sugeridas.",
      "Incorpora reflexion critica de la realidad actual.",
      "No visibiliza discriminacion.",
      "Utiliza lenguaje correcto en el titulo.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Se presenta sin marco.",
      "Respeta las dimensiones establecidas.",
      "Utiliza materiales y tecnicas permitidas.",
      "Participacion estrictamente individual.",
      "Presenta dominio tecnico del grabado.",
      "Utiliza soporte adecuado para impresion.",
      "Aplica correctamente los procedimientos de la tecnica seleccionada.",
      "Relaciona el lenguaje visual con el mensaje de la obra."
    ],
    "MASCARA INDIGENA": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Promueve identidad cultural y valoracion de las tradiciones indigenas.",
      "No presenta discriminacion.",
      "Rescata valores, costumbres y cosmovisiones indigenas.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Es elaborada por una persona estudiante indigena o matriculada en centro educativo indigena.",
      "Utiliza materiales tradicionales o propios de la cultura indigena.",
      "Emplea tecnicas acordes con la tradicion indigena.",
      "Participacion estrictamente individual.",
      "Aplica adecuadamente color, forma, textura y volumen.",
      "Representa elementos de la cosmovision indigena.",
      "Demuestra dominio tecnico de materiales y procesos.",
      "Mantiene proporcion y armonia en la estructura de la pieza."
    ],
    "MASCARA O CARETA": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Promueve identidad cultural y aprecio por las tradiciones.",
      "No presenta discriminacion.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales permitidos.",
      "Emplea tecnicas adecuadas de elaboracion.",
      "No corresponde a una mascara indigena ni a una mascarada tradicional costarricense.",
      "Participacion estrictamente individual.",
      "Aplica principios de diseno como color, forma, textura y volumen.",
      "Relaciona elementos simbolicos con el mensaje de la obra.",
      "Demuestra dominio tecnico y estabilidad estructural.",
      "Presenta proporcion anatomica adecuada.",
      "Garantiza funcionalidad y ergonomia."
    ],
    "MASCARADA TRADICIONAL COSTARRICENSE": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Promueve identidad cultural costarricense.",
      "Rescata tradiciones y costumbres nacionales.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales adecuados para mascaradas tradicionales.",
      "Representa personajes tradicionales, miticos o folcloricos.",
      "Participacion individual o maximo tres estudiantes.",
      "Aplica principios de diseno visual.",
      "Integra personajes y elementos simbolicos de la tradicion costarricense.",
      "Demuestra dominio en construccion y ensamblaje.",
      "Presenta estabilidad, ligereza y funcionalidad.",
      "Mantiene proporcion, volumen y ergonomia.",
      "Comunica claramente la intencion cultural de la obra."
    ],
    "MURAL": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos y tematicas del festival.",
      "Incorpora reflexion critica y analitica de la realidad actual.",
      "No presenta discriminacion.",
      "Utiliza lenguaje correcto en el titulo.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales adecuados para la tecnica mural.",
      "Respeta las dimensiones minimas establecidas.",
      "Participacion individual o maximo cinco estudiantes.",
      "Aplica adecuadamente los elementos del lenguaje visual.",
      "Demuestra dominio de tecnicas murales.",
      "Comunica claramente una idea o narracion visual.",
      "Garantiza durabilidad y acabado adecuado.",
      "Presenta registro visual del proceso de elaboracion."
    ],
    "PINTURA": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos y tematicas sugeridas.",
      "Incorpora reflexion critica y analitica de la realidad actual.",
      "Utiliza lenguaje correcto en el titulo.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales pictoricos permitidos.",
      "Se presenta sin marco.",
      "Respeta las dimensiones establecidas.",
      "Participacion estrictamente individual.",
      "Emplea adecuadamente color, textura, luz, sombra y volumen.",
      "Selecciona tecnicas acordes con la intencion artistica.",
      "Relaciona recursos visuales con el mensaje de la obra.",
      "Demuestra dominio tecnico de la pintura.",
      "Presenta soporte adecuado y estable."
    ],
    "PINTURA CORPORAL": [
      "La obra respeta el articulo 3 de la Normativa del Festival Estudiantil de las Artes 2026.",
      "Se acoge a los objetivos y tematicas sugeridas.",
      "Incorpora reflexion critica de la realidad actual.",
      "No presenta discriminacion.",
      "Utiliza lenguaje correcto en el titulo.",
      "Evidencia mediacion pedagogica.",
      "La obra es original.",
      "Utiliza materiales seguros para la piel.",
      "Combina tecnicas y materiales de forma adecuada.",
      "Respeta el tiempo de ejecucion establecido.",
      "Participacion individual o maximo tres estudiantes.",
      "Emplea adecuadamente punto, linea, color y textura.",
      "Utiliza materiales y pigmentos apropiados.",
      "Integra la postura corporal a la propuesta artistica.",
      "Dise�a composiciones acordes con la anatomia del cuerpo.",
      "Relaciona los elementos visuales con el mensaje de la obra."
    ]
  };

  const indicators = rubricBySubcategory[normalizedSubcategory];

  if (!indicators) {
    return null;
  }

  return {
    indicators,
    scoreOptions: getFestivalAdvancedScoreOptions()
  };
}

function getFestivalRubricByCategory(category) {
  const normalizedCategory = String(category ?? "").trim();

  if (normalizedCategory === "Artes Escenicas") {
    return {
      indicators: [
        "La obra se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
        "Se acoge a los objetivos del Festival Estudiantil de las Artes.",
        "La coreografia y temas musicales no irrespetan la dignidad y diversidad humana, derechos humanos y equidad de genero.",
        "Se evidencia mediacion pedagogica docente en pasos, movimientos y letras acordes con la normativa y manual.",
        "Respeta el Manual de disciplinas artisticas en originalidad de la coreografia, cantidad de integrantes (minimo 2), duracion maxima (6 minutos) y participacion exclusiva de estudiantes.",
        "Dominio tecnico y expresivo del movimiento: coordinacion general, presencia escenica, uso del espacio y orden de formaciones.",
        "Limpieza y claridad en movimientos, corporalidad acorde con la musica y musicalidad adecuada.",
        "Nivel de complejidad y control tecnico con cohesion y precision en la ejecucion coreografica.",
        "Coherencia estetica y creatividad: integra pasos, figuras, niveles y formas con concepto/tematica definida.",
        "Vestuario y maquillaje acordes con la musica y propuesta coreografica, reforzando identidad estetica e intencion conceptual."
      ],
      scoreOptions: getFestivalAdvancedScoreOptions()
    };
  }

  if (normalizedCategory === "Artes Musicales") {
    return {
      indicators: [
        "La cancion se acoge al articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
        "La letra se acoge a los objetivos del festival y a las sugerencias de temas.",
        "Promueve derechos humanos, identidad cultural, tradiciones, pertenencia, convivencia pacifica, igualdad, equidad, respeto a la diversidad y cultura de paz.",
        "Promueve conservacion del ambiente, vida silvestre, naturaleza y biodiversidad.",
        "El contenido y mensaje de la cancion incorpora reflexion critica y analitica de la realidad actual.",
        "Se evidencia mediacion pedagogica de docentes y centro educativo, acorde con objetivos del festival, Normativa y Manual.",
        "Respeta el Manual en originalidad de la cancion, cantidad de integrantes (minimo 3, maximo 8) y duracion maxima (5 minutos).",
        "Respeta la instrumentacion base: bateria, bajo, guitarra y una o varias voces (con opcion de otros instrumentos complementarios).",
        "Participan unicamente estudiantes en interpretacion y direccion en escena.",
        "Cuida aspectos tecnico-artisticos: acople melodia-armonia-ritmo-letra, diccion, proyeccion de voz, precision, pulso, afinacion e interpretacion en vivo.",
        "La obra se propone para deliberacion con posibilidad de ser invitada a la siguiente etapa del festival."
      ],
      scoreOptions: getFestivalAdvancedScoreOptions()
    };
  }

  if (normalizedCategory === "Artes Digitales") {
    return {
      indicators: [
        "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
        "Se acoge a los objetivos del festival y a las sugerencias de temas.",
        "Promueve derechos humanos, identidad cultural, tradiciones, pertenencia, convivencia pacifica, igualdad, equidad, respeto a la diversidad y cultura de paz.",
        "Promueve la conservacion del ambiente, la vida silvestre, la naturaleza y la biodiversidad.",
        "La obra incorpora una reflexion critica y analitica de la realidad actual.",
        "La propuesta artistica no visibiliza discriminacion.",
        "El titulo y el contenido de la obra incorporan uso correcto del lenguaje y se basan en sugerencias de temas del festival.",
        "Se evidencia mediacion pedagogica de docentes y centro educativo, acorde con objetivos del festival, Normativa y Manual.",
        "Respeta el Manual en originalidad: la ilustracion no es copia ni replica directa y demuestra autenticidad.",
        "La obra constituye una ilustracion digital final (dibujo o pintura) creada integramente con herramientas digitales.",
        "Dibujo, pintura, diseno, color, modelado digital, efectos y edicion son realizados por estudiantes con software permitido para uso educativo.",
        "La obra evidencia composicion, proporciones, iluminacion y color con intencion visual digital clara.",
        "Respeta la cantidad de integrantes segun el Manual: participacion estrictamente individual.",
        "Integra intencionalmente linea, forma, color, textura e iluminacion para una imagen clara, expresiva y coherente con la propuesta conceptual.",
        "Asegura coherencia entre planificacion visual, referencias seleccionadas e ilustracion final durante todo el proceso creativo.",
        "Desarrolla composicion equilibrada con uso intencional de color, luz y sombra, y distribucion correcta de figuras, fondos y jerarquias.",
        "Emplea adecuadamente herramientas digitales de dibujo, pintura, capas, pinceles y ajustes para una imagen limpia y tecnicamente consistente.",
        "Produce la ilustracion en formato, orientacion y resolucion establecidos, cuidando disposicion de elementos, color y claridad visual.",
        "La obra se propone para deliberacion con posibilidad de ser invitada a la siguiente etapa del festival."
      ],
      scoreOptions: getFestivalAdvancedScoreOptions()
    };
  }

  if (normalizedCategory === "Artes Visuales") {
    return {
      indicators: [
        "La obra respeta el articulo 3 de la Normativa para la organizacion y ejecucion del Festival Estudiantil de las Artes 2026.",
        "Se acoge a los objetivos del festival y a las sugerencias de temas.",
        "Promueve derechos humanos, identidad cultural, tradiciones, pertenencia, convivencia pacifica, igualdad, equidad, respeto a la diversidad y cultura de paz.",
        "Promueve la conservacion del ambiente, vida silvestre, naturaleza y biodiversidad.",
        "La obra incorpora reflexion critica y analitica de la realidad actual y no visibiliza discriminacion.",
        "El titulo incorpora uso correcto del lenguaje y se basa en las sugerencias de temas del festival.",
        "Se evidencia mediacion pedagogica de docentes y centro educativo, acorde con objetivos del festival, Normativa y Manual.",
        "Respeta el Manual en originalidad: el diseno no es imitacion ni copia de otras propuestas.",
        "La obra se presenta sin marco (formato horizontal o vertical).",
        "Respeta dimensiones del Manual: tamano minimo carta y maximo 30 x 40 cm.",
        "Utiliza materiales permitidos (carton, cartulina, papel, recortes, telas, pintura, lapices de color, plastico, entre otros).",
        "Respeta la cantidad de integrantes segun el Manual: participacion estrictamente individual.",
        "Elabora el collage de forma ordenada con distribucion espacial equilibrada, jerarquia visual y recorte preciso de materiales.",
        "Experimenta con color, texturas y formas para lograr un resultado armonico durante el proceso de creacion.",
        "Finaliza el collage con atencion al detalle, acabado limpio y valoracion final de mejora segun la intencion artistica.",
        "La obra se propone para deliberacion con posibilidad de ser invitada a la siguiente etapa del festival."
      ],
      scoreOptions: getFestivalAdvancedScoreOptions()
    };
  }

  return {
    indicators: getRubricIndicatorsByFeria(FESTIVAL_FERIA_NAME),
    scoreOptions: [
      { value: 3, label: "3" },
      { value: 2, label: "2" },
      { value: 1, label: "1" },
      { value: 0, label: "0" }
    ]
  };
}

function buildFeriaOptions(selectedValue = "") {
  return FERIA_TYPES.map(
    (value) => `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${value}</option>`
  ).join("");
}

function renderJudgeRubric(indicators, scoreOptions = null) {
  const tbody = document.querySelector("[data-rubric-body]");
  const headRow = document.querySelector(".rubric-table thead tr");
  const options = scoreOptions && scoreOptions.length
    ? scoreOptions
    : [
        { value: 3, label: "3" },
        { value: 2, label: "2" },
        { value: 1, label: "1" },
        { value: 0, label: "0" }
      ];

  if (!tbody) {
    return;
  }

  if (headRow) {
    headRow.innerHTML = [
      "<th>Indicadores a evaluar</th>",
      ...options.map((item) => `<th>${escapeHTML(item.label)}</th>`)
    ].join("");
  }

  if (!indicators.length) {
    tbody.innerHTML = `<tr><td colspan="${options.length + 1}">No hay indicadores configurados para esta feria.</td></tr>`;
    return;
  }

  const rows = [];
  let globalIndex = 0;

  indicators.forEach((item) => {
    if (typeof item === "string") {
      const fieldName = `indicador_${globalIndex}`;
      const cells = options
        .map(
          (opt, oi) => `<td><input type="radio" name="${fieldName}" value="${opt.value}" ${oi === 0 ? "required" : ""} aria-label="${escapeHTML(item)} - ${escapeHTML(opt.label)}"></td>`
        )
        .join("");
      rows.push(`<tr><td>${escapeHTML(item)}</td>${cells}</tr>`);
      globalIndex++;
    } else if (item.section) {
      rows.push(`<tr class="rubric-section"><td colspan="${options.length + 1}"><strong>${escapeHTML(item.section)}</strong></td></tr>`);
    }
  });

  tbody.innerHTML = rows.join("");
}

async function renderProjectResults() {
  const list = document.querySelector("[data-project-results]");

  if (!list) {
    return;
  }

  showSkeleton(list, 5);

  const { data, error } = await supabase
    .from("resultados_finales_proyectos")
    .select("proyecto_id, titulo, resultado_final, total_jueces")
    .order("titulo", { ascending: true });

  if (error) {
    setMessage(document.querySelector("[data-project-results-status]"), "No se pudieron cargar los resultados.", "error");
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<tr><td colspan="3">No hay proyectos registrados.</td></tr>';
    return;
  }

  list.innerHTML = data
    .map((item) => `<tr><td>${item.titulo}</td><td>${item.resultado_final}</td><td>${item.total_jueces}</td></tr>`)
    .join("");
}

function renderAdminEvaluationsTable(rows, usersById, projectsById) {
  const tbody = document.querySelector("[data-admin-evaluations]");

  if (!tbody) {
    return;
  }

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay evaluaciones en esta feria.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const projectName = projectsById.get(row.proyecto_id)?.titulo ?? "Proyecto";
      const judgeName = usersById.get(row.juez_id)?.nombre ?? "Juez";
      return `<tr><td>${escapeHTML(projectName)}</td><td><span class="role-badge role-judge">${escapeHTML(judgeName)}</span></td><td>${escapeHTML(row.criterio)}</td><td>${row.nota}</td></tr>`;
    })
    .join("");
}

function renderAdminProjectsTable(rows, projectsById) {
  const tbody = document.querySelector("[data-admin-projects]");

  if (!tbody) {
    return;
  }

  const projectIds = [...new Set(rows.map((item) => item.proyecto_id).filter(Boolean))];

  if (!projectIds.length) {
    tbody.innerHTML = '<tr><td colspan="2">No hay proyectos con evaluaciones en esta feria.</td></tr>';
    return;
  }

  tbody.innerHTML = projectIds
    .map((projectId) => {
      const projectName = projectsById.get(projectId)?.titulo ?? "Proyecto";
      return `<tr><td>${escapeHTML(projectName)}</td><td>${projectId}</td></tr>`;
    })
    .join("");
}

function renderAdminScoresTable(rows, projectsById) {
  const tbody = document.querySelector("[data-project-results]");

  if (!tbody) {
    return;
  }

  const totalsByProject = new Map();

  rows.forEach((row) => {
    const current = totalsByProject.get(row.proyecto_id) ?? {
      total: 0,
      judges: new Set()
    };

    const nota = Number(row.nota);
    current.total += Number.isNaN(nota) ? 0 : nota;
    current.judges.add(row.juez_id);
    totalsByProject.set(row.proyecto_id, current);
  });

  if (!totalsByProject.size) {
    tbody.innerHTML = '<tr><td colspan="3">No hay puntajes para esta feria.</td></tr>';
    return;
  }

  tbody.innerHTML = [...totalsByProject.entries()]
    .map(([projectId, data]) => {
      const projectName = projectsById.get(projectId)?.titulo ?? "Proyecto";
      return `<tr><td>${escapeHTML(projectName)}</td><td>${data.total}</td><td>${data.judges.size}</td></tr>`;
    })
    .join("");
}

async function renderAdminReportsByFeria(feriaType) {
  const hasAnyReportTarget =
    document.querySelector("[data-admin-evaluations]") ||
    document.querySelector("[data-admin-projects]") ||
    document.querySelector("[data-project-results]");

  if (!hasAnyReportTarget) {
    return;
  }

  const [users, projectsResult, evaluationsResult] = await Promise.all([
    loadUsers(),
    supabase.from("proyectos_ferias").select("id, titulo"),
    supabase.from("evaluaciones_proyectos").select("proyecto_id, juez_id, criterio, nota").order("created_at", { ascending: false })
  ]);

  if (projectsResult.error) {
    throw projectsResult.error;
  }

  if (evaluationsResult.error) {
    throw evaluationsResult.error;
  }

  const usersById = new Map((users ?? []).map((item) => [item.id, item]));
  const projectsById = new Map((projectsResult.data ?? []).map((item) => [item.id, item]));
  const filteredRows = (evaluationsResult.data ?? []).filter((item) => {
    if (!feriaType) {
      return true;
    }
    return String(usersById.get(item.juez_id)?.tipo_feria ?? "") === feriaType;
  });

  renderAdminEvaluationsTable(filteredRows, usersById, projectsById);
  renderAdminProjectsTable(filteredRows, projectsById);
  renderAdminScoresTable(filteredRows, projectsById);

  // Update summary cards
  const uniqueProjects = new Set(filteredRows.map((r) => r.proyecto_id));
  const uniqueJudges = new Set(filteredRows.map((r) => r.juez_id));
  const totalEval = filteredRows.length;

  const totalsByProject = new Map();
  filteredRows.forEach((row) => {
    const current = totalsByProject.get(row.proyecto_id) ?? { total: 0 };
    const nota = Number(row.nota);
    current.total += Number.isNaN(nota) ? 0 : nota;
    totalsByProject.set(row.proyecto_id, current);
  });
  const highestScore = Math.max(0, ...totalsByProject.values().map((d) => d.total));

  const totalProjEl = document.querySelector("[data-total-projects]");
  const totalJudEl = document.querySelector("[data-total-judges]");
  const totalEvalEl = document.querySelector("[data-total-evaluations]");
  const highScoreEl = document.querySelector("[data-highest-score]");
  if (totalProjEl) totalProjEl.textContent = uniqueProjects.size;
  if (totalJudEl) totalJudEl.textContent = uniqueJudges.size;
  if (totalEvalEl) totalEvalEl.textContent = totalEval;
  if (highScoreEl) highScoreEl.textContent = highestScore;

  const status = document.querySelector("[data-project-results-status]");
  if (status) {
    setMessage(status, feriaType ? `Resultados filtrados por: ${feriaType}` : "Resultados cargados.", "success");
  }
}

function renderJudgeAssignmentsTable(judges, projects, assignments) {
  const tbody = document.querySelector("[data-judge-assignments]");

  if (!tbody) {
    return;
  }

  if (!judges.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay jueces registrados.</td></tr>';
    return;
  }

  const assignmentsByJudge = new Map();

  assignments.forEach((assignment) => {
    const current = assignmentsByJudge.get(assignment.juez_id) ?? [];
    current.push({
      id: assignment.proyecto_id,
      titulo: "Proyecto"
    });
    assignmentsByJudge.set(assignment.juez_id, current);
  });

  tbody.innerHTML = judges
    .map((judge) => {
      const judgeAssignments = assignmentsByJudge.get(judge.id) ?? [];
      const selectedIds = [judgeAssignments[0]?.id ?? "", judgeAssignments[1]?.id ?? "", judgeAssignments[2]?.id ?? ""];

      return `
        <tr data-judge-row data-judge-id="${judge.id}">
          <td>${escapeHTML(judge.nombre)}</td>
          <td>${buildProjectSelectHTML(judge.id, 1, projects, selectedIds[0])}</td>
          <td>${buildProjectSelectHTML(judge.id, 2, projects, selectedIds[1])}</td>
          <td>${buildProjectSelectHTML(judge.id, 3, projects, selectedIds[2])}</td>
          <td><button type="button" data-save-judge-assignments>Guardar</button></td>
        </tr>
      `;
    })
    .join("");
}

function buildProjectSelectHTML(judgeId, slot, projects, selectedValue = "") {
  const options = [
    '<option value="">Seleccione</option>',
    ...projects.map((project) => {
      const isSelected = String(project.id) === String(selectedValue) ? " selected" : "";
      return `<option value="${project.id}"${isSelected}>${escapeHTML(project.titulo)}</option>`;
    })
  ].join("");

  return `<select data-judge-project-select data-judge-id="${judgeId}" data-slot="${slot}" class="assignment-select">${options}</select>`;
}

async function saveJudgeAssignments(row, onSaved) {
  const judgeId = Number(row.dataset.judgeId);
  const status = document.querySelector("[data-judge-assignments-status]");
  const selectedProjects = [...row.querySelectorAll("[data-judge-project-select]")]
    .map((select) => Number(select.value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (selectedProjects.length > 0 && new Set(selectedProjects).size !== selectedProjects.length) {
    setMessage(status, "Los proyectos seleccionados deben ser diferentes.", "error");
    return;
  }

  try {
    const { error: deleteError } = await supabase.from("asignaciones_jueces").delete().eq("juez_id", judgeId);

    if (deleteError) {
      throw deleteError;
    }

    const payload = selectedProjects.map((projectId) => ({
      juez_id: judgeId,
      proyecto_id: projectId
    }));

    const { error: insertError } = await supabase.from("asignaciones_jueces").insert(payload);

    if (insertError) {
      throw insertError;
    }

    showToast("Asignacion guardada correctamente.", "success");
    if (typeof onSaved === "function") {
      await onSaved();
    }
  } catch {
    showToast("No se pudo guardar la asignacion.", "error");
  }
}

async function verifySupabaseStatus() {
  const statusEls = document.querySelectorAll("[data-supabase-status]");

  try {
    const { error } = await supabase.from("roles").select("id").limit(1);

    statusEls.forEach((el) => {
      el.textContent = error ? "Conectado a Supabase, pero revisa tablas o permisos." : "Conectado a Supabase.";
    });
  } catch {
    statusEls.forEach((el) => {
      el.textContent = "No se pudo validar la conexion a Supabase.";
    });
  }
}

function enforceRole(requiredRole) {
  const user = getSession();
  const authStatus = document.querySelector("[data-auth-status]");
  const normalizedRequiredRole = normalizeRoleName(requiredRole);

  if (!user) {
    window.location.href = "index.html";
    return null;
  }

  const normalizedSessionRole = normalizeRoleName(user.role);

  if (normalizedSessionRole !== normalizedRequiredRole) {
    setMessage(authStatus, `Acceso denegado: esta pagina es solo para ${normalizedRequiredRole}.`, "error");
    return null;
  }

  const normalizedUser = { ...user, role: normalizedSessionRole };

  return normalizedUser;
}

async function bootstrapLoginPage() {
  setupHideOnScroll();
  const user = getSession();
  const sessionRole = normalizeRoleName(user?.role);

  if (sessionRole === "Juez") {
    window.location.href = "evaluaciones.html";
    return;
  }

  if (sessionRole === "administrador") {
    window.location.href = "Proyectos.html";
    return;
  }

  const form = document.querySelector("[data-login-form]");
  const status = document.querySelector("[data-login-status]");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const originalText = btn.textContent;

    const formData = new FormData(form);
    const usuario = String(formData.get("usuario") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!usuario || !password) {
      setMessage(status, "Completa usuario y contrase�a.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Ingresando...";

    try {
      const { data, error } = await loadUserForLogin(usuario);

      if (error) {
        throw error;
      }

      if (!data || !(await passwordMatches(password, data.contrasena_hash))) {
        setMessage(status, "Credenciales invalidas.", "error");
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("nombre")
        .eq("id", data.role_id)
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      const roleName = normalizeRoleName(roleData?.nombre);

      if (!roleName) {
        setMessage(status, "El usuario no tiene rol asignado.", "error");
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }

      saveSession({ id: data.id, nombre: data.nombre, role: roleName, tipo_feria: data.tipo_feria ?? null });

      if (roleName === "Juez") {
        window.location.href = "evaluaciones.html";
        return;
      }

      if (roleName === "administrador") {
        window.location.href = "Proyectos.html";
        return;
      }

      setMessage(status, `Rol no soportado para redireccion: ${roleName}.`, "error");
    } catch {
      setMessage(status, "No se pudo iniciar sesion.", "error");
    }

    btn.disabled = false;
    btn.textContent = originalText;
  });
}

async function bootstrapJudgePage() {
  bindLogout();
  highlightActiveNavLink();
  setupHideOnScroll();
  setupHamburgerMenu();

  const user = enforceRole("Juez");

  if (!user) {
    return;
  }

  const judgeName = document.querySelector("[data-judge-name]");
  const feriaTag = document.querySelector("[data-feria-tag]");
  const userFeria = String(user.tipo_feria ?? "");

  if (judgeName) {
    judgeName.textContent = user.nombre;
  }
  if (feriaTag) {
    feriaTag.textContent = user.tipo_feria ?? "";
  }

  const evaluationForm = document.querySelector("[data-evaluation-form]");
  const evaluationStatus = document.querySelector("[data-evaluation-form-status]");
  const myEvaluationsStatus = document.querySelector("[data-my-evaluations-status]");
  const myEvaluationsList = document.querySelector("[data-my-evaluations]");
  const projectSelect = document.querySelector("[data-project-select]");
  const categoryFilter = document.querySelector("[data-judge-category-filter]");
  const categorySelect = document.querySelector("[data-judge-category-select]");
  const categoryStatus = document.querySelector("[data-judge-category-status]");
  let assignedProjectsCache = [];
  let activeCategoryFilter = "";
  let currentRubricModel = {
    indicators: getRubricIndicatorsByFeria(userFeria),
    scoreOptions: [
      { value: 3, label: "3" },
      { value: 2, label: "2" },
      { value: 1, label: "1" },
      { value: 0, label: "0" }
    ]
  };

  function resolveRubricModelForProject(projectId) {
    const selectedProject = assignedProjectsCache.find((item) => Number(item.id) === Number(projectId));
    const projectFeria = selectedProject?.tipo_feria ?? userFeria;

    if (projectFeria === "Feria Expotecnica") {
      const expoCategory = selectedProject?.categoria_expotecnica ?? "";
      const rubric = getExpotecnicaRubricByCategory(expoCategory);
      if (rubric) {
        const allIndicators = rubric.sections.flatMap((section) => [
          { section: `${rubric.title} - ${section.title}` },
          ...section.indicators
        ]);
        return {
          indicators: allIndicators,
          scoreOptions: [
            { value: 3, label: "3 Logrado" },
            { value: 2, label: "2 Parcialmente logrado" },
            { value: 1, label: "1 No logrado" },
            { value: 0, label: "0 Ausente" }
          ]
        };
      }
      return {
        indicators: getRubricIndicatorsByFeria(projectFeria),
        scoreOptions: [
          { value: 3, label: "3" },
          { value: 2, label: "2" },
          { value: 1, label: "1" },
          { value: 0, label: "0" }
        ]
      };
    }

    if (projectFeria !== FESTIVAL_FERIA_NAME) {
      return {
        indicators: getRubricIndicatorsByFeria(projectFeria),
        scoreOptions: [
          { value: 3, label: "3" },
          { value: 2, label: "2" },
          { value: 1, label: "1" },
          { value: 0, label: "0" }
        ]
      };
    }

    const subcategoryRubric = getFestivalRubricBySubcategory(selectedProject?.subcategoria_festival ?? "");
    if (subcategoryRubric) {
      return subcategoryRubric;
    }

    return getFestivalRubricByCategory(selectedProject?.categoria_festival ?? "");
  }

  function applyRubricForSelection(projectId) {
    currentRubricModel = resolveRubricModelForProject(projectId);
    renderJudgeRubric(currentRubricModel.indicators, currentRubricModel.scoreOptions);
    loadSavedEvaluations(projectId, user.id);
  }

  async function loadSavedEvaluations(projectId, judgeId) {
    if (!projectId) return;
    const { data, error } = await supabase
      .from("evaluaciones_proyectos")
      .select("criterio, nota")
      .eq("proyecto_id", projectId)
      .eq("juez_id", judgeId);
    if (error || !data || !data.length) return;
    const lookup = new Map(data.map((r) => [r.criterio.trim(), r.nota]));
    currentRubricModel.indicators.forEach((criterio, index) => {
      const saved = lookup.get(criterio.trim());
      if (saved !== undefined) {
        const radios = document.querySelectorAll(`input[name="indicador_${index}"]`);
        radios.forEach((radio) => {
          if (Number(radio.value) === Number(saved)) {
            radio.checked = true;
          }
        });
      }
    });
  }

  function populateCategoryFilter(projects) {
    if (!categorySelect || !categoryFilter) return;

    const projectFeria = projects.length ? (projects[0].tipo_feria ?? userFeria) : userFeria;
    const isFestival = projectFeria === FESTIVAL_FERIA_NAME;
    const isExpotecnica = projectFeria === "Feria Expotecnica";
    const hasCategories = isFestival || isExpotecnica;

    if (!hasCategories || !projects.length) {
      categoryFilter.hidden = true;
      return;
    }

    const categoryField = isFestival ? "categoria_festival" : "categoria_expotecnica";
    const uniqueCategories = [...new Set(projects.map((p) => p[categoryField]).filter(Boolean))];

    if (uniqueCategories.length <= 1) {
      categoryFilter.hidden = true;
      return;
    }

    categoryFilter.hidden = false;
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Todas las categorias</option>';
    uniqueCategories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
    if (currentValue && uniqueCategories.includes(currentValue)) {
      categorySelect.value = currentValue;
    }
  }

  function getFilteredProjects(projects) {
    if (!activeCategoryFilter) return projects;

    const projectFeria = projects.length ? (projects[0].tipo_feria ?? userFeria) : userFeria;
    const isFestival = projectFeria === FESTIVAL_FERIA_NAME;
    const categoryField = isFestival ? "categoria_festival" : "categoria_expotecnica";
    return projects.filter((p) => String(p[categoryField] ?? "") === activeCategoryFilter);
  }

  async function refreshJudgeData() {
    try {
      const assignedProjects = await loadAssignedProjectsForJudge(user.id);
      assignedProjectsCache = assignedProjects;

      populateCategoryFilter(assignedProjects);

      const filteredProjects = getFilteredProjects(assignedProjects);

      const projectsForSelect = filteredProjects.map((item) => {
        if (userFeria === FESTIVAL_FERIA_NAME && item.categoria_festival) {
          const disciplineLabel = item.subcategoria_festival || item.categoria_festival;
          return {
            ...item,
            titulo: `${item.titulo} (${disciplineLabel})`
          };
        }

        if (userFeria === "Feria Expotecnica" && item.categoria_expotecnica) {
          const disciplineLabel = item.eje_tematico || item.categoria_expotecnica;
          return {
            ...item,
            titulo: `${item.titulo} (${disciplineLabel})`
          };
        }

        return item;
      });

      fillSelect(projectSelect, projectsForSelect, "Selecciona un proyecto asignado", "id", "titulo");

      if (projectSelect?.value) {
        applyRubricForSelection(projectSelect.value);
      } else {
        applyRubricForSelection(filteredProjects[0]?.id ?? "");
      }

      if (!filteredProjects.length) {
        const msg = activeCategoryFilter
          ? `No hay proyectos en la categoria "${activeCategoryFilter}".`
          : "Este juez no tiene proyectos asignados por el admin.";
        setMessage(evaluationStatus, msg, "error");
      }

      const { data, error } = await supabase
        .from("evaluaciones_proyectos")
        .select("id, proyecto_id, criterio, nota, proyectos_ferias(titulo)")
        .eq("juez_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!myEvaluationsList) {
        return;
      }

      if (!data || data.length === 0) {
        myEvaluationsList.innerHTML = '<tr><td colspan="3">No has registrado evaluaciones.</td></tr>';
        return;
      }

      const groupedByProject = new Map();

      data.forEach((item) => {
        const projectId = Number(item.proyecto_id);
        const key = Number.isFinite(projectId) ? String(projectId) : String(item.proyectos_ferias?.titulo ?? "proyecto");

        if (!groupedByProject.has(key)) {
          groupedByProject.set(key, {
            titulo: item.proyectos_ferias?.titulo ?? "Proyecto",
            valores: [],
            total: 0
          });
        }

        const current = groupedByProject.get(key);
        const nota = Number(item.nota);
        current.valores.push(`${item.criterio}: ${Number.isNaN(nota) ? 0 : nota}`);
        current.total += Number.isNaN(nota) ? 0 : nota;
      });

      myEvaluationsList.innerHTML = [...groupedByProject.values()]
        .map(
          (item) =>
            `<tr><td>${escapeHTML(item.titulo)}</td><td>${escapeHTML(item.valores.join(" | "))}</td><td>${item.total}</td></tr>`
        )
        .join("");

      setMessage(myEvaluationsStatus, "Evaluaciones cargadas.", "success");
    } catch {
      setMessage(myEvaluationsStatus, "No se pudieron cargar tus evaluaciones.", "error");
    }
  }

  await refreshJudgeData();

  projectSelect?.addEventListener("change", () => {
    applyRubricForSelection(projectSelect.value);
  });

  categorySelect?.addEventListener("change", () => {
    activeCategoryFilter = categorySelect.value;
    if (categoryStatus) {
      if (activeCategoryFilter) {
        setMessage(categoryStatus, `Mostrando proyectos de: ${activeCategoryFilter}`, "success");
      } else {
        categoryStatus.textContent = "";
        categoryStatus.removeAttribute("data-kind");
      }
    }
    refreshJudgeData();
  });

  if (!evaluationForm) {
    return;
  }

  evaluationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = evaluationForm.querySelector("button[type=submit]");
    const originalText = btn.textContent;

    const formData = new FormData(evaluationForm);
    const proyectoId = Number(formData.get("proyecto_id"));
    const indicadores = currentRubricModel.indicators.map((criterio, index) => ({
      campo: `indicador_${index}`,
      criterio
    }));

    const evaluaciones = indicadores.map((item) => ({
      criterio: item.criterio,
      nota: Number(formData.get(item.campo))
    }));

    if (!proyectoId || evaluaciones.some((item) => Number.isNaN(item.nota))) {
      setMessage(evaluationStatus, "Completa todos los campos de la evaluacion.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      const payload = evaluaciones.map((item) => ({
        proyecto_id: proyectoId,
        juez_id: user.id,
        criterio: item.criterio,
        nota: item.nota
      }));

      const { error } = await supabase.from("evaluaciones_proyectos").upsert(payload, { onConflict: "proyecto_id, juez_id, criterio", ignoreDuplicates: false });

      if (error) {
        throw error;
      }

      evaluationForm.reset();
      showToast("Evaluacion guardada correctamente.", "success");
      await refreshJudgeData();
    } catch {
      showToast("No se pudo guardar la evaluacion.", "error");
    }

    btn.disabled = false;
    btn.textContent = originalText;
  });
}

async function bootstrapAdminPage() {
  bindLogout();
  highlightActiveNavLink();
  setupHideOnScroll();
  setupHamburgerMenu();
  const user = enforceRole("administrador");

  if (!user) {
    return;
  }

  const adminName = document.querySelector("[data-admin-name]");
  const feriaTag = document.querySelector("[data-feria-tag]");

  if (adminName) {
    adminName.textContent = user.nombre;
  }
  if (feriaTag) {
    feriaTag.textContent = user.tipo_feria ?? "";
  }

  const feriaFilterSelect = document.querySelector("[data-admin-feria-filter]");
  const feriaStatus = document.querySelector("[data-admin-feria-status]");
  const assignedFeria = String(user.tipo_feria ?? "Feria Cientifica y Tecnologica");
  const savedFeria = getAdminFeriaFilter(assignedFeria);
  const allowedFerias = FERIA_TYPES;

  if (feriaFilterSelect) {
    const initialFeria = allowedFerias.includes(savedFeria) ? savedFeria : assignedFeria;
    feriaFilterSelect.value = initialFeria;
    saveAdminFeriaFilter(initialFeria);
    setMessage(feriaStatus, `Vista actual: ${initialFeria}`, "success");
  }

  const userForm = document.querySelector("[data-user-form]");
  const userStatus = document.querySelector("[data-user-form-status]");
  const projectForm = document.querySelector("[data-project-form]");
  const projectStatus = document.querySelector("[data-project-form-status]");

  if (projectForm) {
    const feriaInput = projectForm.querySelector('input[name="tipo_feria"]');
    const categorySelect = projectForm.querySelector('select[name="categoria_festival"]');
    const expoCategorySelect = projectForm.querySelector('select[name="categoria_expotecnica"]');

    function syncFeriaFromFilter() {
      if (feriaInput && feriaFilterSelect) {
        feriaInput.value = feriaFilterSelect.value;
        updateProjectFormFieldsByFeria(projectForm);
      }
    }

    categorySelect?.addEventListener("change", () => updateProjectFormFieldsByFeria(projectForm));
    expoCategorySelect?.addEventListener("change", () => updateProjectFormFieldsByFeria(projectForm));
    syncFeriaFromFilter();
  }

  async function refreshAdminDataView() {
    const feriaType = feriaFilterSelect ? String(feriaFilterSelect.value ?? "") : String(user.tipo_feria ?? "");

    const usersTbody = document.querySelector("[data-users-table]");
    const assignmentsTbody = document.querySelector("[data-assignments-tbody]");
    if (usersTbody) showSkeleton(usersTbody, 4);
    if (assignmentsTbody) showSkeleton(assignmentsTbody, 3);

    const [rolesResult, judgesResult, projectsResult, assignmentsResult, usersResult] = await Promise.all([
      supabase.from("roles").select("id, nombre").order("nombre", { ascending: true }),
      loadJudges(""),
      loadProjects(feriaType),
      loadJudgeAssignments(),
      loadUsers()
    ]);

    const roles = rolesResult.data ?? [];

    if (rolesResult.error) {
      throw rolesResult.error;
    }

    const judges = judgesResult;
    const projects = projectsResult;
    const assignments = assignmentsResult;
    const users = filterByFeria(usersResult, feriaType);

    fillSelect(document.querySelector("[data-user-role-select]"), getAllowedRolesForUserForm(roles), "Selecciona un rol");
    renderUsersTable(users, roles);
    renderProjectsManagementTable(projects);
    renderJudgeAssignmentsTable(judges, projects, assignments);
    await renderAdminReportsByFeria(feriaType);

    if (feriaStatus) {
      setMessage(feriaStatus, feriaType ? `Vista actual: ${feriaType}` : "Vista sin filtro de feria.", "success");
    }
  }

  try {
    await refreshAdminDataView();
  } catch {
    setMessage(userStatus, "No se pudieron cargar datos para el panel admin.", "error");
  }

  if (userForm) {
    userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const btn = userForm.querySelector("button[type=submit]");
      const originalText = btn.textContent;

      const formData = new FormData(userForm);
      const nombre = String(formData.get("nombre") ?? "").trim();
      const contrasena = String(formData.get("contrasena") ?? "");
      const tipoFeria = String(formData.get("tipo_feria") ?? "").trim();
      const roleId = Number(formData.get("role_id"));

      if (!nombre || !contrasena || !tipoFeria || !roleId) {
        setMessage(userStatus, "Completa todos los campos del usuario.", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Guardando...";

      try {
        const contrasenaHash = await hashPassword(contrasena);
        const { error } = await supabase.from("usuarios").insert({
          nombre,
          contrasena_hash: contrasenaHash,
          tipo_feria: tipoFeria,
          role_id: roleId
        });

        if (error) {
          throw error;
        }

        userForm.reset();
        showToast("Usuario guardado correctamente.", "success");
        await refreshAdminDataView();
      } catch (err) {
        showToast(err?.message || "No se pudo guardar el usuario.", "error");
      }

      btn.disabled = false;
      btn.textContent = originalText;
    });
  }

  if (projectForm) {
    projectForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const btn = projectForm.querySelector("button[type=submit]");
      const originalText = btn.textContent;
      const formData = new FormData(projectForm);
      const titulo = String(formData.get("titulo") ?? "").trim();
      const descripcion = String(formData.get("descripcion") ?? "").trim();
      const tipoFeria = String(formData.get("tipo_feria") ?? "").trim();
      const integrante1 = String(formData.get("integrante_1") ?? "").trim();
      const integrante2 = String(formData.get("integrante_2") ?? "").trim();
      const integrante3 = String(formData.get("integrante_3") ?? "").trim();
      const categoriaFestival = String(formData.get("categoria_festival") ?? "").trim();
      const subcategoriaFestival = String(formData.get("subcategoria_festival") ?? "").trim();
      const participacion = String(formData.get("participacion") ?? "").trim();
      const categoriaExpotecnica = String(formData.get("categoria_expotecnica") ?? "").trim();
      const ejeTematico = String(formData.get("eje_tematico") ?? "").trim();
      const isFestival = tipoFeria === FESTIVAL_FERIA_NAME;
      const isExpotecnica = tipoFeria === "Feria Expotecnica";

      if (!titulo || !tipoFeria) {
        setMessage(projectStatus, "Completa nombre y tipo de feria del proyecto.", "error");
        return;
      }

      if (!integrante1 || !integrante2 || !integrante3) {
        setMessage(projectStatus, "Completa los 3 integrantes del proyecto.", "error");
        return;
      }

      if (new Set([integrante1.toLowerCase(), integrante2.toLowerCase(), integrante3.toLowerCase()]).size !== 3) {
        setMessage(projectStatus, "Los nombres de integrantes deben ser diferentes.", "error");
        return;
      }

      if (isFestival) {
        if (!FESTIVAL_CATEGORIES.includes(categoriaFestival) || !(FESTIVAL_SUBCATEGORIES[categoriaFestival] ?? []).includes(subcategoriaFestival) || !participacion) {
          setMessage(projectStatus, "Para Festival debes seleccionar categoria, subcategoria y escribir la participacion.", "error");
          return;
        }
      } else if (isExpotecnica) {
        if (!EXPOTECNICA_CATEGORIES.includes(categoriaExpotecnica) || !EXPOTECNICA_EJES.includes(ejeTematico)) {
          setMessage(projectStatus, "Para ExpoTECNICA debes seleccionar categoria y eje tematico.", "error");
          return;
        }
      }

      btn.disabled = true;
      btn.textContent = "Guardando...";

      try {
        const payload = {
          titulo,
          descripcion: descripcion || null,
          creador_id: user.id,
          tipo_feria: tipoFeria,
          integrante_1: integrante1 || null,
          integrante_2: integrante2 || null,
          integrante_3: integrante3 || null,
          categoria_festival: isFestival ? categoriaFestival : null,
          subcategoria_festival: isFestival ? subcategoriaFestival : null,
          participacion: participacion || null,
          categoria_expotecnica: isExpotecnica ? categoriaExpotecnica : null,
          eje_tematico: isExpotecnica ? ejeTematico : null
        };

        let insertResult = await supabase.from("proyectos_ferias").insert(payload);

        if (insertResult.error) {
          if (!isMissingColumnError(insertResult.error, "integrante_") &&
              !isMissingColumnError(insertResult.error, "categoria_festival") &&
              !isMissingColumnError(insertResult.error, "subcategoria_festival") &&
              !isMissingColumnError(insertResult.error, "participacion") &&
              !isMissingColumnError(insertResult.error, "categoria_expotecnica") &&
              !isMissingColumnError(insertResult.error, "eje_tematico")) {
            throw insertResult.error;
          }

          insertResult = await supabase.from("proyectos_ferias").insert({
            titulo,
            descripcion: descripcion || null,
            creador_id: user.id,
            tipo_feria: tipoFeria
          });
        }

        if (insertResult.error) {
          throw insertResult.error;
        }

        projectForm.reset();
        if (feriaFilterSelect) {
          const feriaInput = projectForm.querySelector('input[name="tipo_feria"]');
          if (feriaInput) feriaInput.value = feriaFilterSelect.value;
        }
        showToast("Proyecto guardado correctamente.", "success");
        setMessage(projectStatus, "Proyecto guardado correctamente.", "success");
        await refreshAdminDataView();
      } catch (err) {
        showToast(err?.message || "No se pudo guardar el proyecto.", "error");
        setMessage(projectStatus, err?.message || "No se pudo guardar el proyecto.", "error");
      }

      btn.disabled = false;
      btn.textContent = originalText;
    });
  }

  const assignmentsTable = document.querySelector("[data-judge-assignments]");

  if (feriaFilterSelect) {
    feriaFilterSelect.addEventListener("change", async () => {
      const feriaType = String(feriaFilterSelect.value ?? "");
      saveAdminFeriaFilter(feriaType);
      if (projectForm) {
        const feriaInput = projectForm.querySelector('input[name="tipo_feria"]');
        if (feriaInput) {
          feriaInput.value = feriaType;
          updateProjectFormFieldsByFeria(projectForm);
        }
      }
      await refreshAdminDataView();
    });
  }

  if (assignmentsTable) {
    assignmentsTable.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-save-judge-assignments]");

      if (!button) {
        return;
      }

      const row = button.closest("[data-judge-row]");

      if (!row) {
        return;
      }

      await saveJudgeAssignments(row, refreshAdminDataView);
    });
  }

  const usersTbody = document.querySelector("[data-users-table]");
  const projectsTbody = document.querySelector("[data-projects-table]");

  if (usersTbody) {
    usersTbody.addEventListener("click", async (event) => {
      const editBtn = event.target.closest(".edit-user-btn");
      const deleteBtn = event.target.closest(".delete-user-btn");

      if (editBtn) {
        try {
          const userData = JSON.parse(editBtn.dataset.editUser);
          const rolesResult = await supabase.from("roles").select("id, nombre").order("nombre", { ascending: true });
          showEditUserModal(userData, rolesResult.data ?? []);
        } catch {
          showEditUserModal({ id: 0, nombre: "", role_id: 0, tipo_feria: "" }, []);
        }
      }

      if (deleteBtn) {
        const userId = Number(deleteBtn.dataset.deleteUserId);
        if (confirm("�Estas seguro de eliminar este usuario? Esta accion no se puede deshacer.")) {
          await deleteUser(userId);
          await refreshAdminDataView();
        }
      }
    });
  }

  if (projectsTbody) {
    projectsTbody.addEventListener("click", async (event) => {
      const deleteBtn = event.target.closest(".delete-project-btn");

      if (!deleteBtn) {
        return;
      }

      const projectId = Number(deleteBtn.dataset.deleteProjectId);

      if (!projectId) {
        return;
      }

      if (confirm("�Estas seguro de eliminar este proyecto? Tambien se eliminaran sus asignaciones y evaluaciones.")) {
        try {
          const { error } = await supabase.from("proyectos_ferias").delete().eq("id", projectId);

          if (error) {
            throw error;
          }

          showToast("Proyecto eliminado correctamente.", "success");
          await refreshAdminDataView();
        } catch (err) {
          showToast(err?.message || "No se pudo eliminar el proyecto.", "error");
        }
      }
    });
  }

  const exportBtn = document.getElementById("export-pdf-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", generateAdminPDF);
  }

}

async function generateAdminPDF() {
  await loadJSPDF();
  const feriaFilterSelect = document.querySelector("[data-admin-feria-filter]");
  const feriaType = feriaFilterSelect ? String(feriaFilterSelect.value ?? "") : "";

  try {
    const [users, projectsResult, evaluationsResult] = await Promise.all([
      loadUsers(),
      supabase.from("proyectos_ferias").select("id, titulo"),
      supabase.from("evaluaciones_proyectos").select("proyecto_id, juez_id, criterio, nota").order("created_at", { ascending: false })
    ]);

    if (projectsResult.error || evaluationsResult.error) {
      throw new Error("Error al cargar datos");
    }

    const usersById = new Map((users ?? []).map((item) => [item.id, item]));
    const projectsById = new Map((projectsResult.data ?? []).map((item) => [item.id, item]));

    const filteredRows = (evaluationsResult.data ?? []).filter((item) => {
      if (!feriaType) return true;
      return String(usersById.get(item.juez_id)?.tipo_feria ?? "") === feriaType;
    });

    if (!filteredRows.length) {
      showToast("No hay evaluaciones para generar el reporte.", "info");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 15;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ministerio de Educacion Publica", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Direccion Regional de Educacion Central del Pacifico", margin, y);
    y += 4;
    doc.text("Sistema de Evaluacion de Ferias Institucionales", margin, y);
    y += 7;

    doc.setDrawColor(13, 42, 91);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Reporte General de Evaluaciones", margin, y);
    y += 10;

    const now = new Date();
    const infoLines = [
      `Tipo de feria: ${feriaType || "Todas las ferias"}`,
      `Generado: ${now.toLocaleDateString("es-CR")} ${now.toLocaleTimeString("es-CR")}`,
      `Total de evaluaciones: ${filteredRows.length}`
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const boxX = margin;
    const boxY = y;
    const boxW = pageW - 2 * margin;
    const boxH = infoLines.length * 6 + 6;
    doc.setDrawColor(199, 154, 46);
    doc.setFillColor(255, 252, 240);
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");
    doc.setTextColor(13, 42, 91);
    infoLines.forEach((line, i) => {
      doc.text(line, margin + 4, boxY + 5 + i * 6);
    });
    doc.setTextColor(0, 0, 0);
    y = boxY + boxH + 12;

    const groupedByProject = new Map();
    filteredRows.forEach((row) => {
      const projId = row.proyecto_id;
      if (!groupedByProject.has(projId)) {
        groupedByProject.set(projId, []);
      }
      groupedByProject.get(projId).push(row);
    });

    const colCriterioX = margin;
    const colJuezX = margin + 75;
    const colNotaX = margin + 170;

    const pageLimit = 270;

    for (const [projId, rows] of groupedByProject) {
      const titulo = projectsById.get(projId)?.titulo || "Proyecto sin nombre";

      if (y > pageLimit - 22) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(13, 42, 91);
      doc.setDrawColor(13, 42, 91);
      doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(titulo, margin + 2, y + 5.5);
      y += 11;

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Criterio de evaluacion", colCriterioX, y);
      doc.text("Juez", colJuezX, y);
      doc.text("Nota", colNotaX, y);
      y += 4;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 3;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      for (const row of rows) {
        if (y > pageLimit - 8) {
          doc.addPage();
          y = margin;
        }
        const judgeName = usersById.get(row.juez_id)?.nombre || "Juez";
        doc.text(row.criterio, colCriterioX, y);
        doc.text(judgeName, colJuezX, y);
        doc.text(String(row.nota), colNotaX, y);
        y += 6;
      }

      y += 2;
    }

    const footerY = doc.internal.pageSize.height - 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento generado el ${now.toLocaleDateString("es-CR")} a las ${now.toLocaleTimeString("es-CR")} | Sistema de Evaluacion de Ferias`,
      margin,
      footerY
    );

    doc.save(`reporte_evaluaciones_${feriaType || "todas"}.pdf`);
    showToast("PDF exportado correctamente.", "success");
  } catch (err) {
    console.error("Error generating admin PDF:", err);
    showToast("No se pudo generar el PDF. Revisa la conexion e intenta de nuevo.", "error");
  }
}

function showEditUserModal(user, roles) {
  const existing = document.getElementById("edit-user-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "edit-user-modal";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  `;

  const roleOptions = roles
    .map((r) => `<option value="${r.id}" ${Number(r.id) === Number(user.role_id) ? "selected" : ""}>${normalizeRoleName(r.nombre)}</option>`)
    .join("");

  const feriaOptions = buildFeriaOptions(user.tipo_feria);

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff; border-radius: 16px; padding: 2rem; max-width: 420px;
    width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  `;

  modal.innerHTML = `
    <h3 style="margin:0 0 1rem;color:#0d2a5b;font-size:1.2rem;">Editar usuario</h3>
    <form id="edit-user-form" style="display:flex;flex-direction:column;gap:1rem;">
      <input type="hidden" name="user_id" value="${user.id}">
      <label style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.85rem;color:#475569;">
        Nombre
        <input name="nombre" type="text" required value="${escapeHTML(user.nombre)}" style="padding:0.6rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
      </label>
      <label style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.85rem;color:#475569;">
        Nueva contrase�a <span style="color:#94a3b8;font-size:0.75rem;">(dejar en blanco para mantener)</span>
        <input name="contrasena" type="password" autocomplete="new-password" style="padding:0.6rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
      </label>
      <label style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.85rem;color:#475569;">
        Tipo de feria
        <select name="tipo_feria" required style="padding:0.6rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">${feriaOptions}</select>
      </label>
      <label style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.85rem;color:#475569;">
        Rol
        <select name="role_id" required style="padding:0.6rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">${roleOptions}</select>
      </label>
      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button type="submit" style="flex:1;padding:0.7rem;border:none;border-radius:8px;cursor:pointer;font-weight:600;background:linear-gradient(135deg,#0d2a5b,#1a3f7a);color:#fff;">Guardar</button>
        <button type="button" id="edit-user-cancel" style="flex:1;padding:0.7rem;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-weight:500;background:#fff;color:#64748b;">Cancelar</button>
      </div>
      <p id="edit-user-status" style="margin:0;font-size:0.8rem;"></p>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById("edit-user-cancel").addEventListener("click", () => overlay.remove());

  document.getElementById("edit-user-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("edit-user-status");
    const btn = e.target.querySelector("button[type=submit]");
    const originalText = btn.textContent;
    const formData = new FormData(e.target);
    const userId = Number(formData.get("user_id"));
    const nombre = String(formData.get("nombre") ?? "").trim();
    const contrasena = String(formData.get("contrasena") ?? "");
    const tipoFeria = String(formData.get("tipo_feria") ?? "").trim();
    const roleId = Number(formData.get("role_id"));

    if (!nombre || !tipoFeria || !roleId) {
      status.textContent = "Completa todos los campos.";
      status.style.color = "#dc2626";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Guardando...";
    status.textContent = "";
    status.style.color = "#64748b";

    try {
      await updateUser(userId, nombre, contrasena, tipoFeria, roleId);
      status.textContent = "Usuario actualizado correctamente.";
      status.style.color = "#16a34a";
      setTimeout(() => {
        overlay.remove();
        window.location.reload();
      }, 800);
    } catch (err) {
      const msg = err?.message || err || "Error desconocido";
      status.textContent = msg;
      status.style.color = "#dc2626";
      console.error("updateUser error:", err);
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

async function updateUser(userId, nombre, contrasena, tipoFeria, roleId) {
  const updates = { nombre, tipo_feria: tipoFeria, role_id: roleId };

  if (contrasena) {
    updates.contrasena_hash = await hashPassword(contrasena);
  }

  const { error } = await supabase.from("usuarios").update(updates).eq("id", userId);

  if (error) throw error;
}

async function deleteUser(userId) {
  const { error: assignmentsError } = await supabase.from("asignaciones_jueces").delete().eq("juez_id", userId);
  if (assignmentsError) throw assignmentsError;

  const { error: evaluationsError } = await supabase.from("evaluaciones_proyectos").delete().eq("juez_id", userId);
  if (evaluationsError) throw evaluationsError;

  const { error } = await supabase.from("usuarios").delete().eq("id", userId);
  if (error) throw error;
}

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;

  if (page === "login") {
    bootstrapLoginPage();
    verifySupabaseStatus();
    return;
  }

  await verifySupabaseStatus();

  if (page === "judge") {
    await bootstrapJudgePage();
    return;
  }

  if (page === "admin") {
    await bootstrapAdminPage();
  }
});

