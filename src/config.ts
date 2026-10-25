// Replace these style URLs when moving to self-hosted tiles, fonts and sprites.
export const mapStyles = {
  liberty: { name: 'Explore', url: 'https://tiles.openfreemap.org/styles/liberty' },
  positron: { name: 'Quiet', url: 'https://tiles.openfreemap.org/styles/positron' },
};
export type MapStyle = keyof typeof mapStyles;
export const kyushuBounds: [[number, number], [number, number]] = [[129.3, 30.8], [132.1, 34.1]];
