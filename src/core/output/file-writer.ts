import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';

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

      const formatted = await this.formatWithPrettier(content, outputPath);
      await fs.writeFile(outputPath, formatted, 'utf-8');
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

  private async formatWithPrettier(code: string, filepath: string): Promise<string> {
    try {
      const options = await prettier.resolveConfig(filepath);
      return prettier.format(code, { ...options, filepath });
    } catch (err) {
      console.warn(`⚠️ Prettier failed on ${filepath}: ${err}`);
      return code;
    }
  }
}
