import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked with better options
marked.setOptions({
  highlight: function(code, lang) {
    // Simple syntax highlighting for code blocks
    return `<code class="language-${lang || 'text'}">${escapeHtml(code)}</code>`;
  },
  breaks: true,
  gfm: true
});

// Function to add IDs to headings after markdown conversion
function addHeadingIds(html) {
  return html.replace(/<h([1-6])>(.*?)<\/h([1-6])>/g, (match, level, text, closingLevel) => {
    // Generate id from text by converting to lowercase and replacing spaces/special chars with hyphens
    const id = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
    
    return `<h${level} id="${id}">${text}</h${closingLevel}>`;
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// HTML template for documentation pages
function getHtmlTemplate(title, content, relativePath = '', isDev = false) {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const depth = normalizedPath.split('/').length - 1;
  const rootPath = depth > 0 ? '../'.repeat(depth) : './';
  
  // Adjust paths for development vs production
  let homeLink, docsLink, apiRefLink, examplesLink, readmeLink;
  
  if (isDev) {
    // For development, navigate within docs-built structure
    homeLink = `${rootPath}../index.html`;
    docsLink = `${rootPath}index.html`;
    apiRefLink = `${rootPath}api-reference.html`;
    examplesLink = `${rootPath}../examples/index.html`;
    readmeLink = `${rootPath}../readme.html`;
  } else {
    // For production, use relative paths within docs structure
    homeLink = `${rootPath}../index.html`;
    docsLink = `${rootPath}index.html`;
    apiRefLink = `${rootPath}api-reference.html`;
    examplesLink = `${rootPath}../examples/index.html`;
    readmeLink = `${rootPath}../readme.html`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - OMD Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            border-bottom: 1px solid #eee;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
        }
        .header h1 {
            margin: 0;
            color: #2c3e50;
        }
        .nav {
            margin: 1rem 0;
        }
        .nav a {
            color: #3498db;
            text-decoration: none;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .nav a:hover {
            background-color: #f8f9fa;
            text-decoration: none;
        }
        .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .content h1 {
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5rem;
        }
        .content h2 {
            border-bottom: 1px solid #eee;
            padding-bottom: 0.3rem;
        }
        .content pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 1rem;
            overflow-x: auto;
        }
        .content code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }
        .content pre code {
            background: none;
            padding: 0;
        }
        .content blockquote {
            border-left: 4px solid #3498db;
            margin: 1rem 0;
            padding-left: 1rem;
            color: #666;
        }
        .content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        .content th, .content td {
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }
        .content th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .content ul {
            margin: 1rem 0;
        }
        .content li {
            margin: 0.25rem 0;
        }
        .content a {
            color: #3498db;
            text-decoration: none;
        }
        .content a:hover {
            text-decoration: underline;
        }
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 10px 15px;
            border-radius: 50px;
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .back-to-top:hover {
            opacity: 1;
            text-decoration: none;
            color: white;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .nav {
                flex-direction: column;
            }
            .nav a {
                display: block;
                margin: 0.25rem 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OMD Documentation</h1>
        <div class="nav">
            <a href="${homeLink}">Home</a>
            <a href="${docsLink}">Documentation</a>
            <a href="${apiRefLink}">API Reference</a>
            <a href="${examplesLink}">Examples</a>
            <a href="${readmeLink}">README</a>
        </div>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <a href="#" class="back-to-top">↑ Top</a>
</body>
</html>`;
}

// Function to convert markdown file to HTML
async function convertMarkdownToHtml(inputPath, outputPath, relativePath = '', isDev = false) {
  try {
    const markdown = fs.readFileSync(inputPath, 'utf8');
    
    // Pre-process markdown to convert .md links to .html links
    const processedMarkdown = markdown.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, text, url) => {
      const htmlUrl = url.replace(/\.md$/, '.html');
      return `[${text}](${htmlUrl})`;
    });
    
    const html = marked(processedMarkdown);
    
    // Add IDs to headings
    const htmlWithIds = addHeadingIds(html);
    
    // Extract title from first h1 or use filename
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(inputPath, '.md');
    
    const fullHtml = getHtmlTemplate(title, htmlWithIds, relativePath, isDev);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, fullHtml);
    console.log(`✓ Converted ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error(`✗ Error converting ${inputPath}:`, error.message);
  }
}

// Function to recursively find and convert markdown files
async function convertDocsDirectory(sourceDir, outputDir, baseDir = '', isDev = false) {
  const items = fs.readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      const newOutputDir = path.join(outputDir, item);
      const newBaseDir = baseDir ? path.join(baseDir, item) : item;
      await convertDocsDirectory(sourcePath, newOutputDir, newBaseDir, isDev);
    } else if (item.endsWith('.md')) {
      // Convert markdown file
      const htmlFilename = item.replace('.md', '.html');
      const outputPath = path.join(outputDir, htmlFilename);
      const relativePath = baseDir ? path.join(baseDir, htmlFilename) : htmlFilename;
      
      await convertMarkdownToHtml(sourcePath, outputPath, relativePath, isDev);
    }
  }
}

// Main build function
async function buildDocs() {
  console.log('🔨 Building documentation...');
  
  const docsSourceDir = path.join(__dirname, 'docs');
  const docsOutputDir = path.join(__dirname, 'dist', 'docs');
  const docsDevDir = path.join(__dirname, 'docs-built'); // For development serving
  
  // Create output directories
  if (!fs.existsSync(docsOutputDir)) {
    fs.mkdirSync(docsOutputDir, { recursive: true });
  }
  if (!fs.existsSync(docsDevDir)) {
    fs.mkdirSync(docsDevDir, { recursive: true });
  }
  
  // Convert all markdown files in docs directory for production
  await convertDocsDirectory(docsSourceDir, docsOutputDir, '', false);
  
  // Also build for development (copy to source directory)
  await convertDocsDirectory(docsSourceDir, docsDevDir, '', true);
  
  // Also check for README.md in root and convert it
  const readmePath = path.join(__dirname, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeOutputPath = path.join(__dirname, 'dist', 'readme.html');
    const readmeDevPath = path.join(__dirname, 'readme.html');
    await convertMarkdownToHtml(readmePath, readmeOutputPath, '', false);
    await convertMarkdownToHtml(readmePath, readmeDevPath, '', true);
  }
  
}

// Run the build
buildDocs().catch(console.error);