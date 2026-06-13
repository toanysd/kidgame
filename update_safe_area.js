const fs = require('fs');

const filesToUpdate = [
    'd:/AntiGravity_Workspace/apps/kidgame/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/FruitNinja/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/AppHub/index.html',
    'd:/AntiGravity_Workspace/apps/kidgame/MagicRoom/index.html'
];

filesToUpdate.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // Add safe area to typical top/bottom values
    // Top buttons
    c = c.replace(/top:\s*([0-9]+)px;/g, (match, p1) => {
        if(parseInt(p1) > 0 && parseInt(p1) < 100) {
            return `top: calc(env(safe-area-inset-top) + ${p1}px);`;
        }
        return match;
    });

    // Bottom buttons
    c = c.replace(/bottom:\s*([0-9]+)px;/g, (match, p1) => {
        if(parseInt(p1) > 0 && parseInt(p1) < 100) {
            return `bottom: calc(env(safe-area-inset-bottom) + ${p1}px);`;
        }
        return match;
    });

    fs.writeFileSync(f, c);
    console.log('Safe area injected in: ' + f);
});
