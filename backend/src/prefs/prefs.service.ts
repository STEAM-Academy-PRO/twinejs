import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PrefsService {
  private readonly prefsDir = path.join(process.cwd(), 'persistence');
  private readonly prefsFile = path.join(this.prefsDir, 'prefs.json');

  private async ensurePrefsDirectory(): Promise<void> {
    try {
      await fs.access(this.prefsDir);
    } catch {
      await fs.mkdir(this.prefsDir, { recursive: true });
    }
  }

  async load(): Promise<any> {
    await this.ensurePrefsDirectory();
    
    try {
      const content = await fs.readFile(this.prefsFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Return empty object if file doesn't exist
      return {};
    }
  }

  async save(data: any): Promise<void> {
    await this.ensurePrefsDirectory();
    await fs.writeFile(this.prefsFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
