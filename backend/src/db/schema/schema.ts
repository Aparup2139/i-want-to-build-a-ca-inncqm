import { pgTable, uuid, text, integer, real, timestamp, boolean } from 'drizzle-orm/pg-core';
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
