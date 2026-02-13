import { defineConfig, Plugin } from 'vite';
import { execSync } from 'child_process';

function getCommitCount(): string {
  try {
    return execSync('git rev-list --count HEAD').toString().trim();
  } catch {
    return '0';
  }
}

function versionPlugin(): Plugin {
  const version = getCommitCount();

  return {
    name: 'version-plugin',
    config() {
      return {
        define: {
          __APP_VERSION__: JSON.stringify(version),
        },
      };
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }),
      });
    },
  };
}

export default defineConfig({
  base: '/path-to-kingdoms/',
  plugins: [versionPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
  },
});
