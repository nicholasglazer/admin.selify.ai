import {readFile} from 'fs/promises';
import {join} from 'path';
import {marked} from 'marked';

const DOCS_PATH = '/home/ng/prod/docs';

export async function load() {
  try {
    const filePath = join(DOCS_PATH, 'generated/database/public-schema.md');
    const content = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    const {frontmatter, body} = parseFrontmatter(content);

    // Convert markdown to HTML
    const html = await marked(body);

    return {
      title: frontmatter.title || 'Database Schema',
      description: frontmatter.description || '',
      generatedAt: frontmatter.generated_at || null,
      generator: frontmatter.generator || null,
      category: frontmatter.category || 'database',
      tags: frontmatter.tags || [],
      html,
    };
  } catch (err) {
    // Doc not yet generated
    return {
      title: 'Database Schema',
      description: 'Schema documentation not yet generated.',
      html: '<p>Run the DocumentationWorkflow to generate schema documentation.</p>',
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

  // Simple YAML parsing for frontmatter
  const frontmatter = {};
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();

      // Handle arrays [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim());
      }

      frontmatter[key] = value;
    }
  }

  return {frontmatter, body};
}
