/* global Office */
/**
 * Slide Handout — PowerPoint Add-in runtime.
 *
 * Flow:
 *   1. User types pairing code (from presenter dashboard).
 *   2. We POST {action:"bind"} and cache sessionId + code in localStorage.
 *   3. We listen for PowerPoint's SlideSelectionChanged event and POST
 *      {action:"advance", slideNumber} on each change.
 *
 * The Office.js SlideSelectionChanged event fires both in Normal view
 * (when the presenter clicks a slide) and Slideshow view (when they advance
 * during the actual presentation). That covers the whole preparation →
 * live-talk flow.
 */
(function () {
  "use strict";

  const API = "https://handout.einfachmxrc.de/api/slide-advance";
  const LS_KEY = "slide-handout-addin";

  const els = {};
  let state = { sessionId: null, code: null, lastSlide: 0 };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text, kind) {
    els.pairStatus.textContent = text || "";
    els.pairStatus.className = "status" + (kind ? " " + kind : "");
  }

  function setLiveStatus(text) {
    els.liveStatus.textContent = text;
  }

  function showLive() {
    $("pairing").hidden = true;
    $("live").hidden = false;
    $("slide-no").textContent = state.lastSlide || "–";
  }

  function showPairing() {
    $("pairing").hidden = false;
    $("live").hidden = true;
    setStatus("", null);
  }

  async function post(body) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data && data.error ? data.error : "request_failed");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function bind(code) {
    setStatus("Verbinde …", null);
    try {
      const res = await post({ action: "bind", pairingCode: code });
      state.sessionId = res.presenterSessionId;
      state.code = code;
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      setStatus("Verbunden!", "ok");
      showLive();
      // Push the currently-selected slide once, so existing slide-bound
      // blocks show up immediately.
      pushCurrentSlide();
    } catch (e) {
      let msg = "Unbekannter Fehler.";
      if (e.status === 404) msg = "Code nicht gefunden. Schon abgelaufen?";
      else if (e.status === 400) msg = "Ungültiger Code.";
      else if (e.status === 429) msg = "Zu viele Versuche. Kurz warten.";
      setStatus(msg, "err");
    }
  }

  async function advance(slideNumber) {
    if (!state.sessionId) return;
    try {
      await post({
        action: "advance",
        pairingCode: state.code,
        presenterSessionId: state.sessionId,
        slideNumber,
      });
      state.lastSlide = slideNumber;
      $("slide-no").textContent = slideNumber;
      setLiveStatus("Letzter Wechsel: Folie " + slideNumber);
    } catch (e) {
      // Pairing code was rotated or session ended — drop back to pairing.
      if (e.status === 403 || e.status === 404) {
        disconnect();
        setStatus(
          "Sitzung wurde beendet oder der Code wurde erneuert.",
          "err",
        );
      } else {
        setLiveStatus("Fehler beim Senden: " + (e.message || e));
      }
    }
  }

  /**
   * Read the currently selected slide and POST advance.
   * In Normal view: that's the slide on the canvas.
   * In Slideshow view: fires per slide change as well.
   */
  function pushCurrentSlide() {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.SlideRange,
      function (r) {
        if (r.status !== Office.AsyncResultStatus.Succeeded) return;
        const slides = r.value && r.value.slides;
        if (!slides || slides.length === 0) return;
        const idx = slides[0].index; // 1-based
        if (idx !== state.lastSlide) advance(idx);
      },
    );
  }

  function disconnect() {
    state = { sessionId: null, code: null, lastSlide: 0 };
    localStorage.removeItem(LS_KEY);
    showPairing();
  }

  Office.onReady(function (info) {
    if (info.host !== Office.HostType.PowerPoint) {
      document.body.innerHTML =
        '<main style="padding:16px">Dieser Add-in ist nur für PowerPoint.</main>';
      return;
    }

    els.pairStatus = $("pair-status");
    els.liveStatus = $("live-status");

    // Hydrate from localStorage on reload.
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (cached && cached.sessionId && cached.code) {
        state = { ...cached, lastSlide: 0 };
        showLive();
        pushCurrentSlide();
      }
    } catch {
      /* ignore */
    }

    $("pairing-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const code = $("code").value.replace(/\D/g, "").slice(0, 6);
      if (code.length !== 6) {
        setStatus("Bitte 6 Ziffern eingeben.", "err");
        return;
      }
      bind(code);
    });

    $("disconnect").addEventListener("click", disconnect);

    // Listen for slide changes from PowerPoint.
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      pushCurrentSlide,
    );
  });
})();
