import { createInterface, type Interface } from 'node:readline/promises';

export class Prompt {
  private static readonly CTRL_C = String.fromCharCode(3);
  private static readonly BACKSPACE_DEL = String.fromCharCode(127);
  private static readonly BACKSPACE_BS = String.fromCharCode(8);

  static async text(message: string, validate?: (input: string) => true | string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    try {
      while (true) {
        const answer = (await Prompt.askLine(rl, `${message} `)).trim();
        if (!validate) return answer;

        const result = validate(answer);
        if (result === true) return answer;

        console.log(result);
      }
    } finally {
      rl.close();
    }
  }

  static async confirm(message: string, defaultValue: boolean): Promise<boolean> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    try {
      const suffix = defaultValue ? 'Y/n' : 'y/N';
      const answer = (await Prompt.askLine(rl, `${message} (${suffix}) `)).trim().toLowerCase();

      if (answer === '') return defaultValue;
      return answer === 'y' || answer === 'yes';
    } finally {
      rl.close();
    }
  }

  static password(
    message: string,
    input: NodeJS.ReadStream = process.stdin,
    output: NodeJS.WriteStream = process.stdout
  ): Promise<string> {
    if (!input.isTTY) {
      const rl = createInterface({ input, output });
      output.write(`${message} `);
      return Prompt.askLine(rl, '').then(
        answer => {
          rl.close();
          return answer;
        },
        err => {
          rl.close();
          throw err;
        }
      );
    }

    return new Promise((resolve, reject) => {
      output.write(`${message} `);

      let buffer = '';
      input.setRawMode(true);
      input.resume();
      input.setEncoding('utf8');

      const cleanup = () => {
        input.setRawMode(false);
        input.pause();
        input.removeListener('data', onData);
        input.removeListener('end', onEnd);
      };

      const onEnd = () => {
        cleanup();
        reject(new Error('Input ended unexpectedly while waiting for a response.'));
      };

      const onData = (char: string) => {
        if (char === Prompt.CTRL_C) {
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

        if (char === Prompt.BACKSPACE_DEL || char === Prompt.BACKSPACE_BS) {
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
      input.on('end', onEnd);
    });
  }

  /**
   * `rl.question()` never settles if the underlying stream ends (e.g. piped
   * input running out) while it's pending -- the process just exits silently
   * once nothing else keeps the event loop alive. Racing against the
   * interface's own "close" event turns that into a clear, catchable error.
   */
  private static askLine(rl: Interface, prompt: string): Promise<string> {
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
}
