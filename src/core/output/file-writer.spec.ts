import path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import { FileWriter } from './file-writer';

jest.mock('fs-extra', () => ({
  __esModule: true,
  default: {
    ensureDir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
  },
}));

jest.mock('prettier', () => ({
  __esModule: true,
  default: {
    resolveConfig: jest.fn(),
    format: jest.fn(),
  },
}));

describe('FileWriter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.ensureDir as any).mockResolvedValue(undefined);
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.readdir as any).mockResolvedValue([]);
    (prettier.resolveConfig as any).mockResolvedValue({});
  });

  it('falls back to unformatted content and warns when prettier.format rejects', async () => {
    (prettier.format as any).mockRejectedValue(new Error('boom'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const writer = new FileWriter('/out', 'out');
    await expect(writer.writeFiles(new Map([['user.entity.ts', 'RAW_CONTENT']]))).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('user.entity.ts'));
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('user.entity.ts'), 'RAW_CONTENT', 'utf-8');

    warnSpy.mockRestore();
  });

  it('writes formatted content and does not warn on the happy path', async () => {
    (prettier.format as any).mockResolvedValue('FORMATTED_CONTENT');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const writer = new FileWriter('/out', 'out');
    await writer.writeFiles(new Map([['user.entity.ts', 'RAW_CONTENT']]));

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('user.entity.ts'),
      'FORMATTED_CONTENT',
      'utf-8'
    );
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("resolvePath in 'out' mode resolves against outputDir without touching fs.readdir", async () => {
    const writer = new FileWriter('/out', 'out');
    const resolved = await writer.resolvePath('user.entity.ts');

    expect(resolved).toBe(path.resolve('/out', 'user.entity.ts'));
    expect(fs.readdir).not.toHaveBeenCalled();
  });

  it("resolvePath in 'inline' mode returns a found match", async () => {
    (fs.readdir as any).mockImplementation(async (dir: string) => {
      if (dir === process.cwd()) {
        return [{ name: 'user.entity.ts', isDirectory: () => false, isFile: () => true }];
      }
      return [];
    });

    const writer = new FileWriter('/out', 'inline');
    const resolved = await writer.resolvePath('user.entity.ts');

    expect(resolved).toBe(path.join(process.cwd(), 'user.entity.ts'));
  });

  it("resolvePath in 'inline' mode falls back to outputDir when nothing matches", async () => {
    (fs.readdir as any).mockResolvedValue([]);

    const writer = new FileWriter('/out', 'inline');
    const resolved = await writer.resolvePath('user.entity.ts');

    expect(resolved).toBe(path.resolve('/out', 'user.entity.ts'));
  });
});
