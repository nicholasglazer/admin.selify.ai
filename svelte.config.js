import adapter from '@sveltejs/adapter-cloudflare';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

export default {
  compilerOptions: {
    runes: true
  },
  kit: {
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
