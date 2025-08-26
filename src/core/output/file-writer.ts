import fs from 'fs-extra';
import path from 'path';

export class FileWriter {
  private ignoredDirs = ['node_modules', '.git', 'dist', 'out'];

  constructor(
    private outputDir: string,
    private writeMode: 'inline' | 'out' = 'out'
  ) {}

  async writeFiles(files: Map<string, string>): Promise<void> {
    for (const [filename, content] of files.entries()) {
      const outputPath = await this.resolvePath(filename);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, content, 'utf-8');
    }
  }

  async resolvePath(filename: string): Promise<string> {
    if (this.writeMode === 'inline') {
      const projectRoot = process.cwd();
      const found = await this.findFile(projectRoot, filename);

      if (found) return found;
    }

    return path.resolve(this.outputDir, filename);
  }

  private async findFile(dir: string, target: string): Promise<string | null> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (this.ignoredDirs.includes(entry.name)) continue;

        const result = await this.findFile(fullPath, target);
        if (result) return result;
      } else if (entry.isFile() && entry.name === target) {
        return fullPath;
      }
    }

    return null;
  }
}
