/**
 * Sky-Background — fotografisch wirkender Himmel ohne externes Bild.
 *
 * Vier Layer für einen "lebendigen" Himmel:
 *   1. .sky-bg Gradient (definiert in globals.css) — Farbstimmung
 *   2. Langsame Hintergrund-Wolken (groß, weich, feathered)
 *   3. Mittlere und schnellere Drift-Wolken
 *   4. Dünne "Wisp"-Schleier die schnell durchziehen
 *
 * Alle Layer animieren via CSS-Keyframes mit unterschiedlichen Tempi und
 * Trajektorien → echtes Himmel-Parallax-Gefühl. Der Text-Wordmark schwebt
 * darüber im Luftraum.
 */
export function SkyBackground(): React.ReactElement {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden sky-bg">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="cloud-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.022"
              numOctaves="2"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" scale="40" />
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="cloud-fluffy" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.03"
              numOctaves="3"
              seed="11"
            />
            <feDisplacementMap in="SourceGraphic" scale="28" />
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="cloud-wisp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.018"
              numOctaves="2"
              seed="19"
            />
            <feDisplacementMap in="SourceGraphic" scale="55" />
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <radialGradient id="cloud-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wisp-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1 — Hinterste, langsamste Wolken (großflächig) */}
        <g
          className="cloud-drift-slow"
          filter="url(#cloud-soft)"
          opacity="0.9"
          style={{ transformOrigin: "50% 50%" }}
        >
          <ellipse cx="180" cy="140" rx="260" ry="62" fill="url(#cloud-fade)" />
          <ellipse cx="1180" cy="100" rx="300" ry="72" fill="url(#cloud-fade)" />
          <ellipse cx="720" cy="70" rx="220" ry="50" fill="url(#cloud-fade)" />
          <ellipse cx="480" cy="200" rx="200" ry="48" fill="url(#cloud-fade)" />
          <ellipse cx="1340" cy="260" rx="180" ry="42" fill="url(#cloud-fade)" />
        </g>

        {/* Layer 2 — Mittlere Wolken, moderates Tempo */}
        <g
          className="cloud-drift-mid"
          filter="url(#cloud-fluffy)"
          opacity="0.95"
          style={{ transformOrigin: "50% 50%" }}
        >
          <ellipse cx="320" cy="290" rx="200" ry="55" fill="url(#cloud-fade)" />
          <ellipse cx="980" cy="330" rx="240" ry="62" fill="url(#cloud-fade)" />
          <ellipse cx="60" cy="420" rx="180" ry="48" fill="url(#cloud-fade)" />
          <ellipse cx="1380" cy="440" rx="200" ry="52" fill="url(#cloud-fade)" />
          <ellipse cx="620" cy="380" rx="150" ry="38" fill="url(#cloud-fade)" />
        </g>

        {/* Layer 3 — Vordere, schnellere Wolken (tiefer am Horizont) */}
        <g
          className="cloud-drift-fast"
          filter="url(#cloud-fluffy)"
          opacity="0.96"
          style={{ transformOrigin: "50% 50%" }}
        >
          <ellipse cx="1280" cy="540" rx="260" ry="65" fill="url(#cloud-fade)" />
          <ellipse cx="160" cy="640" rx="220" ry="60" fill="url(#cloud-fade)" />
          <ellipse cx="640" cy="780" rx="300" ry="78" fill="url(#cloud-fade)" />
          <ellipse cx="1100" cy="700" rx="220" ry="55" fill="url(#cloud-fade)" />
          <ellipse cx="380" cy="830" rx="180" ry="45" fill="url(#cloud-fade)" />
        </g>

        {/* Layer 4 — Dünne Schleier (Wisps), schnell, zart */}
        <g
          className="cloud-drift-wisp"
          filter="url(#cloud-wisp)"
          opacity="0.7"
          style={{ transformOrigin: "50% 50%" }}
        >
          <ellipse cx="240" cy="260" rx="320" ry="22" fill="url(#wisp-fade)" />
          <ellipse cx="860" cy="180" rx="380" ry="18" fill="url(#wisp-fade)" />
          <ellipse cx="1200" cy="380" rx="280" ry="24" fill="url(#wisp-fade)" />
          <ellipse cx="500" cy="510" rx="340" ry="20" fill="url(#wisp-fade)" />
        </g>
      </svg>

      {/* Bodennahe Wärme-Vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.35) 100%)",
        }}
      />
    </div>
  );
}
