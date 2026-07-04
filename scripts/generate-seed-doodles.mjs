// Generates colorful hand-drawn-style doodles (SVG data URIs, base64) for the
// demo seed cards + profiles and writes supabase/seed/seed_doodles.sql.
// Same palette as the in-app drawing canvas (DrawingCanvas.tsx).
// Run: node scripts/generate-seed-doodles.mjs

import { writeFileSync } from 'node:fs'

const C = {
  black: '#18181b',
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#eab308',
  green: '#16a34a',
  blue: '#2563eb',
  violet: '#7c3aed',
  brown: '#78350f',
}

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const dataUri = (inner) =>
  `data:image/svg+xml;base64,${Buffer.from(wrap(inner)).toString('base64')}`

const camera = (body, lens) =>
  `<rect x="20" y="35" width="60" height="38" rx="8" stroke="${body}" stroke-width="6"/>` +
  `<circle cx="50" cy="54" r="12" stroke="${lens}" stroke-width="6"/>` +
  `<path d="M38 35 L43 27 L60 27 L64 35" stroke="${body}" stroke-width="6"/>`

const dancer = (c, flip) =>
  `<g transform="${flip ? 'scale(-1,1) translate(-100,0)' : ''}">` +
  `<circle cx="56" cy="24" r="8" stroke="${c}" stroke-width="6"/>` +
  `<path d="M52 33 C44 44 46 54 42 66 M42 66 L30 80 M42 66 L56 78 M50 42 L30 34 M52 40 L72 46" stroke="${c}" stroke-width="6"/></g>`

const controller = (body, btn) =>
  `<path d="M30 38 C18 38 14 52 16 62 C18 72 28 72 33 64 L38 57 L62 57 L67 64 C72 72 82 72 84 62 C86 52 82 38 70 38 Z" stroke="${body}" stroke-width="6"/>` +
  `<path d="M32 46 L32 56 M27 51 L37 51" stroke="${C.black}" stroke-width="5"/>` +
  `<circle cx="63" cy="46" r="3.5" fill="${btn}"/><circle cx="71" cy="52" r="3.5" fill="${btn}"/>`

const book = (c, extra = '') =>
  `<path d="M50 32 C40 24 27 25 20 29 L21 71 C30 67 42 69 50 74 C58 69 70 67 79 71 L80 29 C73 25 60 24 50 32 Z" stroke="${c}" stroke-width="6"/>` +
  `<path d="M50 33 L50 73" stroke="${c}" stroke-width="5"/>${extra}`

