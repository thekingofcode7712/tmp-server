import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Ad Blocker & VPN Features", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Use test user ID 1 (should exist from previous tests)
    testUserId = 1;
  });

  describe("Ad Blocker", () => {
    it("should create default ad blocker settings", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const settings = await caller.adBlocker.getSettings();
      expect(settings).toBeDefined();
      expect(settings?.userId).toBe(testUserId);
      expect(settings?.blockAds).toBe(true);
      expect(settings?.blockTrackers).toBe(true);
      expect(settings?.blockMalware).toBe(true);
    });

    it("should update ad blocker settings", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.adBlocker.updateSettings({
        enabled: true,
        blockAds: false,
      });

      expect(result.success).toBe(true);

      const settings = await caller.adBlocker.getSettings();
      expect(settings?.enabled).toBe(true);
      expect(settings?.blockAds).toBe(false);
    });

    it("should increment blocked count", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const beforeSettings = await caller.adBlocker.getSettings();
      const beforeCount = beforeSettings?.totalBlocked || 0;

      await caller.adBlocker.incrementBlocked({ count: 5 });

      const afterSettings = await caller.adBlocker.getSettings();
      expect(afterSettings?.totalBlocked).toBe(beforeCount + 5);
    });
  });

  describe("VPN", () => {
    it("should create default VPN settings", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const settings = await caller.vpn.getSettings();
      expect(settings).toBeDefined();
      expect(settings?.userId).toBe(testUserId);
      expect(settings?.selectedServer).toBe("us-east");
      expect(settings?.protocol).toBe("proxy");
    });

    it("should update VPN settings", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.vpn.updateSettings({
        enabled: true,
        selectedServer: "uk",
        protocol: "wireguard",
      });

      expect(result.success).toBe(true);

      const settings = await caller.vpn.getSettings();
      expect(settings?.enabled).toBe(true);
      expect(settings?.selectedServer).toBe("uk");
      expect(settings?.protocol).toBe("wireguard");
    });

    it("should create VPN connection", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.vpn.connect({
        server: "us-east",
        protocol: "proxy",
      });

      expect(result.success).toBe(true);

      const connections = await caller.vpn.getConnections();
      expect(connections.length).toBeGreaterThan(0);
      expect(connections[0].server).toBe("us-east");
    });

    it("should generate WireGuard config", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.vpn.generateConfig({
        protocol: "wireguard",
        server: "us-east",
      });

      expect(result.protocol).toBe("wireguard");
      expect(result.config).toContain("[Interface]");
      expect(result.config).toContain("[Peer]");
      expect(result.config).toContain("us-east");
    });

    it("should generate OpenVPN config", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test", role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.vpn.generateConfig({
        protocol: "openvpn",
        server: "uk",
      });

      expect(result.protocol).toBe("openvpn");
      expect(result.config).toContain("client");
      expect(result.config).toContain("remote uk");
    });
  });
});
