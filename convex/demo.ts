import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { initialRank, rankAfter } from "./lexorank";
import type { Id, Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Demo-Content-Seed.
 *
 * Inhaltlich ein 1:1-Aufzug des Fachreferats „SQL-Injection als Angriffsvektor"
 * (FOS 12, FOW12B). Aufgeteilt in slide-getriggerte Blöcke, mit zwei
 * Terminal-Blöcken für den klassischen UNSICHER/SICHER-Vergleich. Die
 * Tipp-Animation der Terminal-Blöcke greift beim Scroll-In via
 * IntersectionObserver — perfekt zum Live-Reveal.
 */

const ACCENT = "#5fbfbf";

type BlockArgs = {
  rank: string;
  title: string;
  markdown: string;
  trigger: "slide" | "always" | "manual";
  slideNumber?: number;
  layout?:
    | "default"
    | "centered"
    | "wide"
    | "compact"
    | "terminal";
  terminalVariant?: "neutral" | "success" | "danger";
  terminalLabel?: string;
  fontSize?: "sm" | "base" | "lg" | "xl";
};

async function insertBlock(
  ctx: MutationCtx,
  handoutId: Id<"handouts">,
  args: BlockArgs,
  now: number,
): Promise<Id<"blocks">> {
  return await ctx.db.insert("blocks", {
    handoutId,
    rank: args.rank,
    title: args.title,
    markdown: args.markdown,
    trigger: args.trigger,
    slideNumber: args.slideNumber,
    layout: args.layout ?? "default",
    terminalVariant: args.terminalVariant,
    terminalLabel: args.terminalLabel,
    imagePosition: "top",
    fontSize: args.fontSize ?? "base",
    createdAt: now,
    updatedAt: now,
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

async function createDemoHandout(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Id<"handouts">> {
  const now = Date.now();
  const handoutId = await ctx.db.insert("handouts", {
    ownerId: userId,
    title: "SQL-Injection als Angriffsvektor",
    description:
      "Fachreferat Informatik · FOS 12 · FOW12B — wie SQL-Injection entsteht, wie man sie verhindert, wer dafür verantwortlich ist.",
    slug: "sql-injection-fachreferat",
    publicToken: randomToken(),
    accentColor: ACCENT,
    readerTheme: "dark",
    fontFamily: "sans",
    footerMarkdown:
      "**Marc Zentgraf · FOW12B**  ·  Fachreferat Informatik, FOS 12.  \n" +
      "Quellen: OWASP Top 10:2021 · OWASP Cheat Sheets · BSI IT-Grundschutz CON.10 / ORP.4 · " +
      "MITRE CWE-89 · NIST SP 800-218 · ICO TalkTalk Report · Art. 32 DSGVO.\n\n" +
      "Demo-Handout · *read-only* · [eigenen Account anlegen](/register)",
    createdAt: now,
    updatedAt: now,
  });

  let rank = initialRank();
  const next = (): string => {
    const r = rank;
    rank = rankAfter(rank);
    return r;
  };

  // ── 1 · Always-Block: Titel & Leitfrage (vor Reveal-Start sichtbar) ────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "Leitfrage",
      trigger: "always",
      layout: "centered",
      fontSize: "lg",
      markdown:
        "**SQL-Injection als Angriffsvektor**  \n" +
        "*Funktionsweise · Prävention · Verantwortung*\n\n" +
        "> Wie entsteht SQL-Injection in Web-Anwendungen, welche Maßnahmen " +
        "verhindern sie am zuverlässigsten, und wer trägt die Hauptverantwortung " +
        "für die konsequente Umsetzung?",
    },
    now,
  );

  // ── 2 · Folie 2: Definition ────────────────────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "1. Was ist SQL-Injection?",
      trigger: "slide",
      slideNumber: 2,
      markdown:
        "SQL-Injection entsteht, wenn eine Anwendung **Nutzereingaben so in eine " +
        "SQL-Abfrage übernimmt, dass die Datenbank Teile der Eingabe als " +
        "Anweisungslogik interpretiert**.\n\n" +
        "**Ursache:** fehlende Trennung zwischen\n\n" +
        "- **Code** — der SQL-Anweisung\n" +
        "- **Daten** — der Eingabe\n\n" +
        "*Quellen: OWASP A03 · MITRE CWE-89 · OWASP Community.*",
    },
    now,
  );

  // ── 3 · Folie 3: UNSICHER (Terminal/Danger) ────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "2. Prinzipbeispiel — Unsicher",
      trigger: "slide",
      slideNumber: 3,
      layout: "terminal",
      terminalVariant: "danger",
      terminalLabel: "UNSICHER · String-Verkettung",
      markdown:
        "$ app.py # unsafe\n" +
        "\n" +
        'sql = "SELECT id FROM users\n' +
        "       WHERE name = '\" + input + \"'\"\n" +
        "\n" +
        "# Eingabe wird Teil der SQL-Logik\n" +
        "# -> Boundary-Fehler",
    },
    now,
  );

  // ── 4 · Folie 3: SICHER (Terminal/Success) ─────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "2. Prinzipbeispiel — Sicher",
      trigger: "slide",
      slideNumber: 3,
      layout: "terminal",
      terminalVariant: "success",
      terminalLabel: "SICHER · Prepared Statement",
      markdown:
        "$ app.py # prepared\n" +
        "\n" +
        'sql = "SELECT id FROM users\n' +
        '       WHERE name = ?"\n' +
        "execute(sql, [input])\n" +
        "\n" +
        "# Struktur fest, Wert separat gebunden\n" +
        "# -> Code & Daten getrennt",
    },
    now,
  );

  // ── 5 · Folie 4: Schutzmaßnahmen ───────────────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "3. Schutzmaßnahmen",
      trigger: "slide",
      slideNumber: 4,
      markdown:
        "- **Prepared Statements / Parameterisierung**  \n" +
        "  Strukturelle Trennung von Code und Daten.  \n" +
        "  *BSI CON.10.A9 fordert dies verbindlich.*\n" +
        "- **Serverseitige Input-Validierung**  \n" +
        "  Typ, Länge, Wertebereich, Allowlist.  \n" +
        "  *Pflicht — kein Ersatz für Parameterisierung.*\n" +
        "- **Least Privilege**  \n" +
        "  DB-Account der Web-App nur mit minimal nötigen Rechten.\n" +
        "- **Code-Review + automatisierte Tests**  \n" +
        "  SAST · DAST · IAST integriert in CI/CD.\n" +
        "- **Patch- und Schwachstellenmanagement, Monitoring**  \n" +
        "  Damit bekannte Lücken nicht jahrelang offen bleiben.",
    },
    now,
  );

  // ── 6 · Folie 5: Praxisfall TalkTalk ───────────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "4. Praxisfall TalkTalk (2015)",
      trigger: "slide",
      slideNumber: 5,
      markdown:
        "**156 959** Kundendatensätze betroffen — **15 656** davon mit Bankdaten.\n\n" +
        "**Hauptursachen** laut ICO-Bericht:\n\n" +
        "- Alte Webseiten aus übernommener Infrastruktur\n" +
        "- Veraltete Datenbanksoftware\n" +
        "- Ein **seit 3,5 Jahren verfügbarer Fix** — nicht eingespielt\n" +
        "- Kein proaktives Monitoring trotz früherer Angriffe\n\n" +
        "> SQL-Injection war zwar der Angriffsvektor — der eigentliche Schaden " +
        "entstand durch **Organisationsversagen**.",
    },
    now,
  );

  // ── 7 · Folie 6: Verantwortung ─────────────────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "5. Verantwortung",
      trigger: "slide",
      slideNumber: 6,
      markdown:
        "**Entwickler** tragen die *unmittelbare* Verantwortung — sichere Muster " +
        "programmieren, Parameterisierung und serverseitige Validierung " +
        "konsequent einsetzen.\n\n" +
        "**Hauptverantwortung** trägt jedoch das **Unternehmen / Management**:  \n" +
        "Prozesse, Code-Reviews, Patch-Fenster, Monitoring, Sicherheitskultur — " +
        "verbindlich organisiert.\n\n" +
        "**Belege:**\n\n" +
        "- *NIST Secure Software Development Framework (SP 800-218)* definiert " +
        "Secure Development ausdrücklich als Organisationsaufgabe.\n" +
        "- *Art. 32 DSGVO* verlangt technische **und** organisatorische " +
        "Maßnahmen mit regelmäßiger Wirksamkeitsprüfung.\n" +
        "- *TalkTalk* zeigt empirisch: ohne diese Rahmenbedingungen bleiben " +
        "selbst bekannte Lücken jahrelang offen.",
    },
    now,
  );

  // ── 8 · Folie 7: Fazit ─────────────────────────────────────────────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "6. Fazit",
      trigger: "slide",
      slideNumber: 7,
      layout: "centered",
      fontSize: "lg",
      markdown:
        "SQL-Injection entsteht durch fehlende Trennung von **Code** und **Daten**.\n\n" +
        "Am zuverlässigsten verhindert durch **Prepared Statements** + " +
        "serverseitige Validierung + ergänzende Schichten:\n\n" +
        "*Least Privilege · Reviews & Tests · Patch- und Monitoring.*\n\n" +
        "> Hauptverantwortung liegt beim **Unternehmen** —  \n" +
        "> Entwickler setzen sie im Code um.",
    },
    now,
  );

  // ── 9 · Quellen — manuell, falls Vortragender sie zeigen will ──────────────
  await insertBlock(
    ctx,
    handoutId,
    {
      rank: next(),
      title: "Literaturverzeichnis",
      trigger: "manual",
      layout: "compact",
      fontSize: "sm",
      markdown:
        "1. OWASP Foundation. **OWASP Top 10:2021 — A03 Injection**. 2021. " +
        "[owasp.org/Top10/2021/A03_2021-Injection](https://owasp.org/Top10/2021/A03_2021-Injection/)\n" +
        "2. OWASP. **SQL Injection Prevention Cheat Sheet**. 2024. " +
        "[cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)\n" +
        "3. OWASP Community. **SQL Injection**. 2024. " +
        "[owasp.org/www-community/attacks/SQL_Injection](https://owasp.org/www-community/attacks/SQL_Injection)\n" +
        "4. MITRE. **CWE-89 — Improper Neutralization of SQL Elements**. 2024. " +
        "[cwe.mitre.org/data/definitions/89.html](https://cwe.mitre.org/data/definitions/89.html)\n" +
        "5. BSI. **IT-Grundschutz-Kompendium · CON.10 Webanwendungen**. Edition 2023.\n" +
        "6. OWASP. **Input Validation Cheat Sheet**. 2024.\n" +
        "7. BSI. **ORP.4 Identitäts- und Berechtigungsmanagement**. Edition 2023.\n" +
        "8. BSI. **Webanwendungen — Patch- und Schwachstellenmanagement**. 2024.\n" +
        "9. ICO. **TalkTalk cyber attack — how the ICO's investigation unfolded**. 2016.\n" +
        "10. M. Souppaya, K. Scarfone, D. Dodson. **NIST SP 800-218 — Secure Software Development Framework v1.1**. Feb. 2022.\n" +
        "11. Europäische Union. **Art. 32 DSGVO — Sicherheit der Verarbeitung**. 2016.",
    },
    now,
  );

  return handoutId;
}

