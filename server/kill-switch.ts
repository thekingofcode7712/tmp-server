import { getDb } from "./db";
import { vpnConnections, vpnSettings } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Kill Switch Service
 * Monitors VPN connections and blocks traffic when connection drops if kill switch is enabled
 */

interface KillSwitchState {
  userId: number;
  isBlocked: boolean;
  lastConnectionId: number | null;
  blockedAt: Date | null;
}

// In-memory state for kill switch (in production, use Redis or similar)
const killSwitchStates = new Map<number, KillSwitchState>();

/**
 * Check if kill switch is enabled for a user
 */
export async function isKillSwitchEnabled(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const settings = await db
    .select()
    .from(vpnSettings)
    .where(eq(vpnSettings.userId, userId))
    .limit(1);
  
  return settings[0]?.killSwitch || false;
}

/**
 * Get active VPN connection for a user
 */
export async function getActiveConnection(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const connections = await db
    .select()
    .from(vpnConnections)
    .where(
      and(
        eq(vpnConnections.userId, userId),
        isNull(vpnConnections.disconnectedAt)
      )
    )
    .limit(1);
  
  return connections[0] || null;
}

/**
 * Activate kill switch for a user (block all traffic)
 */
export async function activateKillSwitch(userId: number, connectionId: number): Promise<void> {
  const enabled = await isKillSwitchEnabled(userId);
  
  if (!enabled) {
    return;
  }

  killSwitchStates.set(userId, {
    userId,
    isBlocked: true,
    lastConnectionId: connectionId,
    blockedAt: new Date(),
  });

  console.log(`[Kill Switch] Activated for user ${userId} - All traffic blocked`);
}

/**
 * Deactivate kill switch for a user (restore traffic)
 */
export async function deactivateKillSwitch(userId: number): Promise<void> {
  const state = killSwitchStates.get(userId);
  
  if (state) {
    killSwitchStates.set(userId, {
      ...state,
      isBlocked: false,
      blockedAt: null,
    });
    console.log(`[Kill Switch] Deactivated for user ${userId} - Traffic restored`);
  }
}

/**
 * Check if traffic is blocked for a user
 */
export function isTrafficBlocked(userId: number): boolean {
  const state = killSwitchStates.get(userId);
  return state?.isBlocked || false;
}

/**
 * Get kill switch state for a user
 */
export function getKillSwitchState(userId: number): KillSwitchState | null {
  return killSwitchStates.get(userId) || null;
}

/**
 * Monitor VPN connections and activate kill switch on disconnect
 * This should be called periodically (e.g., every 5 seconds)
 */
export async function monitorConnections(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    // Get all users with kill switch enabled
    const settingsWithKillSwitch = await db
      .select()
      .from(vpnSettings)
      .where(eq(vpnSettings.killSwitch, true));

    for (const settings of settingsWithKillSwitch) {
      const activeConnection = await getActiveConnection(settings.userId);
      const currentState = killSwitchStates.get(settings.userId);

      // If user had a connection but now doesn't, activate kill switch
      if (currentState?.lastConnectionId && !activeConnection) {
        await activateKillSwitch(settings.userId, currentState.lastConnectionId);
      }
      // If user has an active connection, deactivate kill switch
      else if (activeConnection) {
        await deactivateKillSwitch(settings.userId);
        killSwitchStates.set(settings.userId, {
          userId: settings.userId,
          isBlocked: false,
          lastConnectionId: activeConnection.id,
          blockedAt: null,
        });
      }
    }
  } catch (error) {
    console.error('[Kill Switch] Error monitoring connections:', error);
  }
}

/**
 * Middleware to block traffic if kill switch is active
 */
export function checkKillSwitch(userId: number): { blocked: boolean; message?: string } {
  const state = killSwitchStates.get(userId);
  
  if (state?.isBlocked) {
    return {
      blocked: true,
      message: `Kill switch is active. VPN connection dropped at ${state.blockedAt?.toISOString()}. Reconnect to restore internet access.`,
    };
  }
  
  return { blocked: false };
}
