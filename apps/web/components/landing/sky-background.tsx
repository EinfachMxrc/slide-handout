/**
 * Sky-Background — fotografisch wirkender Himmel ohne externes Bild.
 *
 * Drei Layer:
 *   1. .sky-bg Gradient (definiert in globals.css)
 *   2. SVG-Cloud-Cluster mit feathered Edges (turbulence-Filter)
 *   3. Subtile Vignette für Tiefe
 *
 * Inspiriert vom Air-Hero (air.inc) — dort ist es ein Foto, hier
 * komplett CSS/SVG, damit kein Bild-Asset durch CI/Caddy muss und der
 * Payload klein bleibt.
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
          {/* Soft-Cloud-Filter: Turbulence + Displacement = wattige Kanten */}
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
          <radialGradient id="cloud-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hintere, langsam treibende Wolken-Layer (großflächig, weich) */}
        <g className="cloud-drift-slow" filter="url(#cloud-soft)" opacity="0.85">
          <ellipse cx="180" cy="160" rx="220" ry="55" fill="url(#cloud-fade)" />
          <ellipse cx="1180" cy="120" rx="260" ry="65" fill="url(#cloud-fade)" />
          <ellipse cx="720" cy="80" rx="180" ry="40" fill="url(#cloud-fade)" />
        </g>

        {/* Mittlere Layer */}
        <g className="cloud-drift-mid" filter="url(#cloud-fluffy)" opacity="0.92">
          <ellipse cx="320" cy="280" rx="180" ry="50" fill="url(#cloud-fade)" />
          <ellipse cx="980" cy="320" rx="220" ry="58" fill="url(#cloud-fade)" />
          <ellipse cx="60"  cy="420" rx="160" ry="45" fill="url(#cloud-fade)" />
        </g>

        {/* Vordere, schnelle Layer */}
        <g className="cloud-drift-fast" filter="url(#cloud-fluffy)" opacity="0.95">
          <ellipse cx="1280" cy="540" rx="240" ry="60" fill="url(#cloud-fade)" />
          <ellipse cx="160"  cy="640" rx="200" ry="55" fill="url(#cloud-fade)" />
          <ellipse cx="640"  cy="780" rx="280" ry="70" fill="url(#cloud-fade)" />
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
