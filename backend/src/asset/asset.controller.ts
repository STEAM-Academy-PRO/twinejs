import { Controller, Post, Get, UploadedFile, UseInterceptors, Res, Param, Logger, BadRequestException, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';
import { AuthGuard } from '../auth/auth.guard';

const assetsDir = join(process.cwd(), 'public', 'assets');


@Controller('api/assets')
export class AssetController {
  private readonly logger = new Logger(AssetController.name);

  constructor() {
    // Ensure assets directory exists
    try {
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
        this.logger.log(`Created assets directory at ${assetsDir}`);
      } else {
        this.logger.log(`Using existing assets directory at ${assetsDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create assets directory: ${error.message}`);
      throw new InternalServerErrorException('Failed to initialize assets directory');
    }
  }

  @UseGuards(AuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          console.log(file, assetsDir)
          cb(null, assetsDir);
        },
        filename: (req, file, cb) => {
          const crypto = require('crypto');
          const hash = crypto.createHash('md5').update(file.originalname + Date.now().toString()).digest('hex');
          const safeFilename = file.originalname.replace(/[^a-zA-Z0-9\-_.]/g, '_');
          cb(null, `${hash}---${safeFilename}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes) as ${file.filename}`);

    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/public/assets/${file.filename}`,
    };
  }

  @Get(':filename')
  async downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(assetsDir, filename);

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`File not found: ${filename}`);
      return res.status(404).send('File not found');
    }

    res.sendFile(filePath);
  }

  @UseGuards(AuthGuard)
  @Get()
  async listAssets(): Promise<any[]> {
    try {
      if (!fs.existsSync(assetsDir)) {
        return [];
      }

      const files = fs.readdirSync(assetsDir);
      return files.map(filename => {
        const filePath = join(assetsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          originalname: filename.split('---').length > 1 ? filename.split('---')[1] : filename,
          size: stats.size,
          path: `/api/assets/${filename}`,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
        };
      });
    } catch (error) {
      this.logger.error(`Error listing assets: ${error.message}`);
      throw new InternalServerErrorException('Failed to list assets');
    }
  }
}
