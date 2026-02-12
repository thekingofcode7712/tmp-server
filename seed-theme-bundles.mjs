import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Get all themes to create bundles
const allThemes = await db.select().from(schema.themes);

console.log(`Found ${allThemes.length} themes`);

// Warm Tones Bundle: Sunset Orange, Golden Amber, Crimson Red
const warmThemes = allThemes.filter(t => 
  ['Sunset Orange', 'Crimson Red', 'Copper Rust'].includes(t.name)
);

// Cool Tones Bundle: Ocean Blue, Mint Green, Lavender Purple
const coolThemes = allThemes.filter(t => 
  ['Ocean Teal', 'Mint Fresh', 'Lavender Dream'].includes(t.name)
);

// All Themes Bundle: Everything
const allThemeIds = allThemes.map(t => t.id);

const bundles = [
  {
    name: 'Warm Tones Bundle',
    description: 'Perfect for cozy, energetic vibes. Includes Sunset Orange, Crimson Red, and Copper Rust themes.',
    themeIds: warmThemes.map(t => t.id),
    price: 700, // £7
    savings: 200, // Save £2 (normally £9 for 3 themes)
  },
  {
    name: 'Cool Tones Bundle',
    description: 'Calm and refreshing aesthetics. Includes Ocean Teal, Mint Fresh, and Lavender Dream themes.',
    themeIds: coolThemes.map(t => t.id),
    price: 700, // £7
    savings: 200, // Save £2
  },
  {
    name: 'All Themes Bundle',
    description: `Unlock all ${allThemes.length} premium themes! Get every color scheme and save over 70%.`,
    themeIds: allThemeIds,
    price: 2500, // £25
    savings: allThemes.length * 300 - 2500, // Save £44+ (normally £69 for 23 themes)
  },
];

console.log('Creating theme bundles...');

for (const bundle of bundles) {
  // Check if bundle already exists
  const existing = await db.select()
    .from(schema.themeBundles)
    .where(eq(schema.themeBundles.name, bundle.name));
  
  if (existing.length > 0) {
    console.log(`Bundle "${bundle.name}" already exists, updating...`);
    await db.update(schema.themeBundles)
      .set(bundle)
      .where(eq(schema.themeBundles.name, bundle.name));
  } else {
    console.log(`Creating bundle "${bundle.name}"...`);
    await db.insert(schema.themeBundles).values(bundle);
  }
}

console.log('✅ Theme bundles created successfully!');

await connection.end();
