const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath);
        } else if (f === 'page.js') {
            let content = fs.readFileSync(dirPath, 'utf8');
            // Remove min-h-screen which conflicts with layout.js flex-grow root structure
            let newContent = content.replace(/className="min-h-screen /g, 'className="');
            newContent = newContent.replace(/className="min-h-screen"/g, 'className=""');
            if(content !== newContent) {
               fs.writeFileSync(dirPath, newContent);
               console.log("Updated", dirPath);
            }
        }
    });
}
walkDir('./app');
