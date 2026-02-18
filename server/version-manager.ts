/**
 * Version Manager
 * Manages application versioning and auto-update checks
 */

import fs from 'fs';
import path from 'path';

export interface AppVersion {
  version: string;
  buildTime: number;
  hash: string;
  features: string[];
  breakingChanges: boolean;
  minClientVersion?: string;
}

class VersionManager {
  private currentVersion: AppVersion;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.currentVersion = this.loadVersion();
    this.startAutoUpdate();
  }

  /**
   * Load version from environment or create new one
   */
  private loadVersion(): AppVersion {
    try {
      const versionEnv = process.env.APP_VERSION;
      if (versionEnv) {
        return JSON.parse(versionEnv);
      }
    } catch (error) {
      console.error('[VersionManager] Failed to load version from env:', error);
    }

    // Create default version
    return this.createNewVersion();
  }

  /**
   * Create a new version
   */
  private createNewVersion(): AppVersion {
    const version: AppVersion = {
      version: `1.0.0-${Date.now()}`,
      buildTime: Date.now(),
      hash: this.generateHash(),
      features: [
        'Cloud Storage with R2',
        'Custom UI Themes',
        'Email Storage',
        'Analytics Dashboard',
        'PWA Support',
      ],
      breakingChanges: false,
    };

    this.saveVersion(version);
    return version;
  }

  /**
   * Generate a hash for the current build
   */
  private generateHash(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`.substring(0, 16);
  }

  /**
   * Save version to environment variable
   */
  private saveVersion(version: AppVersion): void {
    try {
      process.env.APP_VERSION = JSON.stringify(version);
      console.log('[VersionManager] Version saved to environment');
    } catch (error) {
      console.error('[VersionManager] Failed to save version:', error);
    }
  }

  /**
   * Get current version
   */
  getCurrentVersion(): AppVersion {
    return this.currentVersion;
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(clientVersion: string): boolean {
    return clientVersion !== this.currentVersion.hash;
  }

  /**
   * Get update info for client
   */
  getUpdateInfo(clientVersion: string): { updateAvailable: boolean; version: AppVersion } {
    return {
      updateAvailable: this.isUpdateAvailable(clientVersion),
      version: this.currentVersion,
    };
  }

  /**
   * Increment version (called on deployment)
   */
  incrementVersion(features: string[] = []): AppVersion {
    const parts = this.currentVersion.version.split('-');
    const [major, minor, patch] = parts[0].split('.').map(Number);

    const newVersion: AppVersion = {
      version: `${major}.${minor}.${patch + 1}-${Date.now()}`,
      buildTime: Date.now(),
      hash: this.generateHash(),
      features: features.length > 0 ? features : this.currentVersion.features,
      breakingChanges: false,
    };

    this.currentVersion = newVersion;
    this.saveVersion(newVersion);

    console.log('[VersionManager] Version incremented to:', newVersion.version);
    return newVersion;
  }

  /**
   * Start auto-update check (every 5 minutes)
   */
  private startAutoUpdate(): void {
    this.updateCheckInterval = setInterval(() => {
      // Check if version file has been updated by another process
      const fileVersion = this.loadVersion();
      if (fileVersion.hash !== this.currentVersion.hash) {
        console.log('[VersionManager] New version detected:', fileVersion.version);
        this.currentVersion = fileVersion;
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop auto-update check
   */
  stopAutoUpdate(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Get version history (mock - in production, store in database)
   */
  getVersionHistory(): AppVersion[] {
    return [this.currentVersion];
  }

  /**
   * Rollback to previous version (mock)
   */
  rollbackVersion(): AppVersion {
    console.log('[VersionManager] Rollback requested');
    return this.currentVersion;
  }
}

// Export singleton instance
export const versionManager = new VersionManager();
