// =============================================================
// AAC HIGH IMPACT ROADMAP · ILLUSTRATIONS
// =============================================================
// 12 hand-crafted SVG metaphors (one per Law) + PPP Venn + Two Drivers panel.
// Use `currentColor` so they pick up the surrounding text color
// (gold by default, dim gray when the law is pending).
//
// DO NOT redraw these. Copy them verbatim into your codebase.
// They were designed against the AAC palette and have specific
// metaphors tied to each law's teaching.

/**
 * One small SVG (80x80 viewBox) per law — used both on the law card
 * (small) and in the law detail hero (large).
 */
export const LAW_SVGS: Record<string, string> = {
  // 01 Purpose: Latin cross + forward arrow
  '01': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="68" x2="40" y2="14"/><line x1="28" y1="28" x2="52" y2="28"/><path d="M50 58 L72 58 M65 52 L72 58 L65 64" stroke-width="2"/><line x1="8" y1="74" x2="72" y2="74" opacity="0.35" stroke-width="1"/></svg>',

  // 02 Expectation: Mountain peaks with summit flag
  '02': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 64 L24 36 L34 50 L46 26 L56 38 L74 64 Z"/><line x1="46" y1="26" x2="46" y2="10"/><path d="M46 10 L62 14 L46 18 Z" fill="currentColor" stroke="none"/><path d="M14 70 L66 70" opacity="0.35" stroke-width="1" stroke-dasharray="2 4"/></svg>',

  // 03 Design: Steering wheel + forward arrow
  '03': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="48" r="18"/><circle cx="32" cy="48" r="5"/><line x1="32" y1="30" x2="32" y2="43"/><line x1="32" y1="53" x2="32" y2="66"/><line x1="14" y1="48" x2="27" y2="48"/><line x1="37" y1="48" x2="50" y2="48"/><path d="M52 22 L72 22 M66 16 L72 22 L66 28" stroke-width="2"/></svg>',

  // 04 Liberation: Broken chain
  '04': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="32" width="22" height="16" rx="8"/><rect x="50" y="32" width="22" height="16" rx="8"/><line x1="40" y1="34" x2="40" y2="22" stroke-width="1.6"/><line x1="40" y1="46" x2="40" y2="58" stroke-width="1.6"/><line x1="32" y1="32" x2="26" y2="24" stroke-width="1.6"/><line x1="48" y1="32" x2="54" y2="24" stroke-width="1.6"/><line x1="32" y1="48" x2="26" y2="56" stroke-width="1.6"/><line x1="48" y1="48" x2="54" y2="56" stroke-width="1.6"/></svg>',

  // 05 Dependency: Vine and branch (John 15)
  '05': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M40 72 Q 40 54 32 42 Q 24 30 32 16"/><path d="M 32 38 Q 22 34 16 24"/><path d="M 38 52 Q 52 48 60 38"/><ellipse cx="18" cy="22" rx="5" ry="3" transform="rotate(-30 18 22)"/><ellipse cx="62" cy="36" rx="5" ry="3" transform="rotate(30 62 36)"/><ellipse cx="34" cy="14" rx="5" ry="3" transform="rotate(-15 34 14)"/></svg>',

  // 06 Structure: Three architectural pillars
  '06': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="22" x2="20" y2="62"/><line x1="40" y1="22" x2="40" y2="62"/><line x1="60" y1="22" x2="60" y2="62"/><line x1="12" y1="22" x2="68" y2="22"/><line x1="14" y1="14" x2="66" y2="14"/><line x1="10" y1="62" x2="70" y2="62"/><line x1="14" y1="68" x2="66" y2="68"/></svg>',

  // 07 Inspiration: Torch with flame
  '07': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="34" y="42" width="12" height="28" rx="2"/><path d="M 30 42 L 30 38 L 50 38 L 50 42"/><path d="M 40 32 Q 28 22 40 8 Q 52 22 40 32 Z"/><path d="M 40 28 Q 34 22 40 14" stroke-width="1.5" opacity="0.6"/></svg>',

  // 08 Focus: Concentric bullseye target
  '08': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="40" r="28"/><circle cx="40" cy="40" r="20"/><circle cx="40" cy="40" r="11"/><circle cx="40" cy="40" r="3.5" fill="currentColor" stroke="none"/></svg>',

  // 09 Community: Six figures around a center point
  '09': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="14" r="5"/><circle cx="64" cy="28" r="5"/><circle cx="64" cy="52" r="5"/><circle cx="40" cy="66" r="5"/><circle cx="16" cy="52" r="5"/><circle cx="16" cy="28" r="5"/><circle cx="40" cy="40" r="3" fill="currentColor" stroke="none"/><line x1="40" y1="19" x2="40" y2="37" opacity="0.45" stroke-dasharray="2 3"/><line x1="59" y1="29" x2="43" y2="38" opacity="0.45" stroke-dasharray="2 3"/><line x1="59" y1="51" x2="43" y2="42" opacity="0.45" stroke-dasharray="2 3"/><line x1="40" y1="61" x2="40" y2="43" opacity="0.45" stroke-dasharray="2 3"/><line x1="21" y1="51" x2="37" y2="42" opacity="0.45" stroke-dasharray="2 3"/><line x1="21" y1="29" x2="37" y2="38" opacity="0.45" stroke-dasharray="2 3"/></svg>',

  // 10 Intentionality: Winding path with checkpoint markers
  '10': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M 10 66 Q 22 66 22 52 Q 22 38 34 38 Q 46 38 46 24 Q 46 12 64 12"/><circle cx="10" cy="66" r="3.5" fill="currentColor" stroke="none"/><circle cx="22" cy="52" r="2.5"/><circle cx="34" cy="38" r="2.5"/><circle cx="46" cy="24" r="2.5"/><circle cx="64" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>',

  // 11 Love: Heart with cross
  '11': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M 40 66 Q 12 46 20 28 Q 28 16 40 26 Q 52 16 60 28 Q 68 46 40 66 Z"/><line x1="40" y1="32" x2="40" y2="52" stroke-width="2"/><line x1="33" y1="40" x2="47" y2="40" stroke-width="2"/></svg>',

  // 12 Kingdom: Walled city on a hill with a cross
  '12': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M 6 68 Q 30 60 40 60 Q 50 60 74 68"/><path d="M 16 60 L 16 44 L 24 44 L 24 50 L 32 50 L 32 38 L 48 38 L 48 50 L 56 50 L 56 44 L 64 44 L 64 60"/><line x1="40" y1="38" x2="40" y2="22"/><line x1="34" y1="28" x2="46" y2="28"/></svg>',
};

