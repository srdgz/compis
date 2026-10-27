import { isValidPaypalUsername, paypalMeUrl } from "./paypal";

describe("paypalMeUrl", () => {
  it("builds a PayPal.Me link with the amount in euros", () => {
    expect(paypalMeUrl("lucia", 12.5)).toBe("https://www.paypal.me/lucia/12.50EUR");
  });

  it("rounds to cents and escapes the username", () => {
    expect(paypalMeUrl("a b", 3)).toBe("https://www.paypal.me/a%20b/3.00EUR");
  });
});

describe("isValidPaypalUsername", () => {
  it("accepts three to twenty letters or digits", () => {
    expect(isValidPaypalUsername("lucia99")).toBe(true);
    expect(isValidPaypalUsername("ab")).toBe(false);
    expect(isValidPaypalUsername("lucia garcia")).toBe(false);
  });
});
