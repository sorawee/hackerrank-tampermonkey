import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        author: "Sorawee Porncharoenwase",
        "run-at": "document-start",
        namespace: 'https://www.hackerrank.com/',
        match: [
          'https://www.hackerrank.com/contests/*/leaderboard',
          'https://www.hackerrank.com/contests/*/challenges/*/submissions/code/*'
        ],
        version: "1.0",
      },
    }),
  ],
});
