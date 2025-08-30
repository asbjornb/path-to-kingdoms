function initGame(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }

  app.innerHTML = `
        <div class="container">
            <h1>Path to Kingdoms</h1>
            <p>An incremental game - Coming soon!</p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', initGame);
