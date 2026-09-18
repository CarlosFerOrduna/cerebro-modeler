import { createInterface } from 'node:readline/promises';

export async function promptText(message: string, validate?: (input: string) => true | string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    while (true) {
      const answer = (await rl.question(`${message} `)).trim();
      if (!validate) return answer;

      const result = validate(answer);
      if (result === true) return answer;

      console.log(result);
    }
  } finally {
    rl.close();
  }
}

export async function promptConfirm(message: string, defaultValue: boolean): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const suffix = defaultValue ? 'Y/n' : 'y/N';
    const answer = (await rl.question(`${message} (${suffix}) `)).trim().toLowerCase();

    if (answer === '') return defaultValue;
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

const CTRL_C = String.fromCharCode(3);
const BACKSPACE_DEL = String.fromCharCode(127);
const BACKSPACE_BS = String.fromCharCode(8);

export function promptPassword(
  message: string,
  input: NodeJS.ReadStream = process.stdin,
  output: NodeJS.WriteStream = process.stdout
): Promise<string> {
  if (!input.isTTY) {
    const rl = createInterface({ input, output });
    output.write(`${message} `);
    return rl.question('').then(answer => {
      rl.close();
      return answer.trim();
    });
  }

  return new Promise(resolve => {
    output.write(`${message} `);

    let buffer = '';
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');

    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
    };

    const onData = (char: string) => {
      if (char === CTRL_C) {
        cleanup();
        output.write('\n');
        process.exit(130);
        return;
      }

      if (char === '\r' || char === '\n') {
        cleanup();
        output.write('\n');
        resolve(buffer);
        return;
      }

      if (char === BACKSPACE_DEL || char === BACKSPACE_BS) {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          output.write('\b \b');
        }
        return;
      }

      buffer += char;
      output.write('*');
    };

    input.on('data', onData);
  });
}
