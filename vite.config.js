import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

function copyPageTemplates() {
  return {
    name: 'copy-page-templates',
    closeBundle() {
      const source = resolve('pages');
      const target = resolve('web-dist/pages');
      if (existsSync(source)) {
        if (existsSync(target)) {
          rmSync(target, { recursive: true, force: true });
        }
        cpSync(source, target, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyPageTemplates()],
  build: {
    outDir: 'web-dist',
    emptyOutDir: true
  }
});
