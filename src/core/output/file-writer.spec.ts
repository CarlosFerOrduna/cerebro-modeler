import path from 'path';

import fs from 'node:fs/promises';
import prettier from 'prettier';

import { FileWriter } from './file-writer';

jest.mock('node:fs/promises', () => ({
  __esModule: true,
  default: {
    mkdir: jest.fn(),
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

interface MockDirEntry {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
}

type MkdirMock = (dir: string, options: { recursive: boolean }) => Promise<string | undefined>;
type WriteFileMock = (file: string, data: string, encoding: string) => Promise<void>;
type ReaddirMock = (dir: string, options: { withFileTypes: true }) => Promise<MockDirEntry[]>;
type ResolveConfigMock = (filepath: string) => Promise<Record<string, unknown> | null>;
type FormatMock = (source: string, options?: Record<string, unknown>) => Promise<string>;

const mockedMkdir = fs.mkdir as unknown as jest.MockedFunction<MkdirMock>;
const mockedWriteFile = fs.writeFile as unknown as jest.MockedFunction<WriteFileMock>;
const mockedReaddir = fs.readdir as unknown as jest.MockedFunction<ReaddirMock>;
const mockedResolveConfig = prettier.resolveConfig as unknown as jest.MockedFunction<ResolveConfigMock>;
const mockedFormat = prettier.format as unknown as jest.MockedFunction<FormatMock>;

describe('FileWriter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMkdir.mockResolvedValue(undefined);
    mockedWriteFile.mockResolvedValue(undefined);
    mockedReaddir.mockResolvedValue([]);
    mockedResolveConfig.mockResolvedValue({});
  });

  it('falls back to unformatted content and warns when prettier.format rejects', async () => {
    mockedFormat.mockRejectedValue(new Error('boom'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const writer = new FileWriter('/out', 'out');
    await expect(writer.writeFiles(new Map([['user.entity.ts', 'RAW_CONTENT']]))).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('user.entity.ts'));
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('user.entity.ts'), 'RAW_CONTENT', 'utf-8');

    warnSpy.mockRestore();
  });

  it('writes formatted content and does not warn on the happy path', async () => {
    mockedFormat.mockResolvedValue('FORMATTED_CONTENT');
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
    mockedReaddir.mockImplementation(async dir => {
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
    mockedReaddir.mockResolvedValue([]);

    const writer = new FileWriter('/out', 'inline');
    const resolved = await writer.resolvePath('user.entity.ts');

    expect(resolved).toBe(path.resolve('/out', 'user.entity.ts'));
  });
});
