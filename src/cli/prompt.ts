import { createInterface, type Interface } from 'node:readline/promises';

export function createPromptSession(): Interface {
  return createInterface({ input: process.stdin, output: process.stdout });
}

/**
 * `rl.question()` never settles if the underlying stream ends (e.g. piped
 * input running out) while it's pending -- the process just exits silently
 * once nothing else keeps the event loop alive. Racing against the
 * interface's own "close" event turns that into a clear, catchable error.
 */
function askLine(rl: Interface, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const onClose = () => reject(new Error('Input ended unexpectedly while waiting for a response.'));
    rl.once('close', onClose);

    rl.question(prompt).then(
      answer => {
        rl.off('close', onClose);
        resolve(answer);
      },
      err => {
        rl.off('close', onClose);
        reject(err);
      }
    );
  });
}

export async function promptText(
  message: string,
  validate?: (input: string) => true | string,
  session?: Interface
): Promise<string> {
  const rl = session ?? createInterface({ input: process.stdin, output: process.stdout });

  try {
    while (true) {
      const answer = (await askLine(rl, `${message} `)).trim();
      if (!validate) return answer;

      const result = validate(answer);
      if (result === true) return answer;

      console.log(result);
    }
  } finally {
    if (!session) rl.close();
  }
}

export async function promptConfirm(message: string, defaultValue: boolean, session?: Interface): Promise<boolean> {
  const rl = session ?? createInterface({ input: process.stdin, output: process.stdout });

  try {
    const suffix = defaultValue ? 'Y/n' : 'y/N';
    const answer = (await askLine(rl, `${message} (${suffix}) `)).trim().toLowerCase();

    if (answer === '') return defaultValue;
    return answer === 'y' || answer === 'yes';
  } finally {
    if (!session) rl.close();
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
    return askLine(rl, '').then(
      answer => {
        rl.close();
        return answer.trim();
      },
      err => {
        rl.close();
        throw err;
      }
    );
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
