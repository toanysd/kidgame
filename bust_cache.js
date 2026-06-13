const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('.git') && !file.includes('node_modules')) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/AntiGravity_Workspace/apps/kidgame');
const v = Date.now();

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace existing ?v=xxxx or add ?v=xxxx to local JS/CSS refs
    content = content.replace(/(src|href)="([^"]+\.(js|css))(\?v=[^"]*)?"/g, (match, attr, filePath, ext, existingV) => {
        // Skip external CDN URLs
        if (filePath.startsWith('http') || filePath.startsWith('//')) return match;
        return `${attr}="${filePath}?v=${v}"`;
    });
    
    fs.writeFileSync(f, content);
    console.log('Cache-busted: ' + path.basename(f));
});

console.log(`\nDone! Version tag: ?v=${v}`);
