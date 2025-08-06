import { dirname, join } from "path";
import { mkdir, stat } from "fs/promises";
import { writeFileSync } from "fs";

const publicStoryDir = join(process.cwd(), 'public/stories');

export async function publishStoryToWeb(storyId: string, source: string) {
    const htmlPath = join(publicStoryDir, storyId, 'index.html');
    const dirPath = dirname(htmlPath);
    try {
        await stat(dirPath);
    } catch (error) {
        await mkdir(dirPath, {recursive: true});
    }

    writeFileSync(htmlPath, source, 'utf-8');
    return `/stories/${storyId}`;
}