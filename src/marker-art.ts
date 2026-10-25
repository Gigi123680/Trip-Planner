export function markerArt(icon: string): string {
  const paths: Record<string, string> = {
    village: '<path d="m8 20 6-6 6 6m-10-1v9h8v-9m2-2 5-5 7 7m-11 0v9h9v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    waterfall: '<path d="M10 12h15v5h-6v11m-5-11v11m10-9v9M10 30q5-3 10 0t10 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    ropeway: '<path d="m8 13 24-4M20 11v5m-7 0h14v13H13Zm0 6h14m-7-6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    fish: '<path d="M10 21q8-12 15 0q-7 12-15 0Zm15 0 6-5v10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15" cy="20" r="1.2" fill="currentColor"/>',
    food: '<path d="M10 22h20c-1 10-19 10-20 0Zm5-3c-4-3 3-4 0-8m6 8c-4-3 3-4 0-8m5 8c-4-3 3-4 0-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    grassland: '<path d="m9 23 7-9 6 8 4-5 6 7M10 29h21m-13 0-2-6m7 6 2-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    geothermal: '<path d="M9 25q11 8 22 0M13 22c-6-6 5-6 0-12m7 12c-6-6 5-6 0-12m7 12c-6-6 5-6 0-12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    mountain: '<path d="m9 26 7-13 5 8 4-6 7 11H9Z" fill="currentColor"/><path d="m13.8 17.1 2.2-4.1 2.5 4-2.3-.8-1.2 1.5Z" fill="white"/>',
    house: '<path d="m10 19 10-8 10 8v10h-7v-7h-6v7h-7Z" fill="currentColor"/>',
    lake: '<path d="M10 17q3-4 6 0t6 0t8 0M10 22q3-4 6 0t6 0t8 0M10 27q3-4 6 0t6 0t8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    shop: '<path d="M11 19v10h18V19M10 18l3-6h14l3 6M10 18q2 5 5 0q2 5 5 0q2 5 5 0q2 5 5 0M16 29v-7h8v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    viewpoint: '<path d="M9 23q11-14 22 0q-11 11-22 0Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="20" cy="22" r="3" fill="currentColor"/>',
    onsen: '<path d="M10 24c0 8 20 8 20 0M14 22c-5-4 4-5 0-10M20 22c-5-4 4-5 0-10M26 22c-5-4 4-5 0-10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };
  return `<svg class="pin-art" viewBox="0 0 40 52" aria-hidden="true"><path class="pin-body" d="M20 50C17 46 3 32 3 20a17 17 0 1 1 34 0c0 12-14 26-17 30Z"/><circle class="pin-center" cx="20" cy="20" r="12"/>${paths[icon] || paths.mountain}</svg>`;
}
