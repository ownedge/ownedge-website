import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Define your application routes (matching App.vue)
const routes = [
    'business',
    'about',
    'guestbook',
    'chat'
];

if (!fs.existsSync(indexPath)) {
    console.error('Error: dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');

routes.forEach(route => {
    const routeDir = path.join(distPath, route);
    
    // Create directory (e.g., dist/why/)
    if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
    }
    
    // Write index.html to the directory
    // This allows Nginx to find /why/index.html when /why is requested
    const targetPath = path.join(routeDir, 'index.html');
    fs.writeFileSync(targetPath, indexContent);
    
    console.log(`Generated static route: /${route}/index.html`);
});

console.log('Static route generation complete! 🦾');
