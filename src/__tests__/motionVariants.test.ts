/// <reference types="jest" />
import {
  fadeUp,
  fadeUpSmall,
  fadeIn,
  scaleIn,
  staggerContainer,
  staggerTight,
  staggerLoose,
  listItem,
  modalBackdrop,
  modalContent,
  pageTransition,
  tapButton,
  tapChip,
  tapFab,
  slideFromRight,
  expandCollapse,
} from "../lib/motion/variants";
import { duration, ease, stagger, spring, distance, scale } from "../lib/motion/tokens";

// =========== Structural integrity ===========

describe("motion variants structure", () => {
  const allVariants = {
    fadeUp,
    fadeUpSmall,
    fadeIn,
    scaleIn,
    staggerContainer,
    staggerTight,
    staggerLoose,
    listItem,
    modalBackdrop,
    modalContent,
    pageTransition,
    slideFromRight,
    expandCollapse,
  };

  test("all variants have initial and animate states", () => {
    for (const [, variant] of Object.entries(allVariants)) {
      expect(variant).toHaveProperty("initial");
      expect(variant).toHaveProperty("animate");
    }
  });

  test("entrance variants have exit state", () => {
    const withExit = [fadeUp, fadeUpSmall, fadeIn, scaleIn, listItem, modalBackdrop, modalContent, pageTransition, slideFromRight];
    for (const variant of withExit) {
      expect(variant).toHaveProperty("exit");
    }
  });
});

// =========== Token consistency (variants use tokens, not hardcoded) ===========

describe("variant-token consistency", () => {
  test("fadeUp uses duration.emphasis for entrance", () => {
    const animate = fadeUp.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(duration.emphasis);
  });

  test("fadeUp uses ease.out for entrance", () => {
    const animate = fadeUp.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.ease).toEqual(ease.out);
  });

  test("fadeUp exit uses duration.exit", () => {
    const exit = fadeUp.exit as Record<string, unknown>;
    const transition = exit.transition as Record<string, unknown>;
    expect(transition.duration).toBe(duration.exit);
  });

  test("fadeUpSmall uses distance.sm for initial y offset", () => {
    const initial = fadeUpSmall.initial as Record<string, unknown>;
    expect(initial.y).toBe(distance.sm);
  });

  test("fadeUp uses distance.md for initial y offset", () => {
    const initial = fadeUp.initial as Record<string, unknown>;
    expect(initial.y).toBe(distance.md);
  });

  test("scaleIn uses scale.modalEnter for initial scale", () => {
    const initial = scaleIn.initial as Record<string, unknown>;
    expect(initial.scale).toBe(scale.modalEnter);
  });

  test("scaleIn uses spring.default for entrance", () => {
    const animate = scaleIn.animate as Record<string, unknown>;
    expect(animate.transition).toEqual(spring.default);
  });

  test("staggerContainer uses stagger.normal", () => {
    const animate = staggerContainer.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(stagger.normal);
  });

  test("staggerTight uses stagger.tight", () => {
    const animate = staggerTight.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(stagger.tight);
  });

  test("staggerLoose uses stagger.loose", () => {
    const animate = staggerLoose.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(stagger.loose);
  });

  test("listItem uses distance.sm and duration.normal", () => {
    const initial = listItem.initial as Record<string, unknown>;
    expect(initial.y).toBe(distance.sm);
    const animate = listItem.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(duration.normal);
  });

  test("modalContent uses spring.default and distance.lg", () => {
    const initial = modalContent.initial as Record<string, unknown>;
    expect(initial.y).toBe(distance.lg);
    expect(initial.scale).toBe(scale.modalEnter);
    const animate = modalContent.animate as Record<string, unknown>;
    expect(animate.transition).toEqual(spring.default);
  });

  test("slideFromRight uses distance.lg for x offset", () => {
    const initial = slideFromRight.initial as Record<string, unknown>;
    expect(initial.x).toBe(distance.lg);
  });

  test("pageTransition uses duration.emphasis for entrance", () => {
    const animate = pageTransition.animate as Record<string, unknown>;
    const transition = animate.transition as Record<string, unknown>;
    expect(transition.duration).toBe(duration.emphasis);
  });
});

// =========== Tap presets ===========

describe("tap presets", () => {
  test("tapButton uses scale.tapButton", () => {
    expect(tapButton.scale).toBe(scale.tapButton);
  });

  test("tapChip uses scale.tapChip", () => {
    expect(tapChip.scale).toBe(scale.tapChip);
  });

  test("tapFab uses scale.tapFab", () => {
    expect(tapFab.scale).toBe(scale.tapFab);
  });
});

// =========== Initial states ===========

describe("initial state opacity", () => {
  const entranceVariants = [fadeUp, fadeUpSmall, fadeIn, scaleIn, listItem, modalContent, pageTransition, slideFromRight];

  test("all entrance variants start invisible (opacity: 0)", () => {
    for (const variant of entranceVariants) {
      const initial = variant.initial as Record<string, unknown>;
      expect(initial.opacity).toBe(0);
    }
  });

  test("all entrance variants animate to full opacity (opacity: 1)", () => {
    for (const variant of entranceVariants) {
      const animate = variant.animate as Record<string, unknown>;
      expect(animate.opacity).toBe(1);
    }
  });
});

// =========== Exit animations are faster than entrances (UX best practice) ===========

describe("exit vs entrance timing", () => {
  test("fadeUp exit is faster than entrance", () => {
    const animateT = (fadeUp.animate as Record<string, unknown>).transition as Record<string, number>;
    const exitT = (fadeUp.exit as Record<string, unknown>).transition as Record<string, number>;
    expect(exitT.duration).toBeLessThan(animateT.duration);
  });

  test("fadeIn exit is faster than entrance", () => {
    const animateT = (fadeIn.animate as Record<string, unknown>).transition as Record<string, number>;
    const exitT = (fadeIn.exit as Record<string, unknown>).transition as Record<string, number>;
    expect(exitT.duration).toBeLessThan(animateT.duration);
  });

  test("listItem exit is faster or equal to entrance", () => {
    const animateT = (listItem.animate as Record<string, unknown>).transition as Record<string, number>;
    const exitT = (listItem.exit as Record<string, unknown>).transition as Record<string, number>;
    expect(exitT.duration).toBeLessThanOrEqual(animateT.duration);
  });
});

// =========== Modal backdrop ===========

describe("modalBackdrop", () => {
  test("starts transparent", () => {
    const initial = modalBackdrop.initial as Record<string, string>;
    expect(initial.backgroundColor).toBe("rgba(0,0,0,0)");
  });

  test("animates to semi-opaque overlay", () => {
    const animate = modalBackdrop.animate as Record<string, string>;
    expect(animate.backgroundColor).toContain("rgba(0,0,0,");
    expect(animate.backgroundColor).not.toBe("rgba(0,0,0,0)");
  });

  test("exits back to transparent", () => {
    const exit = modalBackdrop.exit as Record<string, unknown>;
    expect(exit.backgroundColor).toBe("rgba(0,0,0,0)");
  });
});

// =========== expandCollapse ===========

describe("expandCollapse", () => {
  test("initial state has height 0 and hidden overflow", () => {
    const initial = expandCollapse.initial as Record<string, unknown>;
    expect(initial.height).toBe(0);
    expect(initial.overflow).toBe("hidden");
  });

  test("animate state has auto height", () => {
    const animate = expandCollapse.animate as Record<string, unknown>;
    expect(animate.height).toBe("auto");
  });
});
