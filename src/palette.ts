import type { Species } from './sim/config';

export const SPECIES_COLOUR: Record<Species, number> = {
  herring: 0xb8c7d6,
  mackerel: 0x4f8fb0,
  flounder: 0xd2b48c,
  seabass: 0x7aa58a,
  snapper: 0xe05a4f,
  lobster: 0xa8201a,
  cod: 0x9c8b6a,
  tuna: 0x2f5f9a,
  swordfish: 0x6f7fa8,
  anglerfish: 0x4a3a5a,
  squid: 0xc9585f,
  sturgeon: 0xf2c14e,
  halibut: 0xbfae94,
  kingcrab: 0xd8452f,
  icefish: 0xd6f0f7,
  lanternfish: 0x2f3a6a,
  gulpereel: 0x3d2f4a,
  oarfish: 0xd9dde6,
  ghostshark: 0x9fa9b8,
  coelacanth: 0x34506a,
  pearloyster: 0xf3ead8,
  dragonfish: 0x1f2433,
  frilledshark: 0x5f5a54,
  seaserpent: 0x2f8a6a,
};

export const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
