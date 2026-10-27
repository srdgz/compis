import { parseAmount, shareInCents } from "./split";

describe("shareInCents", () => {
  it("splits the total among the debtors plus the payer", () => {
    expect(shareInCents(45.9, 2)).toBe(1530);
    expect(shareInCents(10, 1)).toBe(500);
  });

  it("rounds down so the payer absorbs the remainder", () => {
    expect(shareInCents(10, 2)).toBe(333);
  });

  it("returns zero for invalid input", () => {
    expect(shareInCents(0, 2)).toBe(0);
    expect(shareInCents(-5, 2)).toBe(0);
    expect(shareInCents(10, 0)).toBe(0);
    expect(shareInCents(Number.NaN, 2)).toBe(0);
  });
});

describe("parseAmount", () => {
  it("accepts commas and dots", () => {
    expect(parseAmount("12,50")).toBe(12.5);
    expect(parseAmount(" 3.2 ")).toBe(3.2);
  });

  it("returns zero for text", () => {
    expect(parseAmount("abc")).toBe(0);
  });
});
