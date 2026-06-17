import { supabase } from "./supabase.js";
import { sha256 } from "https://cdn.jsdelivr.net/npm/js-sha256@0.11.1/+esm";

const SESSION_KEY = "ef_user_session";
const ADMIN_FERIA_FILTER_KEY = "ef_admin_feria_filter";
const APP_VERSION = "1.0.0";

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

let jspdfPromise = null;
function loadJSPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve();
  if (jspdfPromise) return jspdfPromise;
  jspdfPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return jspdfPromise;
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

function showLogoutModal(user) {
  const existing = document.getElementById("logout-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "logout-modal";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff; border-radius: 16px; padding: 2rem; max-width: 400px;
    width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    text-align: center;
  `;

  modal.innerHTML = `
    <h3 style="margin:0 0 0.5rem;color:#0d2a5b;font-size:1.2rem;">Cerrar sesion</h3>
    <p style="margin:0 0 1.5rem;color:#64748b;font-size:0.9rem;">
      ¿Deseas descargar el PDF con tus evaluaciones antes de salir?
    </p>
    <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
      <button id="modal-download-btn" style="
        padding:0.7rem 1.3rem; border:none; border-radius:8px; cursor:pointer;
        font-weight:600; font-size:0.9rem;
        background:linear-gradient(135deg,#0d2a5b,#1a3f7a); color:#fff;
      ">Descargar PDF</button>
      <button id="modal-logout-btn" style="
        padding:0.7rem 1.3rem; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer;
        font-weight:500; font-size:0.9rem; background:#fff; color:#64748b;
      ">Cerrar sin descargar</button>
    </div>
  `;

  overlay.appendChild(modal);
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
    document.getElementById("modal-download-btn").disabled = true;
    document.getElementById("modal-download-btn").textContent = "Generando PDF...";
    try {
      await generateJudgePDF(user);
    } catch (e) {
      console.error("Error generating PDF:", e);
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
  if (error || !data || !data.length) return;

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

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Ministerio de Educacion Publica", margin, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Direccion Regional de Educacion Central del Pacifico", margin, y);
  y += 4;
  doc.text("Sistema de Evaluacion de Ferias Institucionales", margin, y);
  y += 7;

  doc.setDrawColor(13, 42, 91);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
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
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(titulo, margin + 2, y + 5.5);
    y += 11;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont(undefined, "bold");
    doc.text("Criterio de evaluacion", col1X, y);
    doc.text("Nota", col3X, y);
    y += 4;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 3;

    doc.setFont(undefined, "normal");
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
    doc.setFont(undefined, "bold");
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
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(13, 42, 91);
  doc.text("PUNTAJE TOTAL GENERAL", margin, y);
  doc.text(`${grandTotal} puntos`, pageW - margin - 20, y, { align: "right" });
  y += 10;

  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento generado el ${now.toLocaleDateString("es-CR")} a las ${now.toLocaleTimeString("es-CR")} | Sistema de Evaluacion de Ferias`,
    margin,
    footerY
  );

  doc.save(`evaluaciones_${user.nombre}.pdf`);
}

async function hashPassword(password) {
  const digest = sha256.arrayBuffer(password);
  const bytes = new Uint8Array(digest);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

async function passwordMatches(inputPassword, storedPassword) {
  const normalizedStoredPassword = String(storedPassword ?? "").trim();
  const hashedInputPassword = await hashPassword(inputPassword);

  return (
    inputPassword === normalizedStoredPassword ||
    inputPassword.trim() === normalizedStoredPassword ||
    hashedInputPassword === normalizedStoredPassword
  );
}

async function loadProjects() {
  const { data, error } = await supabase.from("proyectos_ferias").select("id, titulo").order("titulo", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
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
    .select("id, titulo")
    .in("id", projectIds)
    .order("titulo", { ascending: true });

  if (projectsError) {
    throw projectsError;
  }

  return projects ?? [];
}

async function loadUsers() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, role_id, tipo_feria")
    .order("nombre", { ascending: true });

  if (error) {
    const message = String(error.message ?? "").toLowerCase();

    // Backward compatibility when DB migration for tipo_feria has not been executed yet.
    if (message.includes("tipo_feria") && message.includes("does not exist")) {
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

  const message = String(tryWithFeria.error.message ?? "").toLowerCase();

  if (!(message.includes("tipo_feria") && message.includes("does not exist"))) {
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
      "Aplicacion practica del proyecto",
      "Calidad tecnica de la solucion",
      "Presentacion del prototipo",
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

function renderJudgeRubric(indicators) {
  const tbody = document.querySelector("[data-rubric-body]");

  if (!tbody) {
    return;
  }

  if (!indicators.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay indicadores configurados para esta feria.</td></tr>';
    return;
  }

  tbody.innerHTML = indicators
    .map((label, index) => {
      const fieldName = `indicador_${index}`;
      return `
        <tr>
          <td>${escapeHTML(label)}</td>
          <td><input type="radio" name="${fieldName}" value="3" required aria-label="${escapeHTML(label)} - 3 puntos"></td>
          <td><input type="radio" name="${fieldName}" value="2" aria-label="${escapeHTML(label)} - 2 puntos"></td>
          <td><input type="radio" name="${fieldName}" value="1" aria-label="${escapeHTML(label)} - 1 punto"></td>
          <td><input type="radio" name="${fieldName}" value="0" aria-label="${escapeHTML(label)} - 0 puntos"></td>
        </tr>
      `;
    })
    .join("");
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

  if (selectedProjects.length !== 3) {
    setMessage(status, "Debes seleccionar exactamente 3 proyectos para este juez.", "error");
    return;
  }

  if (new Set(selectedProjects).size !== 3) {
    setMessage(status, "Los 3 proyectos deben ser diferentes.", "error");
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
      setMessage(status, "Completa usuario y contraseña.", "error");
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
  const rubricIndicators = getRubricIndicatorsByFeria(String(user.tipo_feria ?? ""));

  renderJudgeRubric(rubricIndicators);

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

  async function refreshJudgeData() {
    try {
      const assignedProjects = await loadAssignedProjectsForJudge(user.id);
      fillSelect(document.querySelector("[data-project-select]"), assignedProjects, "Selecciona un proyecto asignado", "id", "titulo");

      if (assignedProjects.length === 0) {
        setMessage(evaluationStatus, "Este juez no tiene proyectos asignados por el admin.", "error");
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

  if (!evaluationForm) {
    return;
  }

  evaluationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = evaluationForm.querySelector("button[type=submit]");
    const originalText = btn.textContent;

    const formData = new FormData(evaluationForm);
    const proyectoId = Number(formData.get("proyecto_id"));
    const indicadores = rubricIndicators.map((criterio, index) => ({
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

      const { error } = await supabase.from("evaluaciones_proyectos").insert(payload);

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
  const allowedFerias = ["Feria Cientifica y Tecnologica", "Feria Expotecnica", "Festival Estudiantil de las Artes"];

  if (feriaFilterSelect) {
    const initialFeria = allowedFerias.includes(savedFeria) ? savedFeria : assignedFeria;
    feriaFilterSelect.value = initialFeria;
    saveAdminFeriaFilter(initialFeria);
    setMessage(feriaStatus, `Vista actual: ${initialFeria}`, "success");
  }

  const userForm = document.querySelector("[data-user-form]");
  const userStatus = document.querySelector("[data-user-form-status]");

  async function refreshAdminDataView() {
    const feriaType = feriaFilterSelect ? String(feriaFilterSelect.value ?? "") : String(user.tipo_feria ?? "");

    const usersTbody = document.querySelector("[data-users-table]");
    const assignmentsTbody = document.querySelector("[data-assignments-tbody]");
    if (usersTbody) showSkeleton(usersTbody, 4);
    if (assignmentsTbody) showSkeleton(assignmentsTbody, 3);

    const [rolesResult, judgesResult, projectsResult, assignmentsResult, usersResult] = await Promise.all([
      supabase.from("roles").select("id, nombre").order("nombre", { ascending: true }),
      loadJudges(""),
      loadProjects(),
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

  const assignmentsTable = document.querySelector("[data-judge-assignments]");

  if (feriaFilterSelect) {
    feriaFilterSelect.addEventListener("change", async () => {
      const feriaType = String(feriaFilterSelect.value ?? "");
      saveAdminFeriaFilter(feriaType);
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
        if (confirm("¿Estas seguro de eliminar este usuario? Esta accion no se puede deshacer.")) {
          await deleteUser(userId);
          await refreshAdminDataView();
        }
      }
    });
  }

  const exportBtn = document.getElementById("export-pdf-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", generateAdminPDF);
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

  const feriaOptions = [
    { value: "Feria Cientifica y Tecnologica", label: "Feria Cientifica y Tecnologica" },
    { value: "Feria Expotecnica", label: "Feria Expotecnica" },
    { value: "Festival Estudiantil de las Artes", label: "Festival Estudiantil de las Artes" }
  ].map((f) => `<option value="${f.value}" ${f.value === user.tipo_feria ? "selected" : ""}>${f.label}</option>`).join("");

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
        Nueva contraseña <span style="color:#94a3b8;font-size:0.75rem;">(dejar en blanco para mantener)</span>
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
      alert("No hay evaluaciones para generar el reporte.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 15;
    let y = margin;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Ministerio de Educacion Publica", margin, y);
    y += 7;
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text("Direccion Regional de Educacion Central del Pacifico", margin, y);
    y += 4;
    doc.text("Sistema de Evaluacion de Ferias Institucionales", margin, y);
    y += 7;

    doc.setDrawColor(13, 42, 91);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(`Reporte General de Evaluaciones`, margin, y);
    y += 10;

    const now = new Date();
    const infoLines = [
      `Tipo de feria: ${feriaType || "Todas las ferias"}`,
      `Generado: ${now.toLocaleDateString("es-CR")} ${now.toLocaleTimeString("es-CR")}`,
      `Total de evaluaciones: ${filteredRows.length}`
    ];
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
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(titulo, margin + 2, y + 5.5);
      y += 11;

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text("Criterio de evaluacion", colCriterioX, y);
      doc.text("Juez", colJuezX, y);
      doc.text("Nota", colNotaX, y);
      y += 4;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 3;

      doc.setFont(undefined, "normal");
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

    const totalsByProject = new Map();
    filteredRows.forEach((row) => {
      const current = totalsByProject.get(row.proyecto_id) ?? { total: 0, judges: new Set() };
      const nota = Number(row.nota);
      current.total += Number.isNaN(nota) ? 0 : nota;
      current.judges.add(row.juez_id);
      totalsByProject.set(row.proyecto_id, current);
    });

    y += 6;
    if (y > pageLimit - 25) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(13, 42, 91);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.setTextColor(13, 42, 91);
    doc.text("Ranking de Proyectos", margin, y);
    y += 10;

    doc.setFillColor(199, 154, 46);
    doc.setDrawColor(199, 154, 46);
    doc.roundedRect(margin, y, pageW - 2 * margin, 7, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text("#", margin + 2, y + 5);
    doc.text("Proyecto", margin + 10, y + 5);
    doc.text("Puntaje total", margin + 130, y + 5);
    doc.text("Jueces", margin + 175, y + 5);
    y += 11;

    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    const sorted = [...totalsByProject.entries()].sort((a, b) => b[1].total - a[1].total);
    let rank = 1;
    for (const [id, data] of sorted) {
      const proj = projectsById.get(id)?.titulo || "Proyecto";
      if (y > pageLimit - 8) {
        doc.addPage();
        y = margin;
      }
      doc.setFont(undefined, "bold");
      doc.text(String(rank), margin + 2, y);
      doc.setFont(undefined, "normal");
      doc.text(proj.substring(0, 50), margin + 10, y);
      doc.text(String(data.total), margin + 130, y);
      doc.text(String(data.judges.size), margin + 175, y);
      y += 6;
      rank++;
    }

    y += 6;
    if (y > pageLimit - 15) {
      doc.addPage();
      y = margin;
    }
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 42, 91);
    const grandTotal = sorted.reduce((acc, [, data]) => acc + data.total, 0);
    doc.text("PUNTAJE TOTAL GENERAL", margin, y);
    doc.text(`${grandTotal} puntos`, pageW - margin - 20, y, { align: "right" });

    const footerY = doc.internal.pageSize.height - 10;
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento generado el ${now.toLocaleDateString("es-CR")} a las ${now.toLocaleTimeString("es-CR")} | Sistema de Evaluacion de Ferias`,
      margin,
      footerY
    );

    doc.save(`reporte_evaluaciones_${feriaType ? feriaType.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30) : "completo"}.pdf`);
  } catch (e) {
    console.error("Error generating admin PDF:", e);
    alert("No se pudo generar el PDF. Revisa la consola para mas detalles.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await verifySupabaseStatus();

  const page = document.body.dataset.page;

  if (page === "login") {
    await bootstrapLoginPage();
    return;
  }

  if (page === "judge") {
    await bootstrapJudgePage();
    return;
  }

  if (page === "admin") {
    await bootstrapAdminPage();
  }
});
