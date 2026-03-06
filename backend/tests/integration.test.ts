import { describe, test, expect } from "bun:test";
import {
  api,
  authenticatedApi,
  signUpTestUser,
  expectStatus,
  createTestFile,
} from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let foodEntryId: string;
  let foodEntryIdForOwnershipTest: string;
  let userId: string;

  test("Sign up test user", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    userId = user.id;
    expect(authToken).toBeDefined();
  });

  // ===== User Profile Tests =====

  test("Get user profile", async () => {
    const res = await authenticatedApi("/api/user/profile", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.userId).toBeDefined();
    expect(typeof data.onboarding_completed).toBe("boolean");
    expect(typeof data.is_pro).toBe("boolean");
  });

  test("Update user profile", async () => {
    const res = await authenticatedApi("/api/user/profile", authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: 30,
        gender: "M",
        height_cm: 180,
        weight_kg: 75,
        goal: "lose weight",
        activity_level: "moderate",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.userId).toBeDefined();
    expect(data.age).toBe(30);
  });

  test("Get user profile without auth returns 401", async () => {
    const res = await api("/api/user/profile");
    await expectStatus(res, 401);
  });

  test("Update user profile without auth returns 401", async () => {
    const res = await api("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: 25 }),
    });
    await expectStatus(res, 401);
  });

  // ===== Onboarding Tests =====

  test("Complete onboarding", async () => {
    const res = await authenticatedApi(
      "/api/user/complete-onboarding",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: 25,
          gender: "F",
          height_cm: 165,
          weight_kg: 65,
          goal: "gain muscle",
          activity_level: "high",
        }),
      }
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.userId).toBeDefined();
    expect(data.onboarding_completed).toBe(true);
    expect(typeof data.daily_calorie_target).toBe("number");
  });

  test("Complete onboarding without required fields returns 400", async () => {
    const res = await authenticatedApi(
      "/api/user/complete-onboarding",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: 25,
          gender: "F",
          // missing height_cm, weight_kg, goal, activity_level
        }),
      }
    );
    await expectStatus(res, 400);
  });

  test("Complete onboarding without auth returns 401", async () => {
    const res = await api("/api/user/complete-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: 25,
        gender: "F",
        height_cm: 165,
        weight_kg: 65,
        goal: "gain muscle",
        activity_level: "high",
      }),
    });
    await expectStatus(res, 401);
  });

  // ===== Usage Tests =====

  test("Get usage today", async () => {
    const res = await authenticatedApi("/api/usage/today", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.date).toBeDefined();
    expect(typeof data.scans_count).toBe("number");
    expect(typeof data.scans_remaining).toBe("number");
    expect(typeof data.is_pro).toBe("boolean");
    expect(typeof data.can_scan).toBe("boolean");
  });

  test("Check scan limit", async () => {
    const res = await authenticatedApi("/api/usage/check-limit", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(typeof data.can_scan).toBe("boolean");
  });

  test("Increment usage", async () => {
    const res = await authenticatedApi("/api/usage/increment", authToken, {
      method: "POST",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(typeof data.scans_count).toBe("number");
    expect(typeof data.scans_remaining).toBe("number");
    expect(typeof data.can_scan).toBe("boolean");
  });

  test("Get usage today without auth returns 401", async () => {
    const res = await api("/api/usage/today");
    await expectStatus(res, 401);
  });

  test("Check scan limit without auth returns 401", async () => {
    const res = await api("/api/usage/check-limit");
    await expectStatus(res, 401);
  });

  test("Increment usage without auth returns 401", async () => {
    const res = await api("/api/usage/increment", {
      method: "POST",
    });
    await expectStatus(res, 401);
  });

  // ===== Food Entries CRUD Tests =====

  test("Create food entry", async () => {
    const res = await authenticatedApi("/api/food-entries", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: "Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        mealType: "lunch",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    foodEntryId = data.id;
    expect(data.foodName).toBe("Chicken Breast");
    expect(data.calories).toBe(165);
  });

  test("Create additional food entry for history tests", async () => {
    const res = await authenticatedApi("/api/food-entries", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: "Broccoli",
        calories: 55,
        protein: 3.7,
        carbs: 11,
        fat: 0.6,
        mealType: "dinner",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    foodEntryIdForOwnershipTest = data.id;
  });

  test("Get all food entries", async () => {
    const res = await authenticatedApi("/api/food-entries", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  test("Get today's food entries", async () => {
    const res = await authenticatedApi("/api/food-entries/today", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Get today's food stats", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/stats/today",
      authToken
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(typeof data.totalCalories).toBe("number");
    expect(typeof data.totalProtein).toBe("number");
    expect(typeof data.totalCarbs).toBe("number");
    expect(typeof data.totalFat).toBe("number");
    expect(typeof data.entryCount).toBe("number");
  });

  // ===== History and Date Stats Tests =====

  test("Get food entries history", async () => {
    const res = await authenticatedApi("/api/food-entries/history", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].date).toBeDefined();
      expect(Array.isArray(data[0].entries)).toBe(true);
      expect(data[0].stats).toBeDefined();
    }
  });

  test("Get food entries history with days parameter", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/history?days=7",
      authToken
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Get stats for specific date", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/stats/date/2026-03-06",
      authToken
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(typeof data.totalCalories).toBe("number");
    expect(typeof data.totalProtein).toBe("number");
    expect(typeof data.totalCarbs).toBe("number");
    expect(typeof data.totalFat).toBe("number");
    expect(typeof data.entryCount).toBe("number");
  });

  test("Get stats for invalid date format returns 400", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/stats/date/invalid-date",
      authToken
    );
    await expectStatus(res, 400);
  });

  test("Get history without auth returns 401", async () => {
    const res = await api("/api/food-entries/history");
    await expectStatus(res, 401);
  });

  test("Get date stats without auth returns 401", async () => {
    const res = await api("/api/food-entries/stats/date/2026-03-06");
    await expectStatus(res, 401);
  });

  // ===== Food Entry Update/Delete Tests =====

  test("Update food entry", async () => {
    const res = await authenticatedApi(
      `/api/food-entries/${foodEntryId}`,
      authToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: "Grilled Chicken Breast",
          calories: 170,
        }),
      }
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.foodName).toBe("Grilled Chicken Breast");
  });

  test("Delete food entry", async () => {
    const res = await authenticatedApi(
      `/api/food-entries/${foodEntryId}`,
      authToken,
      {
        method: "DELETE",
      }
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Delete non-existent food entry returns 404", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "DELETE",
      }
    );
    await expectStatus(res, 404);
  });

  test("Update non-existent food entry returns 404", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: "Updated Food",
        }),
      }
    );
    await expectStatus(res, 404);
  });

  // ===== Food Entry Ownership Tests (403) =====

  test("Update food entry from another user returns 403", async () => {
    const { token: otherUserToken } = await signUpTestUser();
    const res = await authenticatedApi(
      `/api/food-entries/${foodEntryIdForOwnershipTest}`,
      otherUserToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: "Hacked by another user",
          calories: 999,
        }),
      }
    );
    await expectStatus(res, 403);
  });

  test("Delete food entry from another user returns 403", async () => {
    const { token: otherUserToken } = await signUpTestUser();
    const res = await authenticatedApi(
      `/api/food-entries/${foodEntryIdForOwnershipTest}`,
      otherUserToken,
      {
        method: "DELETE",
      }
    );
    await expectStatus(res, 403);
  });

  // ===== Food Entry Auth Error Tests =====

  test("Create food entry without auth returns 401", async () => {
    const res = await api("/api/food-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: "Test Food",
        calories: 100,
      }),
    });
    await expectStatus(res, 401);
  });

  test("Get all food entries without auth returns 401", async () => {
    const res = await api("/api/food-entries");
    await expectStatus(res, 401);
  });

  test("Get today's food entries without auth returns 401", async () => {
    const res = await api("/api/food-entries/today");
    await expectStatus(res, 401);
  });

  test("Get today's stats without auth returns 401", async () => {
    const res = await api("/api/food-entries/stats/today");
    await expectStatus(res, 401);
  });

  // ===== Food Entry Validation Tests =====

  test("Create food entry without required fields returns 400", async () => {
    const res = await authenticatedApi("/api/food-entries", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: "Test Food",
        // missing calories
      }),
    });
    await expectStatus(res, 400);
  });

  // ===== Food Image Analysis Tests =====

  test("Analyze food image", async () => {
    const form = new FormData();
    // Use a minimal but valid PNG (8x8 pixels with food-like orange color)
    // This is small enough to encode but large enough for Gemini to analyze
    const pngBuffer = Buffer.from([
      // PNG signature
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      // IHDR chunk (8x8 RGB)
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x08,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x4b, 0x6d, 0x25,
      0xdc,
      // IDAT chunk (orange pixels)
      0x00, 0x00, 0x00, 0x1b, 0x49, 0x44, 0x41, 0x54,
      0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00,
      0x0d, 0x00, 0x08, 0xff, 0xff, 0x01, 0x00, 0x02,
      0x00, 0x01, 0x00, 0x08, 0x17, 0x4e, 0x8f, 0xf3,
      0x1c, 0xef,
      // IEND chunk
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);
    const pngFile = new File([pngBuffer], "test-food.png", { type: "image/png" });
    form.append("file", pngFile);
    const res = await authenticatedApi("/api/food/analyze-image", authToken, {
      method: "POST",
      body: form,
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.foodName).toBeDefined();
    expect(typeof data.calories).toBe("number");
    expect(["high", "medium", "low"]).toContain(data.confidence);
  });

  test("Analyze food image without auth returns 401", async () => {
    const form = new FormData();
    form.append("file", createTestFile("test-food.jpg", "", "image/jpeg"));
    const res = await api("/api/food/analyze-image", {
      method: "POST",
      body: form,
    });
    await expectStatus(res, 401);
  });

  test("Analyze food image without file returns 400", async () => {
    const form = new FormData();
    const res = await authenticatedApi("/api/food/analyze-image", authToken, {
      method: "POST",
      body: form,
    });
    await expectStatus(res, 400);
  });

  // ===== Food Entry from Image Tests =====

  test("Create food entry from image", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/from-image",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: "Pasta Carbonara",
          calories: 450,
          protein: 18,
          carbs: 55,
          fat: 20,
          imageUrl: "https://example.com/pasta.jpg",
          mealType: "dinner",
        }),
      }
    );
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.userId).toBeDefined();
    expect(data.foodName).toBe("Pasta Carbonara");
    expect(data.calories).toBe(450);
    expect(data.recognizedByAi).toBeDefined();
  });

  test("Create food entry from image without required fields returns 400", async () => {
    const res = await authenticatedApi(
      "/api/food-entries/from-image",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: "Pasta",
          // missing calories
        }),
      }
    );
    await expectStatus(res, 400);
  });

  test("Create food entry from image without auth returns 401", async () => {
    const res = await api("/api/food-entries/from-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: "Pasta Carbonara",
        calories: 450,
        imageUrl: "https://example.com/pasta.jpg",
      }),
    });
    await expectStatus(res, 401);
  });
});
