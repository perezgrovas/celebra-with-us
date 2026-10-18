/** Original line drawings created for this project. No external sticker packs. */
const symbols = {
  rings:
    '<circle cx="40" cy="57" r="22"/><circle cx="65" cy="57" r="22"/><path d="M30 25l10-12 10 12-10 12z"/>',
  heart:
    '<path d="M50 82S9 58 13 33C17 9 44 14 50 31c6-17 33-22 37 2 4 25-37 49-37 49z"/>',
  sprig:
    '<path d="M30 91Q60 56 67 9M44 69Q8 59 25 41q23 1 19 28M55 49Q91 56 85 31q-22-12-30 18M62 29Q36 23 48 9q18-4 14 20"/>',
  flower:
    '<path d="M50 40C20 0 4 42 38 50 0 80 43 98 50 62c12 37 52 16 13-12 39-10 5-51-13-10z"/><circle cx="50" cy="50" r="10"/><path d="M50 72v25"/>',
  cake: '<path d="M20 48h60v37H20zM15 85h70M20 59q10 14 20 0 10 14 20 0 10 14 20 0M35 48V35h8v13M57 48V35h8v13M39 26q-9-7 0-16 9 9 0 16M61 26q-9-7 0-16 9 9 0 16"/>',
  balloon:
    '<ellipse cx="49" cy="34" rx="25" ry="30"/><path d="M49 64l-5 8h10zM49 73q-19 15 0 25M34 20q-6 5-5 13"/>',
  gift: '<path d="M17 40h66v15H17zM23 55v35h54V55M46 40v50M55 40v50M49 38C10 38 26 0 49 38c24-38 40 0 0 0"/>',
  star: '<path d="M50 8l12 27 29 3-22 21 6 30-25-15-25 15 6-30L9 38l29-3z"/>',
  cross: '<path d="M42 10h16v27h26v16H58v37H42V53H16V37h26z"/>',
  dove: '<path d="M12 69q23 3 27-19L22 17q30 4 34 33 13-27 29-15l8 8-13 3q-2 35-41 34zM68 41h1M12 83q10-5 20 1"/>',
  shell:
    '<path d="M50 85C-4 64 6 21 24 30c0-24 24-28 26-7 2-21 26-17 26 7 18-9 28 34-26 55zM50 83V30M45 80L24 34M55 80l21-46M20 53l22 24M80 53L58 77"/>',
  candle:
    '<path d="M35 42h30v49H35zM50 43V29M50 26c-23-6-5-28 0-20 12 9 12 16 0 20M35 55q8 12 13 0 9 15 17-2"/>',
  chalice:
    '<path d="M24 20h52q-2 37-26 38-24-1-26-38zM50 58v24M29 88h42M40 82h20"/><circle cx="50" cy="16" r="11"/><path d="M50 9v14M43 16h14"/>',
  book: '<path d="M50 23Q25 7 9 19v62q20-10 41 5 21-15 41-5V19Q75 7 50 23v63M22 33l15 4M22 45l15 4M65 37l15-4M65 49l15-4"/>',
  wheat:
    '<path d="M26 93L68 13M47 54q-22 5-18-16 19-4 18 16M55 39q-19 0-14-17 17-1 14 17M49 56q20 5 23-15-19-8-23 15M58 37q18 3 21-13-17-5-21 13"/>',
  confetti:
    '<path d="M13 88l20-62 41 40zM28 45l28 13M21 65l16 7M65 12q-10 9 0 18M80 28l9-5M77 45l12 6M42 11v9M65 84l3 10"/>',
  glasses:
    '<path d="M13 20h30l-3 31q-11 20-24 0zM57 20h30l-3 31q-11 20-24 0zM28 65v19M17 87h22M72 65v19M61 87h22M45 5l5 7M50 26l2-7"/>',
  bunting:
    '<path d="M5 18q45 26 90 0M14 24l9 28 15-21M40 33l10 28 11-28M64 31l16 21 8-28"/>',
  microphone:
    '<path d="M37 37l27 25M32 43l26 24M28 48l27 24 31-35C108 5 69-7 55 16zM28 49L9 78l14 13 30-22M18 86q-3 18 19 12"/>',
  music:
    '<path d="M34 69V20l43-8v48M34 32l43-8"/><ellipse cx="22" cy="76" rx="14" ry="10"/><ellipse cx="65" cy="67" rx="14" ry="10"/>',
  ticket:
    '<path d="M12 23h76v18c-17 0-17 20 0 20v18H12V61c17 0 17-20 0-20zM64 28v9m0 8v9m0 8v9"/>',
  sparkle:
    '<path d="M50 6q3 40 40 44-37 4-40 44Q46 54 10 50 46 46 50 6zM81 4v18M72 13h18M14 76v16M6 84h16"/>',
  moon: '<path d="M73 12C15-3 0 69 44 88 71 101 94 82 96 62 49 82 30 31 73 12z"/>',
  bow: '<path d="M49 43C1-9 3 80 46 56M54 43C99-9 99 80 56 56M44 44h13v14H44zM45 58L25 91l18-6 6 9 4-35M56 57l23 33-18-5-6 9"/>',
};
export type DoodleId = keyof typeof symbols;
export const doodleCategories = {
  Bodas: ["rings", "heart", "sprig", "flower", "bow", "glasses"],
  Cumpleaños: ["cake", "balloon", "gift", "star", "confetti", "bunting"],
  Bautizos: ["cross", "dove", "shell", "candle", "star", "sprig"],
  "Primera comunión": ["chalice", "book", "wheat", "cross", "dove", "candle"],
  Fiestas: ["confetti", "glasses", "bunting", "gift", "balloon", "sparkle"],
  Conciertos: ["microphone", "music", "ticket", "star", "moon", "sparkle"],
} as const;
export const doodleNames: Record<DoodleId, string> = {
  rings: "Anillos",
  heart: "Corazón",
  sprig: "Rama de olivo",
  flower: "Flor",
  cake: "Pastel",
  balloon: "Globo",
  gift: "Regalo",
  star: "Estrella",
  cross: "Cruz",
  dove: "Paloma",
  shell: "Concha",
  candle: "Vela",
  chalice: "Cáliz",
  book: "Libro",
  wheat: "Espiga",
  confetti: "Confeti",
  glasses: "Copas",
  bunting: "Banderines",
  microphone: "Micrófono",
  music: "Notas musicales",
  ticket: "Boleto",
  sparkle: "Destello",
  moon: "Luna",
  bow: "Moño",
};
export function doodleSvg(id: string, color = "#7E8666") {
  const shape = symbols[id as DoodleId];
  if (!shape) return "";
  const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : "#7E8666";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${safe}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`)}`;
}
