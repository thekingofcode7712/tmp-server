import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: 'default' });

const newThemes = [
  {
    name: 'Arctic Ice',
    description: 'Cool icy blues with white highlights',
    colors: {
      primary: '200 98% 39%',
      secondary: '200 98% 49%',
      accent: '180 100% 90%',
      background: '200 30% 8%',
      foreground: '200 10% 98%',
      card: '200 30% 12%',
      muted: '200 40% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Lavender Dream',
    description: 'Soft lavender with violet accents',
    colors: {
      primary: '270 50% 70%',
      secondary: '270 50% 80%',
      accent: '280 60% 60%',
      background: '270 20% 8%',
      foreground: '270 10% 98%',
      card: '270 20% 12%',
      muted: '270 30% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Emerald City',
    description: 'Bright emerald green with lime accents',
    colors: {
      primary: '140 60% 50%',
      secondary: '140 60% 60%',
      accent: '80 70% 50%',
      background: '140 25% 8%',
      foreground: '140 10% 98%',
      card: '140 25% 12%',
      muted: '140 35% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Chocolate Brown',
    description: 'Rich chocolate with caramel tones',
    colors: {
      primary: '25 75% 47%',
      secondary: '25 75% 57%',
      accent: '30 80% 55%',
      background: '25 20% 8%',
      foreground: '25 10% 98%',
      card: '25 20% 12%',
      muted: '25 30% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Neon Cyan',
    description: 'Electric cyan with bright blue accents',
    colors: {
      primary: '180 100% 50%',
      secondary: '180 100% 60%',
      accent: '200 100% 50%',
      background: '180 30% 8%',
      foreground: '180 10% 98%',
      card: '180 30% 12%',
      muted: '180 40% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Burgundy Wine',
    description: 'Deep burgundy with wine red accents',
    colors: {
      primary: '345 63% 40%',
      secondary: '345 63% 50%',
      accent: '0 70% 50%',
      background: '345 25% 8%',
      foreground: '345 10% 98%',
      card: '345 25% 12%',
      muted: '345 35% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Mint Fresh',
    description: 'Fresh mint green with seafoam accents',
    colors: {
      primary: '160 60% 50%',
      secondary: '160 60% 60%',
      accent: '165 70% 60%',
      background: '160 25% 8%',
      foreground: '160 10% 98%',
      card: '160 25% 12%',
      muted: '160 35% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Slate Gray',
    description: 'Modern slate with silver highlights',
    colors: {
      primary: '210 20% 50%',
      secondary: '210 20% 60%',
      accent: '200 25% 60%',
      background: '210 15% 8%',
      foreground: '210 10% 98%',
      card: '210 15% 12%',
      muted: '210 20% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Peach Sorbet',
    description: 'Sweet peach with apricot accents',
    colors: {
      primary: '20 100% 70%',
      secondary: '20 100% 80%',
      accent: '30 100% 70%',
      background: '20 20% 8%',
      foreground: '20 10% 98%',
      card: '20 20% 12%',
      muted: '20 30% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Indigo Night',
    description: 'Deep indigo with midnight blue accents',
    colors: {
      primary: '240 60% 50%',
      secondary: '240 60% 60%',
      accent: '230 70% 55%',
      background: '240 30% 8%',
      foreground: '240 10% 98%',
      card: '240 30% 12%',
      muted: '240 40% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Lime Zest',
    description: 'Vibrant lime with yellow-green accents',
    colors: {
      primary: '75 80% 50%',
      secondary: '75 80% 60%',
      accent: '65 90% 55%',
      background: '75 25% 8%',
      foreground: '75 10% 98%',
      card: '75 25% 12%',
      muted: '75 35% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Copper Rust',
    description: 'Warm copper with rust orange accents',
    colors: {
      primary: '15 75% 50%',
      secondary: '15 75% 60%',
      accent: '10 80% 55%',
      background: '15 20% 8%',
      foreground: '15 10% 98%',
      card: '15 20% 12%',
      muted: '15 30% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Sapphire Blue',
    description: 'Royal sapphire with cobalt accents',
    colors: {
      primary: '220 80% 50%',
      secondary: '220 80% 60%',
      accent: '210 85% 55%',
      background: '220 30% 8%',
      foreground: '220 10% 98%',
      card: '220 30% 12%',
      muted: '220 40% 16%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Charcoal Black',
    description: 'Deep charcoal with dark gray accents',
    colors: {
      primary: '0 0% 30%',
      secondary: '0 0% 40%',
      accent: '0 0% 50%',
      background: '0 0% 5%',
      foreground: '0 0% 98%',
      card: '0 0% 8%',
      muted: '0 0% 12%',
    },
    price: 300,
    isDefault: false,
  },
  {
    name: 'Coral Reef',
    description: 'Bright coral with salmon pink accents',
    colors: {
      primary: '10 90% 65%',
      secondary: '10 90% 75%',
      accent: '5 95% 70%',
      background: '10 20% 8%',
      foreground: '10 10% 98%',
      card: '10 20% 12%',
      muted: '10 30% 16%',
    },
    price: 300,
    isDefault: false,
  },
];

console.log('Seeding 15 additional themes...');

for (const theme of newThemes) {
  await db.insert(schema.themes).values(theme);
  console.log(`✓ Added theme: ${theme.name}`);
}

console.log(`✓ All ${newThemes.length} themes seeded successfully!`);
await connection.end();
process.exit(0);
