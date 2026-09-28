const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

exports.uploadImage = async (buffer, originalName, folder = 'news') => {
    try {
        const compressedBuffer = await sharp(buffer)
            .rotate()
            .resize({
                width: 1280,
                height: 720,
                fit: 'cover',
                position: 'centre',
                withoutEnlargement: true,
            })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

        const filename = `${folder}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
        
        const uploadDir = path.join(process.cwd(), 'uploads', folder);
        await fs.mkdir(uploadDir, { recursive: true });
        
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, compressedBuffer);

        const mediaUrl = process.env.BACKEND_PUBLIC_URL || 'https://api.rednewsbharat.live';
        return {
            url: `${mediaUrl}/uploads/${folder}/${filename}`,
            fileId: filename 
        };
    } catch (err) {
        console.error('Local Upload Error:', err.message);
        throw new Error('Upload Error: ' + err.message);
    }
};
