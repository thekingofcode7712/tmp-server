import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from './usePWAInstall';

describe('usePWAInstall', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.deferredPrompt).toBeNull();
    expect(result.current.showInstallPrompt).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('should detect standalone display mode as installed', () => {
    // Mock the matchMedia to return standalone
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
  });

  it('should handle beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.showInstallPrompt).toBe(true);
    expect(result.current.deferredPrompt).toBeDefined();
  });

  it('should handle install click', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.handleInstallClick();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.showInstallPrompt).toBe(false);
  });

  it('should handle dismiss', () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.showInstallPrompt).toBe(true);

    act(() => {
      result.current.handleDismiss();
    });

    expect(result.current.showInstallPrompt).toBe(false);
  });

  it('should handle appinstalled event', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.showInstallPrompt).toBe(false);
  });
});
