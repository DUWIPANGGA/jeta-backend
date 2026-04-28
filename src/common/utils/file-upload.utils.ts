import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

export const storage = (destination: string) => {
    const uploadPath = `./uploads/${destination}`;

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
            const uniqueSuffix = randomUUID();
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
    });
};
export const fileFilter = (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};
