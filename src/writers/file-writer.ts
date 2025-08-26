import fs from 'fs-extra';
import path from 'path';

export const writeFiles = async (files: Map<string, string>, outputDir: string) => {
  await fs.ensureDir(outputDir);

  for (const [filename, content] of files) {
    const fullPath = path.join(outputDir, filename);
    await fs.writeFile(fullPath, content, 'utf8');
  }
};
