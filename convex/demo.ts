import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { initialRank, rankAfter } from "./lexorank";
import type { Id } from "./_generated/dataModel";

/**
 * Demo-Content-Seed. Idempotent — wenn der Demo-User noch keine Handouts
 * besitzt, wird das Beispiel-Handout "SQL Injection" erstellt (inkl.
 * Terminal-Blöcke, die den Slide-Reveal-Flow veranschaulichen).
 *
 * Alle Schreib-Ops des Demo-Users werden ohnehin von `assertNotDemo`
 * geblockt — das Seeding läuft unter Server-Trust via `ConvexHttpClient`
 * (Deploy-Key, dieselbe Tür wie der Auth.js-Register-Flow).
 */
export const seedIfEmpty = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.isDemo) throw new Error("NOT_A_DEMO_USER");

    const existing = await ctx.db
      .query("handouts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    const publicToken = randomToken();
    const handoutId = await ctx.db.insert("handouts", {
      ownerId: userId,
      title: "Was ist SQL Injection?",
      description:
        "Fachreferat: wie funktioniert SQL Injection und wie schützt man sich? Sicher vs. unsicher im direkten Vergleich.",
      slug: "was-ist-sql-injection",
      publicToken,
      accentColor: "#5fbfbf",
      readerTheme: "dark",
      fontFamily: "sans",
      footerMarkdown:
        "Demo-Handout von Slide Handout · **Read-only**. Lege dir [deinen eigenen Account](/register) an, um eigene Handouts zu erstellen.",
      createdAt: now,
      updatedAt: now,
    });

    // Blöcke — in der Reihenfolge, wie sie im Vortrag erscheinen.
    let rank = initialRank();
    const addBlock = async (
      override: Partial<{
        title: string;
        markdown: string;
        trigger: "slide" | "always" | "manual";
        slideNumber: number;
        layout: "default" | "centered" | "wide" | "compact" | "terminal";
        terminalVariant: "neutral" | "success" | "danger";
        terminalLabel: string;
        fontSize: "sm" | "base" | "lg" | "xl";
        imagePosition: "top" | "bottom" | "left" | "right" | "full" | "background";
      }>,
    ): Promise<Id<"blocks">> => {
      const id = await ctx.db.insert("blocks", {
        handoutId,
        rank,
        title: override.title ?? "Block",
        markdown: override.markdown ?? "",
        trigger: override.trigger ?? "manual",
        slideNumber: override.slideNumber,
        layout: override.layout ?? "default",
        terminalVariant: override.terminalVariant,
        terminalLabel: override.terminalLabel,
        imagePosition: override.imagePosition ?? "top",
        fontSize: override.fontSize ?? "base",
        createdAt: now,
        updatedAt: now,
      });
      rank = rankAfter(rank);
      return id;
    };

    // 1. Einleitung — immer sichtbar (die Zuhörer haben etwas zum Lesen,
    // bevor der Vortragende den ersten Reveal triggert).
    await addBlock({
      title: "Einleitung",
      trigger: "always",
      markdown:
        "## Worum geht's?\n\n" +
        "SQL Injection ist eine der ältesten und immer noch häufigsten " +
        "Schwachstellen in Web-Anwendungen. Dieser Vortrag zeigt an einem " +
        "einzigen Code-Unterschied, wie eine App verwundbar wird — und wie " +
        "sie sicher bleibt.\n\n" +
        "> Klicke im Reader auf **Drucken**, um dieses Handout als PDF zu speichern.",
    });

    // 2. Unsicheres Beispiel (Terminal, Gefahr)
    await addBlock({
      title: "Unsicher · String-Verkettung",
      trigger: "manual",
      layout: "terminal",
      terminalVariant: "danger",
      terminalLabel: "UNSICHER · String-Verkettung",
      markdown:
        '$ app.py # unsafe\n' +
        '\n' +
        'sql = "SELECT id FROM users\n' +
        '       WHERE name = \'" + input + "\'"\n' +
        '\n' +
        "# Eingabe wird Teil der SQL-Logik\n" +
        "# -> Boundary-Fehler",
    });

    // 3. Sicheres Gegenbeispiel (Terminal, Erfolg)
    await addBlock({
      title: "Sicher · Prepared Statement",
      trigger: "manual",
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
    });

    // 4. Fallbeispiel (manuell, normale Darstellung)
    await addBlock({
      title: "Was passiert, wenn input = \"' OR 1=1 --\" ist?",
      trigger: "manual",
      markdown:
        "Bei String-Verkettung wird aus der Abfrage:\n\n" +
        "```sql\n" +
        "SELECT id FROM users WHERE name = '' OR 1=1 -- '\n" +
        "```\n\n" +
        "`1=1` ist immer wahr → die WHERE-Klausel wird wirkungslos.\n" +
        "Die gesamte `users`-Tabelle wird zurückgegeben.",
    });

    // 5. Take-aways (manuell)
    await addBlock({
      title: "Take-aways",
      trigger: "manual",
      fontSize: "lg",
      markdown:
        "1. **Niemals** User-Input direkt in SQL-Strings einbetten.\n" +
        "2. Prepared Statements nutzen — das ORM oder die DB-Bibliothek " +
        "erledigt das Escaping richtig.\n" +
        "3. Parameter-Binding trennt **Struktur** von **Werten**.\n" +
        "4. Defense-in-Depth: zusätzlich Input-Validation + Least-Privilege-DB-User.",
    });

    return handoutId;
  },
});

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

/** Reset für Tests: alle Handouts des Demo-Users löschen. Nicht genutzt im UI. */
export const resetDemo = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.isDemo) throw new Error("NOT_A_DEMO_USER");

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
        await ctx.db.delete(s._id);
      }
      await ctx.db.delete(h._id);
    }
  },
});

/** Findet den (einzigen) Demo-User oder `null`. */
export const findDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const demos = await ctx.db
      .query("users")
      .collect();
    return demos.find((u) => u.isDemo) ?? null;
  },
});
