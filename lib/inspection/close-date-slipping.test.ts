import { describe, expect, it } from "vitest";
import { makeOpportunity, makeActivity } from "@/lib/domain/fixtures";
import { checkCloseDateSlipping } from "./close-date-slipping";

function pushes(n: number) {
  return Array.from({ length: n }, (_, i) =>
    makeActivity({ type: "close-date-change", contactName: null, note: `Push ${i + 1}.` }),
  );
}

describe("checkCloseDateSlipping", () => {
  it("does not fire with zero or one push", () => {
    expect(checkCloseDateSlipping(makeOpportunity({ activityLog: [makeActivity()] }))).toBeNull();
    expect(checkCloseDateSlipping(makeOpportunity({ activityLog: pushes(1) }))).toBeNull();
  });

  it("fires medium severity at exactly two pushes", () => {
    const flag = checkCloseDateSlipping(makeOpportunity({ activityLog: pushes(2) }));
    expect(flag?.severity).toBe("medium");
  });

  it("fires high severity at three or more pushes", () => {
    const flag = checkCloseDateSlipping(makeOpportunity({ activityLog: pushes(3) }));
    expect(flag?.severity).toBe("high");
  });

  it("collects every close-date-change entry as evidence", () => {
    const flag = checkCloseDateSlipping(makeOpportunity({ activityLog: pushes(2) }))!;
    expect(flag.evidence).toEqual([
      { activityIndex: 0, note: "Push 1." },
      { activityIndex: 1, note: "Push 2." },
    ]);
  });
});