/**
 * Idempotent: legt das SQL-Injection-Demo-Handout an, wenn der Demo-User
 * noch keins besitzt. Wird vom `/api/auth/demo`-Login-Pfad bei jedem
 * Klick aufgerufen.
 */
export const seedIfEmpty = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user: Doc<"users"> | null = await ctx.db.get(userId);
    if (!user || !user.isDemo) throw new Error("NOT_A_DEMO_USER");

    const existing = await ctx.db
      .query("handouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
    if (existing) return existing._id;

    return await createDemoHandout(ctx, userId);
  },
});

/**
 * Reset + Reseed in einer Transaktion. Nach Seed-Material-Änderung den
 * existierenden Demo-User auf frischen Stand bringen ohne dass der
 * `seedIfEmpty`-Idempotenz-Check blockt.
 */
export const reseed = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user: Doc<"users"> | null = await ctx.db.get(userId);
    if (!user || !user.isDemo) throw new Error("NOT_A_DEMO_USER");

    await wipeDemoData(ctx, userId);
    return await createDemoHandout(ctx, userId);
  },
});

async function wipeDemoData(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const handouts = await ctx.db
    .query("handouts")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  for (const h of handouts) {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_handout_rank", (q) => q.eq("handoutId", h._id))
      .collect();
    await Promise.all(blocks.map((b) => ctx.db.delete(b._id)));

    const sessions = await ctx.db
      .query("presenterSessions")
      .withIndex("by_handout", (q) => q.eq("handoutId", h._id))
      .collect();
    for (const s of sessions) {
      const reveals = await ctx.db
        .query("reveals")
        .withIndex("by_session_revealedAt", (q) =>
          q.eq("presenterSessionId", s._id),
        )
        .collect();
      await Promise.all(reveals.map((r) => ctx.db.delete(r._id)));

      const heartbeats = await ctx.db
        .query("audienceHeartbeats")
        .withIndex("by_session_lastSeenAt", (q) =>
          q.eq("presenterSessionId", s._id),
        )
        .collect();
      await Promise.all(heartbeats.map((hb) => ctx.db.delete(hb._id)));

      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(h._id);
  }
}

/** Reset für Tests — alle Handouts/Sessions/Reveals des Demo-Users löschen. */
export const resetDemo = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user: Doc<"users"> | null = await ctx.db.get(userId);
    if (!user || !user.isDemo) throw new Error("NOT_A_DEMO_USER");
    await wipeDemoData(ctx, userId);
  },
});

export const findDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.find((u) => u.isDemo) ?? null;
  },
});
