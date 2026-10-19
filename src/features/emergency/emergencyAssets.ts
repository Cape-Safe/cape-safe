import type { ImageSource } from 'expo-image';

// hero-placeholder.jpg is a generated Cape Town sunset illustration so the screen has a hero
// until a real photo exists. To use the real photo, add it to this folder or to assets/images
// and point HERO_IMAGE at it, for example:
//   export const HERO_IMAGE: ImageSource = require('@/assets/images/cape-town-sunset.jpg');
export const HERO_IMAGE: ImageSource | null = require('./hero-placeholder.jpg');

// No Cape Safe logo file exists yet, so the screen draws a shield icon and wordmark.
// When you have one: export const LOGO_IMAGE: ImageSource | null = require('@/assets/images/cape-safe-logo.png');
export const LOGO_IMAGE: ImageSource | null = null;
