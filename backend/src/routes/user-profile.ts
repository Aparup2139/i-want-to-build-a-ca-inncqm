import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';

interface UpdateProfileBody {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: string;
  activity_level?: string;
  name?: string;
}

interface CompleteOnboardingBody {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  activity_level: string;
}

// Calculate Daily Calorie Target using Mifflin-St Jeor equation
function calculateCalorieTarget(
  age: number,
  gender: string,
  heightCm: number,
  weightKg: number,
  activityLevel: string,
  goal: string
): number {
  // Calculate BMR using Mifflin-St Jeor
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Average for other
    const maleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const femaleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    bmr = (maleBmr + femaleBmr) / 2;
  }

  // Apply activity level multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = bmr * multiplier;

  // Apply goal adjustment
  const goalAdjustments: Record<string, number> = {
    lose_weight: -500,
    maintain: 0,
    gain_weight: 500,
    build_muscle: 300,
  };
  const adjustment = goalAdjustments[goal] || 0;

  return Math.round(tdee + adjustment);
}

export function registerUserProfileRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/user/profile - Get user profile
  app.fastify.get('/api/user/profile', {
    schema: {
      description: 'Get user profile information',
      tags: ['user-profile'],
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            age: { type: ['integer', 'null'] },
            gender: { type: ['string', 'null'] },
            height_cm: { type: ['number', 'null'] },
            weight_kg: { type: ['number', 'null'] },
            goal: { type: ['string', 'null'] },
            activity_level: { type: ['string', 'null'] },
            daily_calorie_target: { type: ['integer', 'null'] },
            onboarding_completed: { type: 'boolean' },
            is_pro: { type: 'boolean' },
            pro_expires_at: { type: ['string', 'null'], format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching user profile');

    let profile = await app.db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, session.user.id))
      .limit(1);

    // Create profile if doesn't exist
    if (profile.length === 0) {
      app.logger.info({ userId: session.user.id }, 'Creating new user profile');
      const newProfile = await app.db
        .insert(schema.userProfiles)
        .values({
          userId: session.user.id,
          onboardingCompleted: false,
          isPro: false,
        })
        .returning();
      profile = newProfile;
    }

    const profileData = profile[0];
    return {
      userId: profileData.userId,
      age: profileData.age,
      gender: profileData.gender,
      height_cm: profileData.heightCm,
      weight_kg: profileData.weightKg,
      goal: profileData.goal,
      activity_level: profileData.activityLevel,
      daily_calorie_target: profileData.dailyCalorieTarget,
      onboarding_completed: profileData.onboardingCompleted,
      is_pro: profileData.isPro,
      pro_expires_at: profileData.proExpiresAt?.toISOString() || null,
    };
  });

  // PUT /api/user/profile - Update user profile
  app.fastify.put<{ Body: UpdateProfileBody }>(
    '/api/user/profile',
    {
      schema: {
        description: 'Update user profile and calculate calorie target',
        tags: ['user-profile'],
        body: {
          type: 'object',
          properties: {
            age: { type: 'integer' },
            gender: { type: 'string' },
            height_cm: { type: 'number' },
            weight_kg: { type: 'number' },
            goal: { type: 'string' },
            activity_level: { type: 'string' },
            name: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              age: { type: ['integer', 'null'] },
              gender: { type: ['string', 'null'] },
              height_cm: { type: ['number', 'null'] },
              weight_kg: { type: ['number', 'null'] },
              goal: { type: ['string', 'null'] },
              activity_level: { type: ['string', 'null'] },
              daily_calorie_target: { type: ['integer', 'null'] },
              onboarding_completed: { type: 'boolean' },
              is_pro: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { age, gender, height_cm, weight_kg, goal, activity_level, name } = request.body;
      app.logger.info({ userId: session.user.id }, 'Updating user profile');

      // Get existing profile or create new one
      let profile = await app.db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, session.user.id))
        .limit(1);

      if (profile.length === 0) {
        const newProfile = await app.db
          .insert(schema.userProfiles)
          .values({
            userId: session.user.id,
            onboardingCompleted: false,
            isPro: false,
          })
          .returning();
        profile = newProfile;
      }

      const existingProfile = profile[0];

      // Calculate new calorie target if needed
      let newDailyCalorieTarget = existingProfile.dailyCalorieTarget;
      if (age !== undefined && gender !== undefined && height_cm !== undefined && weight_kg !== undefined && goal !== undefined && activity_level !== undefined) {
        newDailyCalorieTarget = calculateCalorieTarget(age, gender, height_cm, weight_kg, activity_level, goal);
      }

      // Update profile
      const updated = await app.db
        .update(schema.userProfiles)
        .set({
          age: age !== undefined ? age : existingProfile.age,
          gender: gender !== undefined ? gender : existingProfile.gender,
          heightCm: height_cm !== undefined ? height_cm : existingProfile.heightCm,
          weightKg: weight_kg !== undefined ? weight_kg : existingProfile.weightKg,
          goal: goal !== undefined ? goal : existingProfile.goal,
          activityLevel: activity_level !== undefined ? activity_level : existingProfile.activityLevel,
          dailyCalorieTarget: newDailyCalorieTarget,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, session.user.id))
        .returning();

      app.logger.info({ userId: session.user.id, dailyCalorieTarget: newDailyCalorieTarget }, 'User profile updated');

      const updatedProfile = updated[0];
      return {
        userId: updatedProfile.userId,
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        height_cm: updatedProfile.heightCm,
        weight_kg: updatedProfile.weightKg,
        goal: updatedProfile.goal,
        activity_level: updatedProfile.activityLevel,
        daily_calorie_target: updatedProfile.dailyCalorieTarget,
        onboarding_completed: updatedProfile.onboardingCompleted,
        is_pro: updatedProfile.isPro,
      };
    }
  );

  // POST /api/user/complete-onboarding - Complete onboarding
  app.fastify.post<{ Body: CompleteOnboardingBody }>(
    '/api/user/complete-onboarding',
    {
      schema: {
        description: 'Complete user onboarding with profile data',
        tags: ['user-profile'],
        body: {
          type: 'object',
          required: ['age', 'gender', 'height_cm', 'weight_kg', 'goal', 'activity_level'],
          properties: {
            age: { type: 'integer' },
            gender: { type: 'string' },
            height_cm: { type: 'number' },
            weight_kg: { type: 'number' },
            goal: { type: 'string' },
            activity_level: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              age: { type: 'integer' },
              gender: { type: 'string' },
              height_cm: { type: 'number' },
              weight_kg: { type: 'number' },
              goal: { type: 'string' },
              activity_level: { type: 'string' },
              daily_calorie_target: { type: 'integer' },
              onboarding_completed: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CompleteOnboardingBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { age, gender, height_cm, weight_kg, goal, activity_level } = request.body;
      app.logger.info({ userId: session.user.id }, 'Completing onboarding');

      const dailyCalorieTarget = calculateCalorieTarget(age, gender, height_cm, weight_kg, activity_level, goal);

      const updated = await app.db
        .update(schema.userProfiles)
        .set({
          age,
          gender,
          heightCm: height_cm,
          weightKg: weight_kg,
          goal,
          activityLevel: activity_level,
          dailyCalorieTarget,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, session.user.id))
        .returning();

      app.logger.info({ userId: session.user.id, onboardingCompleted: true }, 'Onboarding completed');

      const profile = updated[0];
      return {
        userId: profile.userId,
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        goal: profile.goal,
        activity_level: profile.activityLevel,
        daily_calorie_target: profile.dailyCalorieTarget,
        onboarding_completed: profile.onboardingCompleted,
      };
    }
  );
}
