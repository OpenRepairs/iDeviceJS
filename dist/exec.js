"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
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
 * @returns {Promise<string[]>} A promise that resolves with an array containing the stdout and stderr of the command, or rejects with an array containing the error, stdout, and stderr if the command fails.
 *
 */
let exec = (cmd, args, option = {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 256 * 1024 * 1024,
    killSignal: 'SIGTERM',
    cwd: undefined,
    env: undefined
}) => {
    return new Promise((resolve, reject) => {
        child_process.execFile(cmd, args, option, (err, stdout, stderr) => {
            if (err) {
                reject([err, stdout, stderr]);
            }
            else {
                resolve([stdout, stderr]);
            }
        });
    });
};
exports.default = exec;
//# sourceMappingURL=exec.js.map