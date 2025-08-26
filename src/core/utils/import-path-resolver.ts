import path from 'path';
import { FileWriter } from '../output';

export class ImportPathResolver {
  constructor(private fileWriter: FileWriter) {}

  async getImportPath(fromFilename: string, toFilename: string): Promise<string> {
    const fromPath = await this.fileWriter.resolvePath(fromFilename);
    const toPath = await this.fileWriter.resolvePath(toFilename);

    const fromDir = path.dirname(fromPath);
    const relative = path.relative(fromDir, toPath).replace(/\\/g, '/').replace(/\.ts$/, '');

    return relative.startsWith('.') ? relative : `./${relative}`;
  }
}
