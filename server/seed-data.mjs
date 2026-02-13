import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { addons, achievements } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  console.log('🌱 Seeding database...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // Seed add-ons
  console.log('📦 Seeding add-ons...');
  const existingAddons = await db.select().from(addons);
  
  if (existingAddons.length === 0) {
    await db.insert(addons).values([
      {
        name: 'Premium Games Pack',
        description: '10 fully working games: Snake, Tetris, 2048, Flappy Bird, Pong, Breakout, Space Invaders, Pac-Man, Tic-Tac-Toe, Memory Match',
        category: 'game',
        price: 300,
        icon: '🎮',
        isActive: true,
      },
      {
        name: 'Premium Themes Pack',
        description: '5 beautiful custom themes with unique color schemes and animations',
        category: 'theme',
        price: 300,
        icon: '🎨',
        isActive: true,
      },
      {
        name: 'Extra Storage',
        description: 'Add 50GB of additional cloud storage to your account',
        category: 'storage',
        price: 300,
        icon: '💾',
        isActive: true,
      },
      {
        name: 'Ai Credits Boost',
        description: '1000 extra AI credits for advanced features',
        category: 'feature',
        price: 300,
        icon: '⚡',
        isActive: true,
      },
    ]);
    console.log('✅ Add-ons seeded');
  } else {
    console.log('⏭️  Add-ons already exist, skipping');
  }

  // Seed achievements
  console.log('🏆 Seeding achievements...');
  const existingAchievements = await db.select().from(achievements);
  
  if (existingAchievements.length === 0) {
    await db.insert(achievements).values([
      // Milestone achievements
      {
        name: 'First Win',
        description: 'Complete your first game',
        icon: '🎯',
        category: 'milestone',
        condition: { type: 'games_played', value: 1 },
        points: 10,
        isSecret: false,
      },
      {
        name: 'Game Master',
        description: 'Play 10 different games',
        icon: '🎮',
        category: 'milestone',
        condition: { type: 'unique_games', value: 10 },
        points: 50,
        isSecret: false,
      },
      {
        name: 'Century Club',
        description: 'Play 100 games total',
        icon: '💯',
        category: 'milestone',
        condition: { type: 'games_played', value: 100 },
        points: 100,
        isSecret: false,
      },
      
      // Score achievements
      {
        name: 'High Scorer',
        description: 'Score 1000+ points in any game',
        icon: '⭐',
        category: 'game',
        condition: { type: 'score', value: 1000 },
        points: 25,
        isSecret: false,
      },
      {
        name: 'Elite Player',
        description: 'Score 5000+ points in any game',
        icon: '🌟',
        category: 'game',
        condition: { type: 'score', value: 5000 },
        points: 50,
        isSecret: false,
      },
      {
        name: 'Legend',
        description: 'Score 10000+ points in any game',
        icon: '👑',
        category: 'game',
        condition: { type: 'score', value: 10000 },
        points: 100,
        isSecret: false,
      },
      
      // Social achievements
      {
        name: 'Challenger',
        description: 'Share your first challenge link',
        icon: '🔗',
        category: 'social',
        condition: { type: 'challenges_shared', value: 1 },
        points: 15,
        isSecret: false,
      },
      {
        name: 'Leaderboard King',
        description: 'Reach #1 on any leaderboard',
        icon: '🏆',
        category: 'social',
        condition: { type: 'leaderboard_rank', value: 1 },
        points: 75,
        isSecret: false,
      },
      
      // Storage achievements
      {
        name: 'Data Hoarder',
        description: 'Upload 100 files',
        icon: '📁',
        category: 'storage',
        condition: { type: 'files_uploaded', value: 100 },
        points: 30,
        isSecret: false,
      },
      {
        name: 'Cloud Master',
        description: 'Use 10GB of storage',
        icon: '☁️',
        category: 'storage',
        condition: { type: 'storage_used', value: 10737418240 }, // 10GB in bytes
        points: 40,
        isSecret: false,
      },
      
      // Email achievements
      {
        name: 'Inbox Zero',
        description: 'Delete 50 emails',
        icon: '📧',
        category: 'email',
        condition: { type: 'emails_deleted', value: 50 },
        points: 20,
        isSecret: false,
      },
      
      // Special achievements
      {
        name: 'Early Adopter',
        description: 'Join during beta period',
        icon: '🚀',
        category: 'milestone',
        condition: { type: 'special', value: 'beta_user' },
        points: 200,
        isSecret: true,
      },
    ]);
    console.log('✅ Achievements seeded');
  } else {
    console.log('⏭️  Achievements already exist, skipping');
  }

  await connection.end();
  console.log('✨ Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
