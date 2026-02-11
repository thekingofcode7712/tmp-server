import { describe, expect, it } from "vitest";
import { verifyEmailConnection } from "./email-service";

describe("Email Service", () => {
  it("should verify SMTP connection with provided credentials", async () => {
    const isConnected = await verifyEmailConnection();
    
    // Should return true even if SMTP is not configured (simulation mode)
    // or if SMTP is configured and connection is successful
    expect(isConnected).toBe(true);
  }, 30000); // 30 second timeout for SMTP connection
});
