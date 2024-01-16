import child_process = require('child_process');


/**
 * Executes a command in a child process.
 *
 * @param {string} cmd - The command to execute.
 * @param {string[]} args - The arguments to pass to the command.
 * @param {object} option - The options to use for the execution. This object can contain the following properties:
 *   - encoding: The encoding to use for the output. Default is 'utf8'.
 *   - timeout: The maximum time to wait for the command to finish, in milliseconds. Default is 30000.
 *   - maxBuffer: The maximum amount of data (in bytes) that can be passed to stdout or stderr. Default is 256*1024*1024.
 *   - killSignal: The signal to use to kill the process. Default is 'SIGTERM'.
 *   - cwd: The working directory to use for the command. Default is undefined.
 *   - env: The environment variables to use for the command. Default is undefined.
 * @returns {Promise<[string, string] | [child_process.ExecFileException, string, string]>} A promise that resolves with an array containing the stdout and stderr of the command, or rejects with an array containing the error, stdout, and stderr if the command fails.
 */
let exec = (cmd: string, args: string[], option: object = {
    encoding: 'utf8' as BufferEncoding,
    timeout: 30000,
    maxBuffer: 256*1024*1024,
    killSignal: 'SIGTERM' as NodeJS.Signals,
    cwd: undefined,
    env: undefined
}): Promise<[string, string] | [child_process.ExecFileException, string, string]> => {
    return new Promise((resolve, reject) => {
        child_process.execFile(cmd, args, option, (err: child_process.ExecFileException | null, stdout:string, stderr:string) => {
            if (err) {
                reject([err, stdout, stderr]);
            } else {
                resolve([stdout, stderr]);
            }
        });
    });
};

export default exec;