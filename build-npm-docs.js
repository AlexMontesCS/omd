import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked
marked.setOptions({
  highlight: function(code, lang) {
    return `<code class="language-${lang || 'text'}">${escapeHtml(code)}</code>`;
  },
  breaks: true,
  gfm: true
});

function addHeadingIds(html) {
  return html.replace(/<h([1-6])>(.*?)<\/h([1-6])>/g, (match, level, text, closingLevel) => {
    const id = text
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
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

function getHtmlTemplate(title, content, relativePath = '') {
  const depth = relativePath.split('/').filter(p => p).length;
  const rootPath = depth > 0 ? '../'.repeat(depth) : './';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - OMD Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 280px;
            background: #2c3e50;
            color: white;
            padding: 2rem 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        
        .sidebar h2 {
            padding: 0 1.5rem;
            margin-bottom: 1rem;
            color: #3498db;
            font-size: 1.2rem;
        }
        
        .sidebar-section {
            margin-bottom: 1.5rem;
        }
        
        .sidebar a {
            display: block;
            color: #ecf0f1;
            text-decoration: none;
            padding: 0.5rem 1.5rem;
            transition: background-color 0.2s;
        }
        
        .sidebar a:hover {
            background-color: #34495e;
        }
        
        .sidebar a.active {
            background-color: #3498db;
            color: white;
        }
        
        .main-content {
            margin-left: 280px;
            flex: 1;
            background: white;
            min-height: 100vh;
        }
        
        .header {
            background: white;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .header h1 {
            color: #2c3e50;
            font-size: 1.8rem;
        }
        
        .content {
            padding: 2rem;
            max-width: 900px;
        }
        
        .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        
        .content h1 {
            font-size: 2.5rem;
            border-bottom: 3px solid #3498db;
            padding-bottom: 0.5rem;
            margin-top: 0;
        }
        
        .content h2 {
            font-size: 2rem;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 0.3rem;
        }
        
        .content h3 {
            font-size: 1.5rem;
            color: #34495e;
        }
        
        .content pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-left: 4px solid #3498db;
            border-radius: 4px;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .content code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .content pre code {
            background: none;
            padding: 0;
            border-radius: 0;
        }
        
        .content blockquote {
            border-left: 4px solid #3498db;
            margin: 1.5rem 0;
            padding: 1rem 1.5rem;
            background: #f8f9fa;
            color: #555;
        }
        
        .content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .content th, .content td {
            border: 1px solid #e0e0e0;
            padding: 0.75rem;
            text-align: left;
        }
        
        .content th {
            background: #2c3e50;
            color: white;
            font-weight: 600;
        }
        
        .content tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .content ul, .content ol {
            margin: 1rem 0 1rem 2rem;
        }
        
        .content li {
            margin: 0.5rem 0;
        }
        
        .content a {
            color: #3498db;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-bottom-color 0.2s;
        }
        
        .content a:hover {
            border-bottom-color: #3498db;
        }
        
        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #3498db;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 1.5rem;
            opacity: 0.8;
            transition: opacity 0.2s, transform 0.2s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .back-to-top:hover {
            opacity: 1;
            transform: translateY(-2px);
            color: white;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                position: relative;
                height: auto;
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .content {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="sidebar">
            <div class="sidebar-section">
                <h2>Getting Started</h2>
                <a href="/npm-docs/README.html">Overview</a>
                <a href="/npm-docs/guides/getting-started.html">Installation & Setup</a>
                <a href="/npm-docs/guides/quick-examples.html">Quick Examples</a>
                <a href="/npm-docs/guides/factory-functions.html">Factory Functions</a>
            </div>
            
            <div class="sidebar-section">
                <h2>Guides</h2>
                <a href="/npm-docs/guides/visualizations.html">Visualizations</a>
                <a href="/npm-docs/guides/equations.html">Equations & Expressions</a>
            </div>
            
            <div class="sidebar-section">
                <h2>API Reference</h2>
                <a href="/npm-docs/api/api-reference.html">Full API Docs</a>
                <a href="/npm-docs/api/expression-nodes.html">Expression Nodes</a>
                <a href="/npm-docs/api/omdEquationNode.html">Equation Node</a>
                <a href="/npm-docs/api/omdDisplay.html">Display System</a>
                <a href="/npm-docs/api/omdCanvas.html">Canvas System</a>
            </div>
            
            <div class="sidebar-section">
                <h2>Reference</h2>
                <a href="/npm-docs/json-schemas.html">JSON Schemas</a>
            </div>
        </nav>
        
        <div class="main-content">
            <div class="header">
                <h1>${title}</h1>
            </div>
            
            <div class="content">
                ${content}
            </div>
        </div>
    </div>
    
    <a href="#" class="back-to-top">↑</a>
    
    <script>
        // Highlight active nav item
        const currentPath = window.location.pathname;
        document.querySelectorAll('.sidebar a').forEach(link => {
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
    </script>
</body>
</html>`;
}

async function convertMarkdownToHtml(inputPath, outputPath, relativePath = '') {
  try {
    const markdown = fs.readFileSync(inputPath, 'utf8');
    
    // Convert .md links to .html
    const processedMarkdown = markdown.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, text, url) => {
      const htmlUrl = url.replace(/\.md$/, '.html');
      return `[${text}](${htmlUrl})`;
    });
    
    const html = marked(processedMarkdown);
    const htmlWithIds = addHeadingIds(html);
    
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(inputPath, '.md');
    
    const fullHtml = getHtmlTemplate(title, htmlWithIds, relativePath);
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, fullHtml);
    console.log(`✓ Converted ${path.relative(__dirname, inputPath)} -> ${path.relative(__dirname, outputPath)}`);
  } catch (error) {
    console.error(`✗ Error converting ${inputPath}:`, error.message);
  }
}

async function convertDocsDirectory(sourceDir, outputDir, baseDir = '') {
  const items = fs.readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      const newOutputDir = path.join(outputDir, item);
      const newBaseDir = baseDir ? path.join(baseDir, item) : item;
      await convertDocsDirectory(sourcePath, newOutputDir, newBaseDir);
    } else if (item.endsWith('.md')) {
      const htmlFilename = item.replace('.md', '.html');
      const outputPath = path.join(outputDir, htmlFilename);
      const relativePath = baseDir ? path.join(baseDir, htmlFilename) : htmlFilename;
      
      await convertMarkdownToHtml(sourcePath, outputPath, relativePath);
    }
  }
}

async function buildNpmDocs() {
  console.log('📚 Building NPM documentation site...');
  
  const npmDocsSourceDir = path.join(__dirname, 'npm-docs');
  const outputDir = path.join(__dirname, 'dist', 'npm-docs');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy index.html if it exists
  const indexPath = path.join(npmDocsSourceDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(outputDir, 'index.html'));
    console.log('✓ Copied index.html');
  }
  
  // Convert all markdown files
  await convertDocsDirectory(npmDocsSourceDir, outputDir, '');
  
  console.log('✅ NPM documentation site built successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🌐 Documentation will be available at: https://your-netlify-site.netlify.app/npm-docs/`);
}

buildNpmDocs().catch(console.error);
