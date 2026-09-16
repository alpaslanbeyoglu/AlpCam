import { BrandDiscount } from '../types';

export const INITIAL_DISCOUNTS: BrandDiscount[] = [
  // Gözlük Camı Markaları
  {
    brand: 'Essilor',
    discount1: 45,
    discount2: 0,
    categoryOverrides: {
      progressive: { discount1: 50, discount2: 0 },
    },
  },
  {
    brand: 'Zeiss',
    discount1: 35,
    discount2: 5,
  },
  {
    brand: 'Rodenstock',
    discount1: 40,
    discount2: 5,
    categoryOverrides: {
      progressive: { discount1: 45, discount2: 5 },
    },
  },
  {
    brand: 'Hoya',
    discount1: 40,
    discount2: 0,
  },
  {
    brand: 'Seiko',
    discount1: 40,
    discount2: 0,
  },
  {
    brand: 'Shamir',
    discount1: 50,
    discount2: 10,
    categoryOverrides: {
      progressive: { discount1: 55, discount2: 5 },
    },
  },
  {
    brand: 'Novax',
    discount1: 55,
    discount2: 0,
  },
  {
    brand: 'Kodak',
    discount1: 50,
    discount2: 5,
  },
  {
    brand: 'Hawk Plus',
    discount1: 45,
    discount2: 0,
  },
  {
    brand: 'Fuji',
    discount1: 50,
    discount2: 0,
  },
  {
    brand: 'VisionArt',
    discount1: 50,
    discount2: 0,
  },
  {
    brand: 'İşbir',
    discount1: 45,
    discount2: 0,
  },

  // Kontakt Lens Markaları
  {
    brand: 'CooperVision',
    discount1: 30,
    discount2: 5,
  },
  {
    brand: 'Bausch + Lomb',
    discount1: 30,
    discount2: 0,
  },
  {
    brand: 'Alcon',
    discount1: 25,
    discount2: 5,
  },
  {
    brand: 'Desio',
    discount1: 35,
    discount2: 0,
  },
  {
    brand: 'Adore',
    discount1: 35,
    discount2: 0,
  },
  {
    brand: 'Opsa Lens',
    discount1: 35,
    discount2: 0,
  },
  {
    brand: 'Lens Medikal',
    discount1: 30,
    discount2: 0,
  },
];
