import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

// Pages are .svx (Markdown with components). `layout: runbook` in frontmatter picks the shared frame.
const runbook = new URL('./src/lib/layouts/runbook.svelte', import.meta.url).pathname;

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    adapter: adapter(),
    alias: { '#lib': 'src/lib' },
    inlineStyleThreshold: Infinity,
    prerender: { entries: ['/kb'] },
  },
};
