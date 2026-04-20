import { describe, expect, it } from "vitest";
import {
  assertOrderStatusTransition,
  assertSubmissionStatusTransition,
} from "./order-workflow.js";

describe("order workflow transitions", () => {
  it("allows valid submission transitions", () => {
    expect(() =>
      assertSubmissionStatusTransition("pending", "approved"),
    ).not.toThrow();
    expect(() =>
      assertSubmissionStatusTransition("pending", "rejected"),
    ).not.toThrow();
  });

  it("rejects invalid submission transitions", () => {
    expect(() =>
      assertSubmissionStatusTransition("approved", "rejected"),
    ).toThrow(/not allowed/i);
  });

  it("allows valid order transitions", () => {
    expect(() =>
      assertOrderStatusTransition("pending", "approved"),
    ).not.toThrow();
    expect(() =>
      assertOrderStatusTransition("approved", "delivered"),
    ).not.toThrow();
  });

  it("rejects invalid order transitions", () => {
    expect(() => assertOrderStatusTransition("pending", "delivered")).toThrow(
      /not allowed/i,
    );
  });
});
