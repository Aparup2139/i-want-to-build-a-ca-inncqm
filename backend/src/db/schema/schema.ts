import { pgTable, uuid, text, integer, real, timestamp, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const foodEntries = pgTable('food_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  foodName: text('food_name').notNull(),
  calories: integer('calories').notNull(),
  protein: real('protein'),
  carbs: real('carbs'),
  fat: real('fat'),
  mealType: text('meal_type'),
  imageUrl: text('image_url'),
  recognizedByAi: boolean('recognized_by_ai').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  age: integer('age'),
  gender: text('gender'), // 'male', 'female', 'other'
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  goal: text('goal'), // 'lose_weight', 'maintain', 'gain_weight', 'build_muscle'
  activityLevel: text('activity_level'), // 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  dailyCalorieTarget: integer('daily_calorie_target'),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  isPro: boolean('is_pro').default(false).notNull(),
  proExpiresAt: timestamp('pro_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dailyUsage = pgTable('daily_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  scansCount: integer('scans_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userDateUnique: uniqueIndex('user_date_unique').on(table.userId, table.date),
}));
