import {marked} from 'marked';
import yaml from 'js-yaml';
import {env} from '$env/dynamic/private';

// API URL for fetching docs
const API_BASE_URL = env.API_BASE_URL || 'https://api.selify.ai';

// Custom renderer to generate heading IDs for anchor links
// Must match format used by routes_generator.py: remove slashes and dots
const renderer = {
  heading({tokens, depth}) {
    const text = tokens.map(t => t.raw || t.text || '').join('');
    // Generate ID matching routes_generator format: remove / and . entirely
    const id = text.toLowerCase().replace(/[\/\.]/g, '').replace(/[^\w]+/g, '');
    return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  }
};

// Configure marked with heading IDs
marked.use({
  gfm: true,
  breaks: false,
  renderer
});

export async function load({fetch}) {
  try {
    // Fetch from API
    const response = await fetch(`${API_BASE_URL}/api/docs/generated/api/routes`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.exists) {
      return {
        title: 'API Routes',
        description: 'Routes documentation not yet generated.',
        html: '<p>Run the DocumentationWorkflow to generate routes documentation.</p>',
        notGenerated: true,
      };
    }

    // Parse frontmatter from content
    const {frontmatter, body} = parseFrontmatter(data.content);

    // Convert markdown to HTML
    const html = await marked(body);

    return {
      title: frontmatter.title || 'API Routes',
      description: frontmatter.description || '',
      generatedAt: frontmatter.generated_at || null,
      generator: frontmatter.generator || null,
      category: frontmatter.category || 'api',
      tags: frontmatter.tags || [],
      html,
    };
  } catch (err) {
    console.error('Failed to load routes docs:', err.message);
    // Doc not yet generated
    return {
      title: 'API Routes',
      description: 'Routes documentation not yet generated.',
      html: '<p>Run the DocumentationWorkflow to generate routes documentation.</p>',
      notGenerated: true,
    };
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return {frontmatter: {}, body: content};
  }

  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) {
    return {frontmatter: {}, body: content};
  }

  const frontmatterStr = content.slice(4, endIdx);
  const body = content.slice(endIdx + 4).trim();

  // Use proper YAML parser for frontmatter
  let frontmatter = {};
  try {
    frontmatter = yaml.load(frontmatterStr) || {};
  } catch (err) {
    console.error('Failed to parse frontmatter YAML:', err.message);
  }

  return {frontmatter, body};
}
