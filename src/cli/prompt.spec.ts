import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline/promises';

import { promptConfirm, promptPassword, promptText } from './prompt';

jest.mock('node:readline/promises', () => ({
  createInterface: jest.fn(),
}));

const mockedCreateInterface = createInterface as jest.MockedFunction<typeof createInterface>;

function makeFakeInterface(answers: string[]) {
  let call = 0;
  return {
    question: jest.fn(async () => answers[call++]),
    close: jest.fn(),
  };
}

describe('promptText', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the trimmed answer when there is no validator', async () => {
    const fake = makeFakeInterface(['  localhost  ']);
    mockedCreateInterface.mockReturnValue(fake as never);

    await expect(promptText('Enter host:')).resolves.toBe('localhost');
    expect(fake.close).toHaveBeenCalled();
  });

  it('reprompts until validate returns true', async () => {
    const fake = makeFakeInterface(['', 'sa']);
    mockedCreateInterface.mockReturnValue(fake as never);
    const validate = (input: string) => (input.trim() !== '' ? true : 'Required.');

    await expect(promptText('Enter user:', validate)).resolves.toBe('sa');
    expect(fake.question).toHaveBeenCalledTimes(2);
  });
});

describe('promptConfirm', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the default when the answer is empty', async () => {
    const fake = makeFakeInterface(['']);
    mockedCreateInterface.mockReturnValue(fake as never);

    await expect(promptConfirm('All tables?', true)).resolves.toBe(true);
  });

  it('returns true for "y"/"yes" and false otherwise', async () => {
    const fakeYes = makeFakeInterface(['y']);
    mockedCreateInterface.mockReturnValue(fakeYes as never);
    await expect(promptConfirm('All tables?', false)).resolves.toBe(true);

    const fakeNo = makeFakeInterface(['n']);
    mockedCreateInterface.mockReturnValue(fakeNo as never);
    await expect(promptConfirm('All tables?', true)).resolves.toBe(false);
  });
});

describe('promptPassword', () => {
  class FakeReadStream extends EventEmitter {
    isTTY = true;
    setRawMode = jest.fn();
    resume = jest.fn();
    pause = jest.fn();
    setEncoding = jest.fn();
  }

  class FakeWriteStream {
    written: string[] = [];
    write = jest.fn((chunk: string) => {
      this.written.push(chunk);
      return true;
    });
  }

  afterEach(() => jest.clearAllMocks());

  it('echoes "*" per character and resolves with the buffered password on Enter', async () => {
    const input = new FakeReadStream();
    const output = new FakeWriteStream();

    const resultPromise = promptPassword('Password:', input as never, output as never);

    input.emit('data', 'a');
    input.emit('data', 'b');
    input.emit('data', 'c');
    input.emit('data', '\r');

    await expect(resultPromise).resolves.toBe('abc');
    expect(output.written.filter(w => w === '*')).toHaveLength(3);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
  });

  it('removes the last character and erases one "*" on backspace', async () => {
    const input = new FakeReadStream();
    const output = new FakeWriteStream();

    const resultPromise = promptPassword('Password:', input as never, output as never);

    input.emit('data', 'a');
    input.emit('data', 'b');
    input.emit('data', String.fromCharCode(127));
    input.emit('data', 'c');
    input.emit('data', '\r');

    await expect(resultPromise).resolves.toBe('ac');
    expect(output.written).toContain('\b \b');
  });

  it('restores the terminal and exits on Ctrl+C without resolving', () => {
    const input = new FakeReadStream();
    const output = new FakeWriteStream();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    void promptPassword('Password:', input as never, output as never);
    input.emit('data', 'a');
    input.emit('data', String.fromCharCode(3));

    expect(exitSpy).toHaveBeenCalledWith(130);
    expect(input.setRawMode).toHaveBeenCalledWith(false);

    exitSpy.mockRestore();
  });

  it('falls back to a plain (unmasked) read when the stream is not a TTY', async () => {
    const fake = makeFakeInterface(['piped-secret']);
    mockedCreateInterface.mockReturnValue(fake as never);

    const input = new FakeReadStream();
    input.isTTY = false;
    const output = new FakeWriteStream();

    await expect(promptPassword('Password:', input as never, output as never)).resolves.toBe('piped-secret');
  });
});
