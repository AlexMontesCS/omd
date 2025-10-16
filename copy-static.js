import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const filesToCopy = [
  { src: 'examples', dest: 'dist/examples' },
  { src: 'omd', dest: 'dist/omd' },
  { src: 'jsvg', dest: 'dist/jsvg' },
  { src: 'canvas', dest: 'dist/canvas' },
  { src: 'src', dest: 'dist/src' }
];

// Copy individual files
const individualFiles = [
  'main.js',
  'main-ai.js',
  'favicon.ico'
];

for (const file of individualFiles) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Copied ${file}`);
  }
}

// Copy directories
for (const { src, dest } of filesToCopy) {
  if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  }
}

console.log('Static files copied successfully!');