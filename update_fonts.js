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
            if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/AntiGravity_Workspace/apps/kidgame');
const newFontLink = '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800&display=swap" rel="stylesheet">';

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let modified = false;

    // Replace Google Fonts link
    if (content.includes('fonts.googleapis.com')) {
        content = content.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/g, newFontLink);
        modified = true;
    }

    // Replace font-family CSS and JS
    if (content.includes('Be Vietnam Pro') || content.includes('Fredoka')) {
        content = content.replace(/'Be Vietnam Pro', sans-serif/g, "'Be Vietnam Pro', sans-serif");
        content = content.replace(/'Be Vietnam Pro'/g, "'Be Vietnam Pro'");
        content = content.replace(/"Be Vietnam Pro"/g, '"Be Vietnam Pro"');
        content = content.replace(/Be Vietnam Pro/g, 'Be Vietnam Pro');
        content = content.replace(/'Be Vietnam Pro'/g, "'Be Vietnam Pro'");
        content = content.replace(/"Be Vietnam Pro"/g, '"Be Vietnam Pro"');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(f, content);
        console.log('Updated fonts in: ' + f);
    }
});
