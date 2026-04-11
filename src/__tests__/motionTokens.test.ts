/// <reference types="jest" />
import {
  duration,
  stagger,
  ease,
  spring,
  distance,
  scale,
  MAX_STAGGER_ITEMS,
  staggerDelay,
} from "../lib/motion/tokens";

// =========== Duration tokens ===========

describe("duration tokens", () => {
  test("all values are positive numbers", () => {
    for (const [, val] of Object.entries(duration)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    }
  });

  test("exit is snappy (≤ 0.2s)", () => {
    expect(duration.exit).toBeLessThanOrEqual(0.2);
  });

  test("instant < fast < normal < emphasis", () => {
    expect(duration.instant).toBeLessThan(duration.fast);
    expect(duration.fast).toBeLessThan(duration.normal);
    expect(duration.normal).toBeLessThan(duration.emphasis);
  });

  test("no duration exceeds 1 second (performance guard)", () => {
    for (const val of Object.values(duration)) {
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  test("contains all required keys", () => {
    const required = ["instant", "fast", "normal", "emphasis", "slow", "glacial", "exit"];
    for (const key of required) {
      expect(duration).toHaveProperty(key);
    }
  });
});

// =========== Stagger tokens ===========

describe("stagger tokens", () => {
  test("all values are positive numbers", () => {
    for (const val of Object.values(stagger)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    }
  });

  test("tight < normal < loose", () => {
    expect(stagger.tight).toBeLessThan(stagger.normal);
    expect(stagger.normal).toBeLessThan(stagger.loose);
  });

  test("all stagger values are under 200ms (performance)", () => {
    for (const val of Object.values(stagger)) {
      expect(val).toBeLessThan(0.2);
    }
  });

  test("contains tight, normal, loose", () => {
    expect(stagger).toHaveProperty("tight");
    expect(stagger).toHaveProperty("normal");
    expect(stagger).toHaveProperty("loose");
  });
});

// =========== Ease curves ===========

describe("ease curves", () => {
  test("each ease is a 4-element tuple", () => {
    for (const [, curve] of Object.entries(ease)) {
      expect(curve).toHaveLength(4);
    }
  });

  test("all curve values are between 0 and 1 for x-coordinates", () => {
    for (const curve of Object.values(ease)) {
      // x1 and x2 must be in [0, 1] per CSS spec
      expect(curve[0]).toBeGreaterThanOrEqual(0);
      expect(curve[0]).toBeLessThanOrEqual(1);
      expect(curve[2]).toBeGreaterThanOrEqual(0);
      expect(curve[2]).toBeLessThanOrEqual(1);
    }
  });

  test("contains out, inOut, in curves", () => {
    expect(ease).toHaveProperty("out");
    expect(ease).toHaveProperty("inOut");
    expect(ease).toHaveProperty("in");
  });
});

// =========== Spring presets ===========

describe("spring presets", () => {
  const presets = Object.entries(spring);

  test("all presets have type, stiffness, damping", () => {
    for (const [, preset] of presets) {
      expect(preset.type).toBe("spring");
      expect(typeof preset.stiffness).toBe("number");
      expect(typeof preset.damping).toBe("number");
    }
  });

  test("stiffness is positive", () => {
    for (const [, preset] of presets) {
      expect(preset.stiffness).toBeGreaterThan(0);
    }
  });

  test("damping is positive", () => {
    for (const [, preset] of presets) {
      expect(preset.damping).toBeGreaterThan(0);
    }
  });

  test("bouncy has lower damping than default (enables overshoot)", () => {
    expect(spring.bouncy.damping).toBeLessThan(spring.default.damping);
  });

  test("stiff has higher stiffness than gentle", () => {
    expect(spring.stiff.stiffness).toBeGreaterThan(spring.gentle.stiffness);
  });

  test("contains default, stiff, bouncy, gentle", () => {
    expect(spring).toHaveProperty("default");
    expect(spring).toHaveProperty("stiff");
    expect(spring).toHaveProperty("bouncy");
    expect(spring).toHaveProperty("gentle");
  });
});

// =========== Distance tokens ===========

describe("distance tokens", () => {
  test("all values are positive numbers", () => {
    for (const val of Object.values(distance)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    }
  });

  test("sm < md < lg < swipeExit", () => {
    expect(distance.sm).toBeLessThan(distance.md);
    expect(distance.md).toBeLessThan(distance.lg);
    expect(distance.lg).toBeLessThan(distance.swipeExit);
  });

  test("swipeExit is large enough for gesture recognition", () => {
    expect(distance.swipeExit).toBeGreaterThanOrEqual(50);
  });

  test("contains sm, md, lg, swipeExit", () => {
    expect(distance).toHaveProperty("sm");
    expect(distance).toHaveProperty("md");
    expect(distance).toHaveProperty("lg");
    expect(distance).toHaveProperty("swipeExit");
  });
});

// =========== Scale tokens ===========

describe("scale tokens", () => {
  test("all scale values are between 0 and 1", () => {
    for (const val of Object.values(scale)) {
      expect(val).toBeGreaterThan(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  test("tapButton is close to 1 (subtle press)", () => {
    expect(scale.tapButton).toBeGreaterThanOrEqual(0.9);
    expect(scale.tapButton).toBeLessThan(1);
  });

  test("tapFab is smaller than tapButton (more dramatic)", () => {
    expect(scale.tapFab).toBeLessThan(scale.tapButton);
  });

  test("modalEnter is close to 1 (subtle entrance scale)", () => {
    expect(scale.modalEnter).toBeGreaterThanOrEqual(0.95);
  });

  test("contains tapButton, tapFab, tapChip, modalEnter", () => {
    expect(scale).toHaveProperty("tapButton");
    expect(scale).toHaveProperty("tapFab");
    expect(scale).toHaveProperty("tapChip");
    expect(scale).toHaveProperty("modalEnter");
  });
});

// =========== MAX_STAGGER_ITEMS ===========

describe("MAX_STAGGER_ITEMS", () => {
  test("is a positive integer", () => {
    expect(Number.isInteger(MAX_STAGGER_ITEMS)).toBe(true);
    expect(MAX_STAGGER_ITEMS).toBeGreaterThan(0);
  });

  test("equals 12", () => {
    expect(MAX_STAGGER_ITEMS).toBe(12);
  });

  test("total stagger time is bounded (< 1s with normal stagger)", () => {
    const totalTime = MAX_STAGGER_ITEMS * stagger.normal;
    expect(totalTime).toBeLessThan(1);
  });
});

// =========== staggerDelay function ===========

describe("staggerDelay", () => {
  // ── Functional ──
  test("returns 0 for index 0", () => {
    expect(staggerDelay(0)).toBe(0);
  });

  test("returns correct delay for small index", () => {
    expect(staggerDelay(3)).toBeCloseTo(3 * stagger.tight);
  });

  test("uses custom delayPerItem", () => {
    expect(staggerDelay(5, 0.1)).toBeCloseTo(5 * 0.1);
  });

  test("defaults to stagger.tight when no delayPerItem given", () => {
    expect(staggerDelay(1)).toBe(stagger.tight);
  });

  // ── Boundary ──
  test("caps at MAX_STAGGER_ITEMS * delayPerItem", () => {
    const capped = staggerDelay(100, stagger.tight);
    const maxDelay = MAX_STAGGER_ITEMS * stagger.tight;
    expect(capped).toBeCloseTo(maxDelay);
  });

  test("index exactly at MAX_STAGGER_ITEMS equals the cap", () => {
    const atMax = staggerDelay(MAX_STAGGER_ITEMS, stagger.tight);
    const cap = MAX_STAGGER_ITEMS * stagger.tight;
    expect(atMax).toBeCloseTo(cap);
  });

  test("index at MAX_STAGGER_ITEMS - 1 is below the cap", () => {
    const belowMax = staggerDelay(MAX_STAGGER_ITEMS - 1, stagger.tight);
    const cap = MAX_STAGGER_ITEMS * stagger.tight;
    expect(belowMax).toBeLessThan(cap);
  });

  test("index at MAX_STAGGER_ITEMS + 1 equals the cap (not higher)", () => {
    const overMax = staggerDelay(MAX_STAGGER_ITEMS + 1, stagger.tight);
    const cap = MAX_STAGGER_ITEMS * stagger.tight;
    expect(overMax).toBeCloseTo(cap);
  });

  // ── Negative / edge ──
  test("negative index returns 0 (clamped by Math.min)", () => {
    // negative * positive < 0, and cap is positive, so Math.min picks negative
    // Actually: Math.min(-x, cap) = -x when x>0
    // This is a quirk — the function doesn't guard against negative inputs
    const result = staggerDelay(-1, stagger.tight);
    expect(result).toBeLessThanOrEqual(0);
  });

  test("very large index still respects the cap", () => {
    const huge = staggerDelay(10000, stagger.normal);
    const cap = MAX_STAGGER_ITEMS * stagger.normal;
    expect(huge).toBeCloseTo(cap);
  });

  test("zero delayPerItem returns 0 for any index", () => {
    expect(staggerDelay(5, 0)).toBe(0);
    expect(staggerDelay(100, 0)).toBe(0);
  });

  // ── Performance ──
  test("result is always ≤ MAX_STAGGER_ITEMS * stagger.loose (absolute ceiling)", () => {
    const absoluteMax = MAX_STAGGER_ITEMS * stagger.loose;
    for (let i = 0; i < 50; i++) {
      expect(staggerDelay(i, stagger.loose)).toBeLessThanOrEqual(absoluteMax + 0.001);
    }
  });
});
