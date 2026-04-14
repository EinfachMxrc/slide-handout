/* global Office */
/**
 * Slide Handout — PowerPoint Add-in Runtime.
 *
 * Flow:
 *   1. Login-Screen: Email+Passwort → POST /api/addin/login → Bearer-Token
 *      wird in localStorage abgelegt.
 *   2. Session-Picker: GET /api/addin/sessions → Liste live+ended.
 *      User wählt aus; wir merken uns die sessionId.
 *   3. Live-Screen: pollen alle ~700 ms die aktuelle Folie.
 *      - `Office.context.document.getActiveViewAsync()` → "edit" vs. "read"
 *      - `getSelectedDataAsync(SlideRange)` → aktuelle Folien-Nummer
 *      - Fallback: `DocumentSelectionChanged`-Event (greift im Edit-Mode)
 *      - In Fullscreen-Slideshow (ActiveView === "read") pollen wir die
 *        Datei-Properties — PowerPoint aktualisiert die "Selected Slide"
 *        auch während der Slideshow auf der Desktop-Version.
 *   4. Bei Änderung → POST /api/addin/advance.
 */
(function () {
  "use strict";

  const API = {
    login: "/api/addin/login",
    logout: "/api/addin/logout",
    sessions: "/api/addin/sessions",
    advance: "/api/addin/advance",
  };
  // Add-in läuft im Office-Sandbox-Origin, Requests gehen an das konfigurierte Backend.
  const ORIGIN = inferOrigin();
  const LS_TOKEN = "sh-addin-token";
  const LS_SESSION = "sh-addin-session";

  const els = {};
  let state = {
    token: null,
    user: null,
    pickedSession: null, // { id, handoutTitle, ... }
    lastSlide: 0,
    pollTimer: null,
    sending: false,
  };

  /** Unterscheidet: Add-in-HTML kommt vom Backend selbst, daher same-origin.
   * Für den Fall, dass der Add-in lokal getestet wird, kann der User eine
   * eigene `?backend=https://…`-Query-Param angeben. */
  function inferOrigin() {
    try {
      const u = new URL(window.location.href);
      const q = u.searchParams.get("backend");
      if (q && /^https:\/\//.test(q)) return q.replace(/\/$/, "");
    } catch {}
    return window.location.origin;
  }

  function $(id) { return document.getElementById(id); }

  function show(which) {
    ["screen-login", "screen-picker", "screen-live"].forEach((id) => {
      $(id).hidden = id !== which;
    });
  }

  async function api(path, options) {
    const init = Object.assign(
      {
        method: "GET",
        headers: { "content-type": "application/json" },
      },
      options || {},
    );
    if (state.token) {
      init.headers["authorization"] = "Bearer " + state.token;
    }
    const res = await fetch(ORIGIN + path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data && data.error) || "request_failed");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ---------------- Login ---------------- */

  async function doLogin(e) {
    e.preventDefault();
    const email = $("login-email").value.trim();
    const password = $("login-password").value;
    const btn = $("login-btn");
    btn.disabled = true;
    $("login-status").textContent = "Anmeldevorgang …";
    $("login-status").className = "status-text";
    try {
      const data = await api(API.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(LS_TOKEN, data.token);
      localStorage.setItem("sh-addin-user", JSON.stringify(data.user));
      $("login-password").value = "";
      await openPicker();
    } catch (err) {
      $("login-status").className = "status-text status-err";
      $("login-status").textContent =
        err.status === 401 ? "E-Mail oder Passwort stimmt nicht." :
        err.status === 429 ? "Zu viele Versuche. Kurz warten." :
        "Anmelden fehlgeschlagen.";
    } finally {
      btn.disabled = false;
    }
  }

  async function doLogout() {
    try {
      await api(API.logout, { method: "POST" });
    } catch {}
    state.token = null;
    state.user = null;
    state.pickedSession = null;
    stopPolling();
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_SESSION);
    localStorage.removeItem("sh-addin-user");
    show("screen-login");
  }

  /* ---------------- Session-Picker ---------------- */

  async function openPicker() {
    show("screen-picker");
    $("picker-user").textContent = state.user
      ? "Eingeloggt als " + (state.user.displayName || state.user.email)
      : "";
    await loadSessions();
  }

  async function loadSessions() {
    const container = $("picker-list");
    container.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    try {
      const data = await api(API.sessions);
      renderSessions(data.sessions || []);
    } catch (err) {
      if (err.status === 401) {
        await doLogout();
        return;
      }
      container.innerHTML =
        '<p class="status-text status-err" style="text-align:center">Konnte Sessions nicht laden.</p>';
    }
  }

  function renderSessions(list) {
    const container = $("picker-list");
    if (list.length === 0) {
      container.innerHTML =
        '<p class="muted" style="text-align:center;padding:12px">' +
        "Keine Sessions gefunden. Starte im Dashboard eine Session." +
        "</p>";
      return;
    }
    container.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "sessions";
    for (const s of list) {
      const live = s.status === "live";
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "session-card";
      btn.type = "button";
      btn.innerHTML =
        '<div class="row" style="justify-content:space-between">' +
          '<span class="session-title"></span>' +
          '<span class="chip ' + (live ? "" : "chip--ended") + '">' +
            (live ? "Live" : "Beendet") +
          '</span>' +
        '</div>' +
        '<div class="session-meta"></div>';
      btn.querySelector(".session-title").textContent = s.handoutTitle;
      const when = new Date(s.startedAt).toLocaleString("de-DE", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      });
      btn.querySelector(".session-meta").textContent =
        "gestartet " + when + " · Folie " + s.currentSlide +
        " · " + s.audienceCount + " Hörer";
      btn.addEventListener("click", function () { connect(s); });
      // Grau-out für beendete Sessions — klicken aber weiter erlaubt
      // (falls der User zurück zu seiner Edit-Sitzung will).
      if (!live) btn.style.opacity = "0.7";
      li.appendChild(btn);
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  /* ---------------- Live-Mode ---------------- */

  function connect(session) {
    state.pickedSession = session;
    state.lastSlide = 0;
    localStorage.setItem(LS_SESSION, JSON.stringify(session));
    show("screen-live");
    $("live-handout-title").textContent = session.handoutTitle;
    $("live-chip").textContent = session.status === "live" ? "Verbunden (live)" : "Verbunden";
    $("live-status").textContent = "Warte auf erste Folie …";
    startPolling();
    pushSlideOnce();
    updateViewBadge();
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function startPolling() {
    stopPolling();
    // 700 ms ist der Sweet-Spot: schnell genug für natürliches Umblättern,
    // schonend genug für Convex (1.4 Calls/s im Worst-Case).
    state.pollTimer = setInterval(function () {
      pushSlideOnce();
      updateViewBadge();
    }, 700);
  }

  function updateViewBadge() {
    const badge = $("live-view-badge");
    if (!badge) return;
    Office.context.document.getActiveViewAsync(function (r) {
      if (r.status !== Office.AsyncResultStatus.Succeeded) {
        badge.textContent = "Unbekannt";
        return;
      }
      const v = r.value;
      // "edit" = Normal-Ansicht, "read" = Slideshow/Lese-Ansicht
      badge.textContent = v === "read" ? "Slideshow" : "Bearbeiten";
    });
  }

  /**
   * Aktuelle Folien-Nummer ermitteln und — falls geändert — ans Backend
   * pushen. In **beiden** Views (edit + read) liefert getSelectedDataAsync
   * mit SlideRange das aktuell selektierte/angezeigte Slide-Objekt samt
   * `index` (1-basiert).
   */
  function pushSlideOnce() {
    if (!state.pickedSession) return;
    if (state.sending) return;

    try {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.SlideRange,
        { valueFormat: Office.ValueFormat.Unformatted },
        function (res) {
          if (res.status !== Office.AsyncResultStatus.Succeeded) return;
          const slides =
            res.value && res.value.slides && res.value.slides.length > 0
              ? res.value.slides
              : null;
          if (!slides) return;
          const idx = slides[0].index | 0;
          if (idx <= 0) return;
          if (idx === state.lastSlide) return;
          void sendAdvance(idx);
        },
      );
    } catch {
      /* Office nicht bereit — next tick versucht's nochmal. */
    }
  }

  async function sendAdvance(slideNumber) {
    if (!state.pickedSession) return;
    state.sending = true;
    try {
      await api(API.advance, {
        method: "POST",
        body: JSON.stringify({
          presenterSessionId: state.pickedSession.id,
          slideNumber,
        }),
      });
      state.lastSlide = slideNumber;
      $("slide-no").textContent = slideNumber;
      $("live-status").className = "status-text status-ok";
      $("live-status").textContent =
        "Letzter Wechsel: Folie " + slideNumber;
    } catch (err) {
      if (err.status === 401) {
        await doLogout();
        return;
      }
      if (err.status === 403 || err.status === 404) {
        state.pickedSession = null;
        localStorage.removeItem(LS_SESSION);
        $("live-status").className = "status-text status-err";
        $("live-status").textContent =
          "Session nicht mehr aktiv. Bitte neu auswählen.";
        stopPolling();
        setTimeout(openPicker, 1200);
      } else {
        $("live-status").className = "status-text status-err";
        $("live-status").textContent = "Fehler: " + (err.message || err);
      }
    } finally {
      state.sending = false;
    }
  }

  /* ---------------- Bootstrap ---------------- */

  function hydrate() {
    const token = localStorage.getItem(LS_TOKEN);
    const userStr = localStorage.getItem("sh-addin-user");
    if (!token) return null;
    state.token = token;
    try { state.user = userStr ? JSON.parse(userStr) : null; } catch {}
    return token;
  }

  Office.onReady(function (info) {
    if (info.host !== Office.HostType.PowerPoint) {
      document.body.innerHTML =
        '<main style="padding:16px">Dieser Add-in ist nur für PowerPoint.</main>';
      return;
    }

    // Form-Handler
    $("login-form").addEventListener("submit", doLogin);
    $("picker-logout").addEventListener("click", doLogout);
    $("live-logout").addEventListener("click", doLogout);
    $("picker-refresh").addEventListener("click", loadSessions);
    $("live-switch").addEventListener("click", function () {
      stopPolling();
      state.pickedSession = null;
      localStorage.removeItem(LS_SESSION);
      openPicker();
    });

    // Hydrate aus localStorage
    if (hydrate()) {
      const cached = localStorage.getItem(LS_SESSION);
      if (cached) {
        try {
          const session = JSON.parse(cached);
          connect(session);
          return;
        } catch {}
      }
      openPicker();
      return;
    }
    show("screen-login");

    // Zusätzlicher Edit-Mode-Trigger — liefert synchron bei Klicks in die
    // Slide-Navigator-Leiste.
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      pushSlideOnce,
    );
  });
})();
