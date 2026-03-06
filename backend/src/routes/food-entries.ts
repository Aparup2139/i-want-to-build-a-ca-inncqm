import type { App } from '../index.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lt } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

interface CreateFoodEntryBody {
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
}

interface UpdateFoodEntryBody {
  foodName?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
}

export function registerFoodEntryRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/food-entries - All entries for user, ordered by createdAt DESC
  app.fastify.get('/api/food-entries', {
    schema: {
      description: 'Get all food entries for the authenticated user',
      tags: ['food-entries'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              foodName: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: ['number', 'null'] },
              carbs: { type: ['number', 'null'] },
              fat: { type: ['number', 'null'] },
              mealType: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching all food entries');
    const entries = await app.db
      .select()
      .from(schema.foodEntries)
      .where(eq(schema.foodEntries.userId, session.user.id))
      .orderBy((entries) => entries.createdAt);

    const sortedEntries = entries.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    app.logger.info({ userId: session.user.id, count: sortedEntries.length }, 'Food entries retrieved');
    return sortedEntries;
  });

  // GET /api/food-entries/today - Today's entries for user
  app.fastify.get('/api/food-entries/today', {
    schema: {
      description: 'Get food entries for today for the authenticated user',
      tags: ['food-entries'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              foodName: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: ['number', 'null'] },
              carbs: { type: ['number', 'null'] },
              fat: { type: ['number', 'null'] },
              mealType: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching today food entries');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const entries = await app.db
      .select()
      .from(schema.foodEntries)
      .where(
        and(
          eq(schema.foodEntries.userId, session.user.id),
          gte(schema.foodEntries.createdAt, startOfDay),
          lt(schema.foodEntries.createdAt, endOfDay)
        )
      )
      .orderBy((entries) => entries.createdAt);

    const sortedEntries = entries.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    app.logger.info({ userId: session.user.id, count: sortedEntries.length }, 'Today food entries retrieved');
    return sortedEntries;
  });

  // GET /api/food-entries/stats/today - Today's stats for user
  app.fastify.get('/api/food-entries/stats/today', {
    schema: {
      description: 'Get food statistics for today for the authenticated user',
      tags: ['food-entries'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalCalories: { type: 'number' },
            totalProtein: { type: 'number' },
            totalCarbs: { type: 'number' },
            totalFat: { type: 'number' },
            entryCount: { type: 'number' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching today food statistics');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const entries = await app.db
      .select()
      .from(schema.foodEntries)
      .where(
        and(
          eq(schema.foodEntries.userId, session.user.id),
          gte(schema.foodEntries.createdAt, startOfDay),
          lt(schema.foodEntries.createdAt, endOfDay)
        )
      );

    const stats = entries.reduce(
      (acc, entry) => ({
        totalCalories: acc.totalCalories + entry.calories,
        totalProtein: acc.totalProtein + (entry.protein || 0),
        totalCarbs: acc.totalCarbs + (entry.carbs || 0),
        totalFat: acc.totalFat + (entry.fat || 0),
        entryCount: acc.entryCount + 1,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, entryCount: 0 }
    );

    app.logger.info({ userId: session.user.id, stats }, 'Today food statistics retrieved');
    return stats;
  });

  // POST /api/food-entries - Create a food entry
  app.fastify.post<{ Body: CreateFoodEntryBody }>(
    '/api/food-entries',
    {
      schema: {
        description: 'Create a new food entry for the authenticated user',
        tags: ['food-entries'],
        body: {
          type: 'object',
          required: ['foodName', 'calories'],
          properties: {
            foodName: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            mealType: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string' },
              foodName: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: ['number', 'null'] },
              carbs: { type: ['number', 'null'] },
              fat: { type: ['number', 'null'] },
              mealType: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateFoodEntryBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { foodName, calories, protein, carbs, fat, mealType } = request.body;
      app.logger.info(
        { userId: session.user.id, foodName, calories },
        'Creating food entry'
      );

      const newEntry = await app.db
        .insert(schema.foodEntries)
        .values({
          userId: session.user.id,
          foodName,
          calories,
          protein: protein !== undefined ? protein : null,
          carbs: carbs !== undefined ? carbs : null,
          fat: fat !== undefined ? fat : null,
          mealType: mealType !== undefined ? mealType : null,
          createdAt: new Date(),
        })
        .returning();

      app.logger.info(
        { entryId: newEntry[0].id, userId: session.user.id },
        'Food entry created successfully'
      );
      return reply.status(201).send(newEntry[0]);
    }
  );

  // PUT /api/food-entries/:id - Update a food entry
  app.fastify.put<{ Params: { id: string }; Body: UpdateFoodEntryBody }>(
    '/api/food-entries/:id',
    {
      schema: {
        description: 'Update a food entry (only if user owns it)',
        tags: ['food-entries'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            foodName: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            mealType: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string' },
              foodName: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: ['number', 'null'] },
              carbs: { type: ['number', 'null'] },
              fat: { type: ['number', 'null'] },
              mealType: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateFoodEntryBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info(
        { userId: session.user.id, entryId: id },
        'Updating food entry'
      );

      const entry = await app.db
        .select()
        .from(schema.foodEntries)
        .where(eq(schema.foodEntries.id, id))
        .limit(1);

      if (!entry || entry.length === 0) {
        app.logger.warn({ entryId: id }, 'Food entry not found');
        return reply.status(404).send({ error: 'Food entry not found' });
      }

      if (entry[0].userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, entryId: id, ownerId: entry[0].userId },
          'User does not own this food entry'
        );
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { foodName, calories, protein, carbs, fat, mealType } = request.body;

      const updatedEntry = await app.db
        .update(schema.foodEntries)
        .set({
          foodName: foodName !== undefined ? foodName : entry[0].foodName,
          calories: calories !== undefined ? calories : entry[0].calories,
          protein: protein !== undefined ? protein : entry[0].protein,
          carbs: carbs !== undefined ? carbs : entry[0].carbs,
          fat: fat !== undefined ? fat : entry[0].fat,
          mealType: mealType !== undefined ? mealType : entry[0].mealType,
        })
        .where(eq(schema.foodEntries.id, id))
        .returning();

      app.logger.info(
        { entryId: id, userId: session.user.id },
        'Food entry updated successfully'
      );
      return updatedEntry[0];
    }
  );

  // DELETE /api/food-entries/:id - Delete a food entry
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/food-entries/:id',
    {
      schema: {
        description: 'Delete a food entry (only if user owns it)',
        tags: ['food-entries'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info(
        { userId: session.user.id, entryId: id },
        'Deleting food entry'
      );

      const entry = await app.db
        .select()
        .from(schema.foodEntries)
        .where(eq(schema.foodEntries.id, id))
        .limit(1);

      if (!entry || entry.length === 0) {
        app.logger.warn({ entryId: id }, 'Food entry not found');
        return reply.status(404).send({ error: 'Food entry not found' });
      }

      if (entry[0].userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, entryId: id, ownerId: entry[0].userId },
          'User does not own this food entry'
        );
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await app.db
        .delete(schema.foodEntries)
        .where(eq(schema.foodEntries.id, id));

      app.logger.info(
        { entryId: id, userId: session.user.id },
        'Food entry deleted successfully'
      );
      return { success: true };
    }
  );
}

