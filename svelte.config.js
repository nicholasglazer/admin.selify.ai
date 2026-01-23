import adapter from '@sveltejs/adapter-cloudflare';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

export default {
  compilerOptions: {
    runes: true
  },
  kit: {
    prerender: {
      // Only prerender docs - all other routes require authentication
      entries: ['/docs'],
      handleHttpError: ({path, referrer, message}) => {
        // Ignore 404s for docs pages and static assets that may not exist
        if (path.startsWith('/docs/') || path.includes('favicon')) {
          console.warn(`[Prerender] Warning: ${path} - ${message}`);
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
