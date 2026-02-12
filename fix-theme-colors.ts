import { db } from './server/db.ts';
import { themes } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Helper to generate complete color set from base colors
function completeColorSet(baseColors: Record<string, string>) {
  return {
    primary: baseColors.primary,
    secondary: baseColors.secondary,
    accent: baseColors.accent,
    background: baseColors.background,
    foreground: baseColors.foreground,
    card: baseColors.card || baseColors.background,
    'card-foreground': baseColors.foreground,
    popover: baseColors.card || baseColors.background,
    'popover-foreground': baseColors.foreground,
    'primary-foreground': baseColors['primary-foreground'] || '0 0% 98%',
    'secondary-foreground': baseColors.foreground,
    muted: baseColors.muted,
    'muted-foreground': baseColors['muted-foreground'] || '0 0% 70%',
    'accent-foreground': baseColors.foreground,
    destructive: '0 84% 60%',
    'destructive-foreground': '0 0% 98%',
    border: baseColors.border || baseColors.muted,
    input: baseColors.input || baseColors.muted,
    ring: baseColors.ring || baseColors.primary,
  };
}

async function fixAllThemes() {
  console.log('Fetching all themes...');
  const allThemes = await db.getAllThemes();
  
  for (const theme of allThemes) {
    console.log(`\nFixing theme: ${theme.name}`);
    const baseColors = theme.colors as Record<string, string>;
    const completeColors = completeColorSet(baseColors);
    
    await db.db.update(themes)
      .set({ colors: completeColors })
      .where(eq(themes.id, theme.id));
    
    console.log(`✓ Updated ${theme.name} with complete color set`);
  }
  
  console.log('\n✅ All themes fixed!');
  process.exit(0);
}

fixAllThemes().catch(console.error);