// title → svg inner (titles must match seed_demo.sql exactly)
const cardDoodles = {
  'Kurzfilm: Nachtschicht am Kiosk':
    `<path d="M22 46 L79 42 L80 78 L21 80 Z" stroke="${C.black}" stroke-width="6"/>` +
    `<path d="M20 44 L15 29 L74 25 L79 41" stroke="${C.red}" stroke-width="6"/>` +
    `<path d="M28 41 L33 28 M43 40 L48 27 M58 38 L63 26" stroke="${C.red}" stroke-width="5"/>`,
  'Indie-Band sucht Drummer:in':
    `<ellipse cx="50" cy="55" rx="26" ry="10" stroke="${C.blue}" stroke-width="6"/>` +
    `<path d="M24 55 L24 74 C40 84 60 84 76 74 L76 55" stroke="${C.blue}" stroke-width="6"/>` +
    `<path d="M30 36 L48 50 M72 28 L54 49" stroke="${C.black}" stroke-width="5"/>`,
  'Zine über Winterthurer Hinterhöfe': book(C.orange),
  'Repair-Café im Quartier aufbauen':
    `<path d="M74 22 A14 14 0 1 0 79 45" stroke="${C.green}" stroke-width="7"/>` +
    `<path d="M63 37 L28 72" stroke="${C.green}" stroke-width="7"/>` +
    `<path d="M26 64 A9 9 0 1 0 36 76" stroke="${C.green}" stroke-width="6"/>`,
  'Analoge Fotoausstellung im Treppenhaus': camera(C.black, C.yellow),
  'Quartierfest Breitenrain 2027':
    `<path d="M14 32 C36 46 64 46 86 32" stroke="${C.black}" stroke-width="5"/>` +
    `<path d="M26 40 L32 56 L40 43" stroke="${C.red}" stroke-width="5"/>` +
    `<path d="M46 45 L50 61 L57 45" stroke="${C.yellow}" stroke-width="5"/>` +
    `<path d="M64 42 L71 56 L76 39" stroke="${C.blue}" stroke-width="5"/>`,
  'Tanz-Performance im öffentlichen Raum': dancer(C.violet, false),
  'Cozy Game über den Bodensee': controller(C.blue, C.red),
  'Podcast: Grenzgänger-Geschichten':
    `<rect x="41" y="18" width="18" height="34" rx="9" stroke="${C.red}" stroke-width="6"/>` +
    `<path d="M31 45 C31 66 69 66 69 45 M50 63 L50 80 M38 80 L62 80" stroke="${C.red}" stroke-width="6"/>`,
  'Gemeinschaftsgarten auf dem Flachdach':
    `<path d="M30 60 L70 60 L64 82 L36 82 Z" stroke="${C.brown}" stroke-width="6"/>` +
    `<path d="M50 60 L50 32" stroke="${C.green}" stroke-width="6"/>` +
    `<path d="M50 42 C40 42 33 36 32 28 C42 28 49 33 50 42 Z" stroke="${C.green}" stroke-width="5"/>` +
    `<path d="M50 34 C60 34 67 28 68 20 C58 20 51 25 50 34 Z" stroke="${C.green}" stroke-width="5"/>`,
  'Siebdruck-Werkstatt-Kollektiv':
    `<rect x="22" y="24" width="56" height="40" rx="4" stroke="${C.violet}" stroke-width="6"/>` +
    `<path d="M30 58 L68 32" stroke="${C.black}" stroke-width="6"/>` +
    `<path d="M34 74 C42 80 58 80 66 74" stroke="${C.violet}" stroke-width="5"/>`,
  'Impro-Show: Szenen aus der U-Bahn':
    `<path d="M20 30 C20 22 32 20 42 20 C56 20 62 26 62 34 C62 42 52 46 42 46 L36 46 L26 54 L29 45 C23 43 20 37 20 30 Z" stroke="${C.blue}" stroke-width="5"/>` +
    `<path d="M50 52 C50 47 58 44 66 44 C76 44 82 49 82 56 C82 62 74 66 66 66 L64 66 L58 74 L59 65 C54 63 50 58 50 52 Z" stroke="${C.orange}" stroke-width="5"/>`,
  'Offener Chor für Filmmusik':
    `<path d="M36 68 L36 30 L68 24 L68 62" stroke="${C.blue}" stroke-width="6"/>` +
    `<circle cx="29" cy="69" r="7" stroke="${C.blue}" stroke-width="5"/>` +
    `<circle cx="61" cy="63" r="7" stroke="${C.blue}" stroke-width="5"/>`,
  'Lesebühne im Hinterzimmer': book(
    C.brown,
    `<path d="M40 16 C45 11 55 11 60 16" stroke="${C.yellow}" stroke-width="5"/>`,
  ),
  'Videoschnitt-Nerd sucht Projekt':
    `<rect x="18" y="40" width="64" height="24" rx="4" stroke="${C.black}" stroke-width="6"/>` +
    `<path d="M26 46 L26 48 M38 45 L38 47 M50 44 L50 46 M62 44 L62 46 M74 45 L74 47" stroke="${C.black}" stroke-width="5"/>` +
    `<path d="M60 20 L40 84" stroke="${C.red}" stroke-width="5" stroke-dasharray="8 6"/>`,
  'Illustratorin für euer Projekt':
    `<path d="M33 69 L64 26 C67 22 73 22 76 26 C80 29 79 35 76 38 L44 78" stroke="${C.yellow}" stroke-width="6"/>` +
    `<path d="M33 69 L27 84 L44 78" stroke="${C.black}" stroke-width="4"/>` +
    `<path d="M18 90 C32 84 46 92 60 86" stroke="${C.black}" stroke-width="4"/>`,
  'Fotografin (analog & digital)': camera(C.blue, C.red),
  'Tänzerin sucht Performance-Projekt': dancer(C.red, true),
  'Tontechnik & Mischpult':
    `<path d="M30 24 L30 78 M50 24 L50 78 M70 24 L70 78" stroke="${C.green}" stroke-width="5"/>` +
    `<circle cx="30" cy="60" r="6" fill="${C.black}"/><circle cx="50" cy="38" r="6" fill="${C.black}"/><circle cx="70" cy="52" r="6" fill="${C.black}"/>`,
  'Handwerker für Bühnen- und Kulissenbau':
    `<path d="M30 28 L52 28 L52 44 L30 44 C25 44 22 40 22 36 C22 32 25 28 30 28 Z" stroke="${C.brown}" stroke-width="5"/>` +
    `<path d="M52 28 C59 30 61 42 52 44" stroke="${C.brown}" stroke-width="5"/>` +
    `<path d="M43 44 L50 82" stroke="${C.black}" stroke-width="6"/>`,
  'Godot-Entwicklerin für Game Jams': controller(C.violet, C.yellow),
  'Stimme & Schnitt für euren Podcast':
    `<path d="M26 58 C24 34 40 22 50 22 C60 22 76 34 74 58" stroke="${C.orange}" stroke-width="6"/>` +
    `<rect x="18" y="54" width="13" height="20" rx="6" stroke="${C.orange}" stroke-width="5"/>` +
    `<rect x="69" y="54" width="13" height="20" rx="6" stroke="${C.orange}" stroke-width="5"/>`,
  'Social Media für Kulturprojekte':
    `<path d="M22 32 C22 24 34 20 48 20 C66 20 78 27 78 38 C78 48 66 54 50 54 L42 54 L28 64 L32 52 C26 48 22 41 22 32 Z" stroke="${C.blue}" stroke-width="5"/>` +
    `<path d="M50 46 C45 39 36 39 36 32 C36 28 41 25 45 28 L50 32 L55 28 C59 25 64 28 64 32 C64 39 55 39 50 46 Z" stroke="${C.red}" stroke-width="4"/>`,
  'Schauspielerin für Kurzfilme':
    `<path d="M50 18 L58 40 L82 41 L63 55 L70 79 L50 65 L30 79 L37 55 L18 41 L42 40 Z" stroke="${C.yellow}" stroke-width="6"/>`,
  'Kamerafrau mit eigenem Equipment':
    `<rect x="18" y="38" width="42" height="30" rx="6" stroke="${C.black}" stroke-width="6"/>` +
    `<path d="M60 48 L80 38 L80 68 L60 58" stroke="${C.black}" stroke-width="6"/>` +
    `<circle cx="32" cy="28" r="7" stroke="${C.red}" stroke-width="5"/>` +
    `<circle cx="48" cy="28" r="7" stroke="${C.red}" stroke-width="5"/>`,
  'Pate für Kulturveranstaltungen':
    `<path d="M28 40 L66 40 L62 76 L32 76 Z" stroke="${C.brown}" stroke-width="6"/>` +
    `<path d="M66 46 C77 46 77 60 63 60" stroke="${C.brown}" stroke-width="5"/>` +
    `<path d="M38 32 C36 26 40 24 38 18 M50 32 C48 26 52 24 50 18" stroke="${C.red}" stroke-width="4"/>`,
  'Patin für Text und Öffentlichkeitsarbeit':
    `<path d="M50 16 L62 58 L50 80 L38 58 Z" stroke="${C.blue}" stroke-width="5"/>` +
    `<circle cx="50" cy="56" r="3" fill="${C.blue}"/><path d="M50 60 L50 72" stroke="${C.blue}" stroke-width="3"/>` +
    `<path d="M24 90 C38 84 62 84 76 90" stroke="${C.black}" stroke-width="4"/>`,
  'Pate für Vereinsgründung & Organisation':
    `<circle cx="50" cy="26" r="9" stroke="${C.green}" stroke-width="5"/>` +
    `<circle cx="28" cy="68" r="9" stroke="${C.green}" stroke-width="5"/>` +
    `<circle cx="72" cy="68" r="9" stroke="${C.green}" stroke-width="5"/>` +
    `<path d="M45 34 L33 60 M55 34 L67 60 M37 68 L63 68" stroke="${C.black}" stroke-width="4"/>`,
  'Pate für Musikprojekte':
    `<path d="M58 70 L58 22 C64 26 72 28 76 36" stroke="${C.violet}" stroke-width="6"/>` +
    `<ellipse cx="49" cy="71" rx="10" ry="8" stroke="${C.violet}" stroke-width="5"/>`,
  'Patin für Garten- und Quartierprojekte':
    `<path d="M32 44 L68 44 L64 74 L36 74 Z" stroke="${C.green}" stroke-width="6"/>` +
    `<path d="M32 50 L18 36 M18 36 L13 41 M18 36 L23 31" stroke="${C.green}" stroke-width="5"/>` +
    `<path d="M68 50 C79 52 79 62 65 64" stroke="${C.green}" stroke-width="5"/>` +
    `<path d="M20 22 L18 27 M27 18 L25 23 M12 20 L11 25" stroke="${C.blue}" stroke-width="4"/>`,
  'Grafikerin für Plakate & Flyer':
    `<rect x="24" y="18" width="52" height="64" rx="4" stroke="${C.red}" stroke-width="5"/>` +
    `<path d="M32 32 L68 32 M32 44 L58 44 M32 54 L64 54 M32 64 L52 64" stroke="${C.black}" stroke-width="4"/>`,
  'Velomech & Bastler hilft beim Aufbau':
    `<circle cx="30" cy="64" r="14" stroke="${C.black}" stroke-width="5"/>` +
    `<circle cx="70" cy="64" r="14" stroke="${C.black}" stroke-width="5"/>` +
    `<path d="M30 64 L44 40 L62 40 L70 64 M44 40 L54 64 L30 64" stroke="${C.orange}" stroke-width="5"/>` +
    `<path d="M58 34 L67 34 M39 36 L49 36" stroke="${C.orange}" stroke-width="5"/>`,
  'Patin für Fundraising & Stiftungen':
    `<path d="M50 78 C34 63 22 53 22 40 C22 30 30 24 38 26 C44 28 48 32 50 36 C52 32 56 28 62 26 C70 24 78 30 78 40 C78 53 66 63 50 78 Z" stroke="${C.red}" stroke-width="6"/>` +
    `<circle cx="50" cy="46" r="8" stroke="${C.yellow}" stroke-width="4"/>`,
  'Beatmaker sucht Musik- oder Filmprojekt':
    `<path d="M14 50 L22 50 L28 34 L36 66 L44 26 L52 74 L60 38 L68 60 L76 46 L86 50" stroke="${C.violet}" stroke-width="6"/>`,
  'Texterin für Zines und Websites':
    `<path d="M22 30 C36 26 62 26 78 30 M22 44 C40 40 58 40 74 44 M22 58 C38 54 64 54 78 58 M22 72 C34 68 48 68 56 72" stroke="${C.black}" stroke-width="5"/>` +
    `<circle cx="72" cy="70" r="5" fill="${C.blue}"/>`,
  'Hofkino im Kleinbasel':
    `<rect x="14" y="44" width="28" height="22" rx="5" stroke="${C.black}" stroke-width="5"/>` +
    `<circle cx="22" cy="37" r="6" stroke="${C.black}" stroke-width="4"/>` +
    `<circle cx="34" cy="37" r="6" stroke="${C.black}" stroke-width="4"/>` +
    `<path d="M42 50 L82 36 L82 74 L42 60 Z" stroke="${C.yellow}" stroke-width="5"/>`,
}