/**
 * Featured visualizations referenced by `frameworkKey` (on Law) or
 * `featuredVizKey` (on Law.coaching). These are larger than the LAW_SVGS
 * and include their own typography + framing — drop them in as innerHTML.
 *
 * - 'ppp' lives in Law 01's coaching section (above the strategy cards)
 * - 'twoDrivers' lives in Law 03's detail (between insights and pull quote)
 */
export const FEATURED_VISUALS: Record<string, string> = {
  ppp:
    '<div class="ppp-feature">' +
      '<div class="ppp-feature-text">' +
        '<div class="ppp-feature-eyebrow">Framework · Jim Wiegland</div>' +
        '<h3 class="ppp-feature-title">The PPP Framework</h3>' +
        '<p class="ppp-feature-quote">"Where the three circles overlap is their design. Connect them to a ministry — or a mentor — that fits."</p>' +
        '<p class="ppp-feature-explanation">Don\'t recruit the unengaged 50%. <em>Discover</em> them. Three coffee questions reveal the design God built into each one — Passion, Pain, Proficiency — and where those overlap is where they\'ll thrive.</p>' +
      '</div>' +
      '<div class="ppp-feature-svg">' +
        '<svg viewBox="0 0 360 320" xmlns="http://www.w3.org/2000/svg" aria-labelledby="ppp-title" role="img">' +
          '<title id="ppp-title">Venn diagram of Passion, Pain, and Proficiency overlapping at Design</title>' +
          '<circle cx="180" cy="115" r="92" fill="rgba(239,71,111,0.13)" stroke="#ef476f" stroke-width="2.4" stroke-opacity="0.92"/>' +
          '<circle cx="135" cy="200" r="92" fill="rgba(217,179,16,0.13)" stroke="#D9B310" stroke-width="2.4" stroke-opacity="0.92"/>' +
          '<circle cx="225" cy="200" r="92" fill="rgba(50,140,193,0.13)" stroke="#328CC1" stroke-width="2.4" stroke-opacity="0.92"/>' +
          '<circle cx="180" cy="172" r="14" fill="none" stroke="#D9B310" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.7"/>' +
          '<circle cx="180" cy="172" r="7" fill="#D9B310"/>' +
          '<text x="180" y="44" text-anchor="middle" font-family="Gotham, Inter, sans-serif" font-weight="800" font-size="13" fill="#ef476f" letter-spacing="2.5">PASSION</text>' +
          '<text x="180" y="62" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="12" fill="#a3b3c2">what you love</text>' +
          '<text x="60" y="287" text-anchor="middle" font-family="Gotham, Inter, sans-serif" font-weight="800" font-size="13" fill="#D9B310" letter-spacing="2.5">PAIN</text>' +
          '<text x="60" y="305" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="12" fill="#a3b3c2">what breaks you</text>' +
          '<text x="300" y="287" text-anchor="middle" font-family="Gotham, Inter, sans-serif" font-weight="800" font-size="12" fill="#328CC1" letter-spacing="2.5">PROFICIENCY</text>' +
          '<text x="300" y="305" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="12" fill="#a3b3c2">what you do well</text>' +
          '<text x="180" y="206" text-anchor="middle" font-family="Gotham, Inter, sans-serif" font-weight="800" font-size="11" fill="#D9B310" letter-spacing="3">DESIGN</text>' +
        '</svg>' +
      '</div>' +
    '</div>',

  twoDrivers:
    '<section class="law-section framework-section">' +
      '<div class="law-section-label">The Two Drivers</div>' +
      '<p class="framework-intro">Chip\'s defining image: every pastor is at the wheel. The question is which way they\'re facing — and whether they\'re driving alone.</p>' +
      '<div class="framework-panels">' +
        '<div class="framework-panel framework-panel--wrong">' +
          '<div class="framework-panel-tag">The Average Pastor</div>' +
          '<div class="framework-panel-illustration">' +
            '<svg viewBox="0 0 320 220" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Car driving backwards with ministries piled on top">' +
              '<defs><marker id="arr-back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none"/></marker></defs>' +
              // direction arrow (top), pointing left = REVERSE
              '<line x1="240" y1="40" x2="90" y2="40" marker-end="url(#arr-back)" stroke-width="2"/>' +
              '<text x="165" y="28" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="currentColor" stroke="none" letter-spacing="3">REVERSE</text>' +
              // ministries piled on roof (stacked, widest at bottom)
              '<rect x="118" y="55" width="84" height="14" rx="3"/>' +
              '<text x="160" y="65" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2.5">PREACH</text>' +
              '<rect x="112" y="71" width="96" height="14" rx="3"/>' +
              '<text x="160" y="81" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2.5">CARE</text>' +
              '<rect x="106" y="87" width="108" height="14" rx="3"/>' +
              '<text x="160" y="97" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2.5">GROUPS</text>' +
              '<rect x="118" y="103" width="84" height="14" rx="3"/>' +
              '<text x="160" y="113" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2.5">KIDS</text>' +
              // car body (long sedan)
              '<rect x="50" y="125" width="220" height="40" rx="10"/>' +
              // four cabin compartments inside body, with X marks (people not engaged) and one O
              '<line x1="105" y1="125" x2="105" y2="165"/>' +
              '<line x1="160" y1="125" x2="160" y2="165"/>' +
              '<line x1="215" y1="125" x2="215" y2="165"/>' +
              // X X O X (only pastor engaged)
              '<line x1="70" y1="138" x2="88" y2="155"/><line x1="88" y1="138" x2="70" y2="155"/>' +
              '<line x1="120" y1="138" x2="138" y2="155"/><line x1="138" y1="138" x2="120" y2="155"/>' +
              '<circle cx="187" cy="146" r="9"/>' +
              '<line x1="230" y1="138" x2="248" y2="155"/><line x1="248" y1="138" x2="230" y2="155"/>' +
              // wheels
              '<circle cx="95" cy="180" r="16"/>' +
              '<circle cx="95" cy="180" r="3" fill="currentColor" stroke="none"/>' +
              '<circle cx="225" cy="180" r="16"/>' +
              '<circle cx="225" cy="180" r="3" fill="currentColor" stroke="none"/>' +
            '</svg>' +
          '</div>' +
          '<h4 class="framework-panel-label">Backwards-driving</h4>' +
          '<p class="framework-panel-body">Doing all the ministry alone. Every need flows inward. Limits growth at 100. Burns out the pastor. The "average pastor" Chip warns about — admired, exhausted, and capping the church\'s lid.</p>' +
        '</div>' +
        '<div class="framework-panel framework-panel--right">' +
          '<div class="framework-panel-tag">God\'s Design</div>' +
          '<div class="framework-panel-illustration">' +
            '<svg viewBox="0 0 320 220" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Car driving forward with ministries distributed across the team">' +
              '<defs><marker id="arr-fwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none"/></marker></defs>' +
              // direction arrow, pointing right = FORWARD
              '<line x1="80" y1="40" x2="230" y2="40" marker-end="url(#arr-fwd)" stroke-width="2"/>' +
              '<text x="155" y="28" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="currentColor" stroke="none" letter-spacing="3">FORWARD</text>' +
              // ministries distributed in a row above the car
              '<rect x="60" y="80" width="50" height="18" rx="3"/>' +
              '<text x="85" y="92" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2">PREACH</text>' +
              '<rect x="118" y="80" width="50" height="18" rx="3"/>' +
              '<text x="143" y="92" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2">CARE</text>' +
              '<rect x="176" y="80" width="50" height="18" rx="3"/>' +
              '<text x="201" y="92" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2">GROUPS</text>' +
              '<rect x="234" y="80" width="50" height="18" rx="3"/>' +
              '<text x="259" y="92" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" stroke="none" letter-spacing="2">KIDS</text>' +
              // dashed connectors from each ministry to its seat
              '<line x1="85" y1="98" x2="85" y2="125" stroke-dasharray="2 3" opacity="0.55"/>' +
              '<line x1="143" y1="98" x2="143" y2="125" stroke-dasharray="2 3" opacity="0.55"/>' +
              '<line x1="201" y1="98" x2="201" y2="125" stroke-dasharray="2 3" opacity="0.55"/>' +
              '<line x1="259" y1="98" x2="259" y2="125" stroke-dasharray="2 3" opacity="0.55"/>' +
              // car body
              '<rect x="50" y="125" width="220" height="40" rx="10"/>' +
              // cabin dividers
              '<line x1="105" y1="125" x2="105" y2="165"/>' +
              '<line x1="160" y1="125" x2="160" y2="165"/>' +
              '<line x1="215" y1="125" x2="215" y2="165"/>' +
              // four engaged people (O O O O)
              '<circle cx="78" cy="146" r="9"/>' +
              '<circle cx="132" cy="146" r="9"/>' +
              '<circle cx="187" cy="146" r="9"/>' +
              '<circle cx="242" cy="146" r="9"/>' +
              // wheels
              '<circle cx="95" cy="180" r="16"/>' +
              '<circle cx="95" cy="180" r="3" fill="currentColor" stroke="none"/>' +
              '<circle cx="225" cy="180" r="16"/>' +
              '<circle cx="225" cy="180" r="3" fill="currentColor" stroke="none"/>' +
              // headlight beams (front, leading the way)
              '<line x1="270" y1="135" x2="290" y2="128" stroke-width="1.4" opacity="0.6"/>' +
              '<line x1="270" y1="145" x2="292" y2="145" stroke-width="1.4" opacity="0.6"/>' +
              '<line x1="270" y1="155" x2="290" y2="162" stroke-width="1.4" opacity="0.6"/>' +
            '</svg>' +
          '</div>' +
          '<h4 class="framework-panel-label">Forward-driving</h4>' +
          '<p class="framework-panel-body">Coaching a team. Pastor equips, members minister. Decentralizes care. Multiplies impact. The Ephesians 4 model — the pastor as coach, not solo star.</p>' +
        '</div>' +
      '</div>' +
    '</section>',
};

// =============================================================
// USAGE EXAMPLE (React)
// =============================================================
//
// import { LAW_SVGS, FEATURED_VISUALS } from './illustrations';
//
// // Law card thumbnail:
// <div className="law-card-illustration"
//      dangerouslySetInnerHTML={{ __html: LAW_SVGS[law.n] }} />
//
// // Featured visual:
// <div dangerouslySetInnerHTML={{ __html: FEATURED_VISUALS.ppp }} />
//
// (Or convert these to React components if you prefer — but the SVG markup
// stays identical.)
