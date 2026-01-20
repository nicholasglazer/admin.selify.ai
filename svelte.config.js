import adapter from '@sveltejs/adapter-cloudflare';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

export default {
  compilerOptions: {
    runes: true
  },
  kit: {
    prerender: {
      entries: [
        '/docs',
        '/docs/generated/database/public-schema',
        '/docs/generated/api/routes'
      ],
      handleHttpError: ({path, referrer, message}) => {
        // Ignore 404s for docs pages that may not exist yet
        if (path.startsWith('/docs/')) {
          console.warn(`Warning: ${path} - ${message}`);
          return;
        }
        throw new Error(message);
      }
    },
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<build>', '<prerendered>']
      },
      platformProxy: {
        configPath: 'wrangler.toml',
        environment: undefined,
        experimentalJsonConfig: false,
        persist: false
      }
    }),
    alias: {
      $components: 'src/lib/components',
      $features: 'src/lib/features',
      $lib: 'src/lib',
      $theme: 'src/lib/styles/theme.css'
    }
  },
  preprocess: [vitePreprocess()]
};
