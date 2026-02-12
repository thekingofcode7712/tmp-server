import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const themes = [
  {
    name: 'Midnight Blue',
    description: 'Deep ocean blues with cyan accents',
    colors: {
      primary: '217 91% 60%', // Blue
      secondary: '217 91% 70%',
      accent: '189 94% 43%', // Cyan
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '222 47% 15%',
      muted: '217 33% 17%',
    },
    isDefault: false,
  },
  {
    name: 'Sunset Orange',
    description: 'Warm sunset colors with orange and pink',
    colors: {
      primary: '24 95% 53%', // Orange
      secondary: '24 95% 63%',
      accent: '346 77% 50%', // Pink
      background: '20 14% 10%',
      foreground: '60 9% 98%',
      card: '20 14% 14%',
      muted: '24 20% 18%',
    },
    isDefault: false,
  },
  {
    name: 'Forest Green',
    description: 'Natural greens inspired by the forest',
    colors: {
      primary: '142 76% 36%', // Green
      secondary: '142 76% 46%',
      accent: '173 58% 39%', // Teal
      background: '140 20% 8%',
      foreground: '140 10% 98%',
      card: '140 20% 12%',
      muted: '142 30% 16%',
    },
    isDefault: false,
  },
  {
    name: 'Purple Haze',
    description: 'Royal purple with magenta accents',
    colors: {
      primary: '271 81% 56%', // Purple
      secondary: '271 81% 66%',
      accent: '316 70% 50%', // Magenta
      background: '270 30% 8%',
      foreground: '270 10% 98%',
      card: '270 30% 12%',
      muted: '271 40% 16%',
    },
    isDefault: false,
  },
  {
    name: 'Crimson Red',
    description: 'Bold red with deep burgundy tones',
    colors: {
      primary: '0 84% 60%', // Red
      secondary: '0 84% 70%',
      accent: '348 83% 47%', // Crimson
      background: '0 20% 8%',
      foreground: '0 5% 98%',
      card: '0 20% 12%',
      muted: '0 30% 16%',
    },
    isDefault: false,
  },
  {
    name: 'Ocean Teal',
    description: 'Deep ocean teal with aqua highlights',
    colors: {
      primary: '174 72% 56%', // Teal
      secondary: '174 72% 66%',
      accent: '187 85% 53%', // Aqua
      background: '174 30% 8%',
      foreground: '174 10% 98%',
      card: '174 30% 12%',
      muted: '174 40% 16%',
    },
    isDefault: false,
  },
  {
    name: 'Golden Yellow',
    description: 'Bright gold with amber accents',
    colors: {
      primary: '45 93% 47%', // Gold
      secondary: '45 93% 57%',
      accent: '38 92% 50%', // Amber
      background: '45 20% 8%',
      foreground: '45 10% 98%',
      card: '45 20% 12%',
      muted: '45 30% 16%',
    },
    isDefault: false,
  },
  {
    name: 'Rose Pink',
    description: 'Soft rose with coral accents',
    colors: {
      primary: '330 81% 60%', // Rose
      secondary: '330 81% 70%',
      accent: '16 90% 66%', // Coral
      background: '330 20% 8%',
      foreground: '330 10% 98%',
      card: '330 20% 12%',
      muted: '330 30% 16%',
    },
    isDefault: false,
  },
];

console.log('Seeding themes...');

for (const theme of themes) {
  await db.insert(schema.themes).values(theme);
  console.log(`✓ Added theme: ${theme.name}`);
}

console.log('✓ All themes seeded successfully!');
process.exit(0);
