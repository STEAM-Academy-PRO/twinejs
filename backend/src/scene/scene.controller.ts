import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, Logger, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { AuthGuard } from '../auth/auth.guard';

const scenesDir = join(process.cwd(), 'public', 'scenes');

@Controller('api/scenes')
export class SceneController {
  private readonly logger = new Logger(SceneController.name);

  constructor() {
    try {
      if (!fs.existsSync(scenesDir)) {
        fs.mkdirSync(scenesDir, { recursive: true });
        this.logger.log(`Created scenes directory at ${scenesDir}`);
      } else {
        this.logger.log(`Using existing scenes directory at ${scenesDir}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to create scenes directory: ${error.message}`);
      throw new InternalServerErrorException('Failed to initialize scenes directory');
    }
  }

  // Upsert: accepts multipart/form-data with field name 'file' (SVG), and optional 'id' to overwrite.
  @UseGuards(AuthGuard)
  @Post('upsert')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, scenesDir);
        },
        // filename decided in handler to account for optional id; here we set a temp name
        filename: (req, file, cb) => {
          const tmp = `${uuidv4()}.uploading`;
          cb(null, tmp);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB should be plenty for SVG
      fileFilter: (req, file, cb) => {
        // accept common SVG mimetypes
        const ok = file.mimetype === 'image/svg+xml' || /svg/.test(file.mimetype) || file.originalname.endsWith('.svg');
        if (ok) cb(null, true);
        else cb(new Error('Invalid file type, expected SVG'), false);
      },
    })
  )
  async upsert(
    @UploadedFile() file: Express.Multer.File,
    @Query('id') queryId?: string,
    @Body('id') bodyId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    // read optional id from either query or body field (multer parses text fields)
    const requestedId = bodyId ?? queryId;
    const id = requestedId && uuidValidate(requestedId) ? requestedId : uuidv4();
    const finalPath = join(scenesDir, `${id}.svg`);

    try {
      // Move/rename uploaded temp file to final UUID.svg
      // Some storage engines write directly to the destination with tmp name; ensure we move it
      fs.renameSync(file.path, finalPath);
    } catch (err: any) {
      this.logger.error(`Failed to store scene ${id}: ${err.message}`);
      // Cleanup tmp file if exists
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (cleanupErr: any) {
        this.logger.warn(`Failed to cleanup temp upload for scene ${id}: ${cleanupErr?.message ?? cleanupErr}`);
      }
      throw new InternalServerErrorException('Failed to store scene');
    }

    this.logger.log(`Scene upserted: ${id} (${file.size} bytes)`);
    return { id, path: `/api/scenes/${id}`, size: file.size };
  }

  // Get: stream the SVG by id
  @Get(':id')
  async get(@Param('id') id: string, @Res() res: Response) {
    if (!uuidValidate(id)) {
      return res.status(400).send('Invalid id');
    }
    const filePath = join(scenesDir, `${id}.svg`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Scene not found');
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(filePath);
  }

  // List: optionally filter by comma-separated ids query param
  @UseGuards(AuthGuard)
  @Get()
  async list(@Query('ids') ids?: string) {
    try {
      if (!fs.existsSync(scenesDir)) return [];
      const allFiles = fs.readdirSync(scenesDir).filter(f => f.endsWith('.svg'));
      let idsSet: Set<string> | null = null;
      if (ids) {
        const parsed = ids.split(',').map(s => s.trim()).filter(uuidValidate);
        idsSet = new Set(parsed);
      }
      const items = allFiles.map(fn => fn.replace(/\.svg$/, ''));
      const filtered = idsSet ? items.filter(id => idsSet!.has(id)) : items;
      return filtered.map(id => ({ id, path: `/api/scenes/${id}` }));
    } catch (error: any) {
      this.logger.error(`Error listing scenes: ${error.message}`);
      throw new InternalServerErrorException('Failed to list scenes');
    }
  }

  // Delete: remove a scene by id
  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    if (!uuidValidate(id)) throw new BadRequestException('Invalid id');
    const filePath = join(scenesDir, `${id}.svg`);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Scene not found');
    }
    try {
      fs.unlinkSync(filePath);
      this.logger.log(`Scene deleted: ${id}`);
      return { id, deleted: true };
    } catch (error: any) {
      this.logger.error(`Error deleting scene ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete scene');
    }
  }
}
