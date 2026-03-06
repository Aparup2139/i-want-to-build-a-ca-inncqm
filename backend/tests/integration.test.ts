import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

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
});
