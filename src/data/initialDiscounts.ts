import { BrandDiscount } from '../types';

export const INITIAL_DISCOUNTS: BrandDiscount[] = [
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
    brand: 'Shamir',
    discount1: 50,
    discount2: 10,
    categoryOverrides: {
      progressive: { discount1: 55, discount2: 5 },
    },
  },
  {
    brand: 'Hoya',
    discount1: 40,
    discount2: 0,
  },
  {
    brand: 'Kodak',
    discount1: 50,
    discount2: 5,
  },
  {
    brand: 'Novax',
    discount1: 55,
    discount2: 0,
  },
  {
    brand: 'Seiko',
    discount1: 40,
    discount2: 0,
  },
  {
    brand: 'Visionart',
    discount1: 50,
    discount2: 0,
  },
];
