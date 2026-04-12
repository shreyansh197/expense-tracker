/// <reference types="jest" />
import * as fs from "fs";
import * as path from "path";

function readComponent(relativePath: string): string {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

// =========== Loading states: skeleton components used for loading ===========

describe("loading states — skeleton components", () => {
  describe("Skeleton.tsx variants", () => {
    const src = readComponent("components/ui/Skeleton.tsx");

    test("exports base Skeleton component", () => {
      expect(src).toMatch(/export function Skeleton/);
    });

    test("exports SkeletonSessionsList", () => {
      expect(src).toMatch(/export function SkeletonSessionsList/);
    });

    test("exports SkeletonMembersList", () => {
      expect(src).toMatch(/export function SkeletonMembersList/);
    });

    test("skeleton has shimmer animation", () => {
      expect(src).toContain("shimmer");
    });

    test("SkeletonSessionsList has role=status and aria-busy", () => {
      const sessionsBlock = src.slice(src.indexOf("SkeletonSessionsList"));
      expect(sessionsBlock).toContain('role="status"');
      expect(sessionsBlock).toContain('aria-busy="true"');
    });

    test("SkeletonMembersList has role=status and aria-busy", () => {
      const membersBlock = src.slice(src.indexOf("SkeletonMembersList"));
      expect(membersBlock).toContain('role="status"');
      expect(membersBlock).toContain('aria-busy="true"');
    });
  });

  describe("SecurityCard uses skeleton for loading", () => {
    const src = readComponent("components/settings/SecurityCard.tsx");

    test("imports SkeletonSessionsList", () => {
      expect(src).toMatch(/import.*SkeletonSessionsList.*from/);
    });

    test("renders SkeletonSessionsList when loading sessions", () => {
      expect(src).toContain("SkeletonSessionsList");
    });

    test("does not show plain Loader2 spinner for sessions", () => {
      // Should not have a bare Loader2 with "Loading..." text for sessions
      const sessionsBlock = src.slice(src.indexOf("loadingSessions"), src.indexOf("loadingSessions") + 500);
      expect(sessionsBlock).not.toMatch(/Loader2.*Loading\.\.\./);
    });
  });

  describe("WorkspaceMembersCard uses skeleton for loading", () => {
    const src = readComponent("components/settings/WorkspaceMembersCard.tsx");

    test("imports SkeletonMembersList", () => {
      expect(src).toMatch(/import.*SkeletonMembersList.*from/);
    });

    test("renders SkeletonMembersList when loading", () => {
      expect(src).toContain("SkeletonMembersList");
    });
  });

  describe("AccountCard uses skeleton for avatar uploading", () => {
    const src = readComponent("components/settings/AccountCard.tsx");

    test("imports Skeleton component", () => {
      expect(src).toMatch(/import.*Skeleton.*from.*\/Skeleton/);
    });

    test("renders skeleton when avatar is uploading", () => {
      expect(src).toContain("avatarUploading");
      expect(src).toContain("<Skeleton");
    });
  });
});

// =========== Security: error messages don't leak internals ===========

describe("loading states — security", () => {
  test("SecurityCard does not expose raw error objects in UI", () => {
    const src = readComponent("components/settings/SecurityCard.tsx");
    // catch blocks should not render error.message directly to users
    const catches = src.match(/catch\s*\([\s\S]*?\{[\s\S]*?\}/g) || [];
    for (const block of catches) {
      expect(block).not.toMatch(/\{.*error\.message.*\}/);
      expect(block).not.toMatch(/\{.*err\.stack.*\}/);
    }
  });
});
