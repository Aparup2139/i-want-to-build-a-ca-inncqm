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

  test("Sign up test user", async () => {
    const { token } = await signUpTestUser();
    authToken = token;
    expect(authToken).toBeDefined();
  });

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

  test("Get all food entries", async () => {
    const res = await authenticatedApi("/api/food-entries", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
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

  test("Analyze food image", async () => {
    const form = new FormData();
    // Create a larger 256x256 PNG with varied color data (more analyzable by Gemini)
    // This is a 256x256 PNG with orange/brown coloring to simulate food
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x90, 0x69, 0x3c, 0x00, 0x00, 0x01,
      0x2d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0xed, 0xc1, 0x31, 0x0d, 0x00,
      0x00, 0x08, 0x03, 0xa0, 0xf5, 0x4f, 0xed, 0x61, 0x0d, 0xa0, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xf0, 0x3f, 0x00, 0x00, 0x01, 0x00, 0x01, 0xfe, 0x19, 0xb6, 0xee, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
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
