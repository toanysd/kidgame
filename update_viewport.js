const fs = require('fs');

const files = [
    'd:/AntiGravity_Workspace/apps/kidgame/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/FruitNinja/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/AppHub/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/MagicRoom/index.html'
];

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('viewport-fit=cover')) {
        c = c.replace(/content="width=device-width,\s*initial-scale=1\.0[^"]*"/g, 'content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no"');
        fs.writeFileSync(f, c);
        console.log('Viewport updated in: ' + f);
    }
});