// simple smiley variants for the demo profiles (nn = 01..22)
const palette = Object.values(C)
const mouths = [
  'M38 60 Q50 70 62 60',            // smile
  'M40 62 Q50 68 60 62',            // soft smile
  'M40 60 C44 66 56 66 60 60 M50 63 L50 65', // grin
]
const profileDoodle = (i) => {
  const c = palette[i % palette.length]
  const mouth = mouths[i % mouths.length]
  const tilt = ((i % 5) - 2) * 4
  return (
    `<g transform="rotate(${tilt} 50 50)">` +
    `<circle cx="50" cy="50" r="30" stroke="${c}" stroke-width="6"/>` +
    `<circle cx="41" cy="43" r="3.5" fill="${c}"/><circle cx="59" cy="43" r="3.5" fill="${c}"/>` +
    `<path d="${mouth}" stroke="${c}" stroke-width="6"/></g>`
  )
}

let sql = `-- Combo · Doodles for demo seed cards & profiles (generated by
-- scripts/generate-seed-doodles.mjs — edit the script, not this file).
-- SVG data URIs in the drawing canvas palette; no storage objects needed.

`
for (const [title, inner] of Object.entries(cardDoodles)) {
  sql += `update public.cards set drawing_url = '${dataUri(inner)}'\n  where title = '${title.replace(/'/g, "''")}' and owner_id::text like 'd0000000%';\n\n`
}
for (let n = 1; n <= 22; n++) {
  const id = `d0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`
  sql += `update public.profiles set drawing_url = '${dataUri(profileDoodle(n - 1))}' where id = '${id}';\n`
}

writeFileSync(new URL('../supabase/seed/seed_doodles.sql', import.meta.url), sql)
console.log(`wrote seed_doodles.sql (${Object.keys(cardDoodles).length} card doodles, 22 profile doodles)`)
