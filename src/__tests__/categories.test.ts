/// <reference types="jest" />
import {
  DEFAULT_CATEGORIES_META,
  CATEGORIES,
  CATEGORY_MAP,
  DEFAULT_CATEGORIES,
  PRESET_COLORS,
  getAllCategories,
  buildCategoryMap,
} from "../lib/categories";
import type { CategoryMeta } from "../types";

// =========== DEFAULT_CATEGORIES_META ===========

describe("DEFAULT_CATEGORIES_META", () => {
  test("contains 9 default categories", () => {
    expect(DEFAULT_CATEGORIES_META).toHaveLength(9);
  });

  test("each category has required fields", () => {
    for (const cat of DEFAULT_CATEGORIES_META) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(cat.bgColor).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });

  test("all IDs are unique", () => {
    const ids = DEFAULT_CATEGORIES_META.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all labels are unique", () => {
    const labels = DEFAULT_CATEGORIES_META.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test("expected categories are present", () => {
    const ids = DEFAULT_CATEGORIES_META.map((c) => c.id);
    expect(ids).toContain("subscriptions");
    expect(ids).toContain("transport");
    expect(ids).toContain("groceries");
    expect(ids).toContain("eat-out");
    expect(ids).toContain("shopping");
    expect(ids).toContain("miscellaneous");
    expect(ids).toContain("credit-card");
    expect(ids).toContain("internet");
    expect(ids).toContain("sip-nps");
  });

  test("bgColor is derived from color with alpha", () => {
    for (const cat of DEFAULT_CATEGORIES_META) {
      // bgColor should start with the same hex as color
      expect(cat.bgColor.startsWith(cat.color)).toBe(true);
    }
  });
});

// =========== CATEGORIES alias ===========

describe("CATEGORIES", () => {
  test("is same reference as DEFAULT_CATEGORIES_META", () => {
    expect(CATEGORIES).toBe(DEFAULT_CATEGORIES_META);
  });
});

// =========== CATEGORY_MAP ===========

describe("CATEGORY_MAP", () => {
  test("has entries for all default categories", () => {
    for (const cat of DEFAULT_CATEGORIES_META) {
      expect(CATEGORY_MAP[cat.id]).toBeDefined();
      expect(CATEGORY_MAP[cat.id].label).toBe(cat.label);
    }
  });

  test("lookup by id returns correct meta", () => {
    const groceries = CATEGORY_MAP["groceries"];
    expect(groceries.label).toBe("Groceries");
    expect(groceries.color).toBe("#10B981");
  });

  test("non-existent key returns undefined", () => {
    expect(CATEGORY_MAP["nonexistent"]).toBeUndefined();
  });
});

// =========== DEFAULT_CATEGORIES ===========

describe("DEFAULT_CATEGORIES", () => {
  test("is array of category ids", () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(DEFAULT_CATEGORIES_META.length);
    for (const id of DEFAULT_CATEGORIES) {
      expect(typeof id).toBe("string");
    }
  });

  test("matches ids from DEFAULT_CATEGORIES_META", () => {
    expect(DEFAULT_CATEGORIES).toEqual(DEFAULT_CATEGORIES_META.map((c) => c.id));
  });
});

// =========== PRESET_COLORS ===========

describe("PRESET_COLORS", () => {
  test("all are valid hex color codes", () => {
    for (const color of PRESET_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("has reasonable number of presets (> 30)", () => {
    expect(PRESET_COLORS.length).toBeGreaterThan(30);
  });

  test("all colors are unique", () => {
    const upper = PRESET_COLORS.map((c) => c.toUpperCase());
    expect(new Set(upper).size).toBe(upper.length);
  });
});

// =========== getAllCategories ===========

describe("getAllCategories", () => {
  test("returns defaults when no custom or hidden", () => {
    const result = getAllCategories();
    expect(result).toEqual(DEFAULT_CATEGORIES_META);
  });

  test("returns defaults when empty arrays", () => {
    const result = getAllCategories([], []);
    expect(result).toEqual(DEFAULT_CATEGORIES_META);
  });

  test("appends custom categories after defaults", () => {
    const custom: CategoryMeta[] = [
      { id: "pets", label: "Pets", color: "#FF0000", bgColor: "#FF000020", icon: "Dog" },
    ];
    const result = getAllCategories(custom);
    expect(result).toHaveLength(DEFAULT_CATEGORIES_META.length + 1);
    expect(result[result.length - 1].id).toBe("pets");
  });

  test("hides specified default categories", () => {
    const result = getAllCategories([], ["subscriptions", "sip-nps"]);
    expect(result).toHaveLength(DEFAULT_CATEGORIES_META.length - 2);
    expect(result.find((c) => c.id === "subscriptions")).toBeUndefined();
    expect(result.find((c) => c.id === "sip-nps")).toBeUndefined();
  });

  test("hides defaults and adds custom simultaneously", () => {
    const custom: CategoryMeta[] = [
      { id: "hobby", label: "Hobby", color: "#00FF00", bgColor: "#00FF0020", icon: "Star" },
    ];
    const result = getAllCategories(custom, ["miscellaneous"]);
    expect(result.find((c) => c.id === "miscellaneous")).toBeUndefined();
    expect(result.find((c) => c.id === "hobby")).toBeDefined();
    expect(result).toHaveLength(DEFAULT_CATEGORIES_META.length - 1 + 1);
  });

  test("hiding all defaults returns only custom", () => {
    const allDefaultIds = DEFAULT_CATEGORIES_META.map((c) => c.id);
    const custom: CategoryMeta[] = [
      { id: "only-one", label: "Only One", color: "#AABBCC", bgColor: "#AABBCC20", icon: "X" },
    ];
    const result = getAllCategories(custom, allDefaultIds);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("only-one");
  });

  test("hiding non-existent category does nothing", () => {
    const result = getAllCategories([], ["does-not-exist"]);
    expect(result).toEqual(DEFAULT_CATEGORIES_META);
  });

  test("multiple custom categories preserve order", () => {
    const customs: CategoryMeta[] = [
      { id: "a", label: "A", color: "#000001", bgColor: "#00000120", icon: "A" },
      { id: "b", label: "B", color: "#000002", bgColor: "#00000220", icon: "B" },
      { id: "c", label: "C", color: "#000003", bgColor: "#00000320", icon: "C" },
    ];
    const result = getAllCategories(customs);
    const customPart = result.slice(DEFAULT_CATEGORIES_META.length);
    expect(customPart.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

// =========== buildCategoryMap ===========

describe("buildCategoryMap", () => {
  test("returns map of all defaults", () => {
    const map = buildCategoryMap();
    for (const cat of DEFAULT_CATEGORIES_META) {
      expect(map[cat.id]).toBeDefined();
    }
  });

  test("includes custom categories in map", () => {
    const custom: CategoryMeta[] = [
      { id: "rent", label: "Rent", color: "#123456", bgColor: "#12345620", icon: "Home" },
    ];
    const map = buildCategoryMap(custom);
    expect(map["rent"]).toBeDefined();
    expect(map["rent"].label).toBe("Rent");
  });

  test("excludes hidden defaults from map", () => {
    const map = buildCategoryMap([], ["subscriptions"]);
    expect(map["subscriptions"]).toBeUndefined();
    expect(map["groceries"]).toBeDefined();
  });

  test("custom category with same id as default overrides it", () => {
    const custom: CategoryMeta[] = [
      { id: "groceries", label: "Custom Groceries", color: "#FF0000", bgColor: "#FF000020", icon: "Cart" },
    ];
    // Even though both exist in concat, Object.fromEntries takes last
    const map = buildCategoryMap(custom);
    expect(map["groceries"].label).toBe("Custom Groceries");
  });

  test("empty map when all hidden and no custom", () => {
    const allIds = DEFAULT_CATEGORIES_META.map((c) => c.id);
    const map = buildCategoryMap([], allIds);
    expect(Object.keys(map)).toHaveLength(0);
  });
});
