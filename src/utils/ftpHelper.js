const fs = require('fs/promises');
const path = require('path');

exports.deleteFtpFile = async (fileUrl) => {
    if (!fileUrl || !fileUrl.includes('/uploads/')) return;
    
    try {
        const urlParts = new URL(fileUrl).pathname.split('/uploads/');
        if (urlParts.length < 2) return;
        
        const relativePath = urlParts[1];
        const absolutePath = path.join(process.cwd(), 'uploads', relativePath);
        
        await fs.unlink(absolutePath);
        console.log(`Deleted local file: ${absolutePath}`);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`Failed to delete local file ${fileUrl}:`, err.message);
        }
    }
};
