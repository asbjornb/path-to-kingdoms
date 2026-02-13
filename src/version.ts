const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function showUpdateBanner(): void {
  if (document.getElementById('version-update-banner') !== null) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'version-update-banner';
  banner.className = 'version-update-banner';
  banner.innerHTML = `
    <span>A new version is available.</span>
    <button onclick="window.saveGame(); location.reload()">Refresh</button>
  `;
  document.body.prepend(banner);
}

async function checkForUpdate(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { version: string };
    if (data.version !== __APP_VERSION__) {
      showUpdateBanner();
    }
  } catch {
    // Network error — silently ignore
  }
}

export function startVersionChecker(): void {
  // Don't check in dev mode — version.json won't exist
  if (import.meta.env.DEV) {
    return;
  }

  // Initial check after a short delay so it doesn't block startup
  setTimeout(() => {
    void checkForUpdate();
  }, 10_000);

  setInterval(() => {
    void checkForUpdate();
  }, CHECK_INTERVAL_MS);
}

export function getAppVersion(): string {
  return __APP_VERSION__;
}
