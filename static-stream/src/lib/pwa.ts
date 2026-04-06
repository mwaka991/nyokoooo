/**
 * PWA Installation Helper
 * Provides utilities for managing PWA install prompts and events
 */

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Register PWA install prompt listener
 * @param onPrompt - Callback when install prompt is available
 */
export function setupInstallPrompt(
  onPrompt: (event: InstallPromptEvent) => void
): () => void {
  const handleBeforeInstallPrompt = (event: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    // Stash the event for later use
    onPrompt(event as InstallPromptEvent);
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  };
}

/**
 * Check if the app is installed as PWA
 */
export function isInstalledAsPWA(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  return false;
}

/**
 * Check if app is running in PWA context
 */
export function isPWAContext(): boolean {
  return isInstalledAsPWA() || isRunningInPWAFrame();
}

/**
 * Check if running in a PWA frame/container
 */
export function isRunningInPWAFrame(): boolean {
  return document.referrer.includes("android-app://") ||
         (window.navigator as any).standalone === true;
}

/**
 * Log PWA status for debugging
 */
export function logPWAStatus(): void {
  console.log("=== PWA Status ===");
  console.log(
    "Installed as PWA:",
    isInstalledAsPWA()
  );
  console.log(
    "PWA Context:",
    isPWAContext()
  );
  console.log(
    "Service Worker Support:",
    "serviceWorker" in navigator
  );
  console.log(
    "Standalone Mode:",
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Listen for app installed event
 */
export function setupAppInstalledListener(
  onInstalled: () => void
): () => void {
  const handleAppInstalled = () => {
    console.log("App installed as PWA");
    onInstalled();
  };

  window.addEventListener("appinstalled", handleAppInstalled);

  return () => {
    window.removeEventListener("appinstalled", handleAppInstalled);
  };
}
