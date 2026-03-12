import { execFile } from 'child_process';
import * as path from 'path';

export interface TcliJsonResponse<T> {
    result?: T;
    error?: string;
}

/**
 * TcliBridge: Core IPC layer for securely invoking the Rust `tcli` binary.
 * 
 * Security Rules Enforced:
 * 1. Strict Input Sanitization: Uses argument arrays rather than shell strings.
 * 2. Safe Execution Layer: execFile with shell: false.
 * 3. Structured Communication: Requires JSON stdout.
 * 4. Error Handling: Checks exit codes and logs stderr to the diagnostic console.
 * 5. Type Mapping: TcliJsonResponse interface handles the generic result payloads.
 */
export default class TcliBridge {
    // Note: Path will need adjusted during production packaging
    private static readonly BIN_PATH = path.join(
        __dirname, '..', '..', '..', '..', 'tcli-rust', 'target', 'release', 'tcli.exe'
    );

    public static async invokeWithProgress<T>(args: string[], onProgress: (data: any) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const proc = spawn(this.BIN_PATH, args, { shell: false });
            let stdoutData = '';

            proc.stdout.on('data', (data: Buffer) => {
                const text = data.toString();
                stdoutData += text;
                const lines = text.split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        onProgress(parsed);
                    } catch (e) {
                        // partial line
                    }
                }
            });

            proc.stderr.on('data', (data: Buffer) => {
                console.warn(`[TCLI Warning]\n${data.toString()}`);
            });

            proc.on('close', (code: number) => {
                if (code !== 0) {
                    return reject(new Error(`TCLI Process failed with code: ${code}`));
                }
                try {
                    // Grab the last valid JSON line
                    const lines = stdoutData.split('\n').filter(l => l.trim().length > 0);
                    const lastLine = lines[lines.length - 1];
                    const parsed = JSON.parse(lastLine);
                    if (parsed.error) return reject(new Error(`TCLI Explicit Error: ${parsed.error}`));
                    resolve(parsed.result);
                } catch(e: any) {
                    reject(new Error(`Failed to parse tcli stdout JSON: ${e.message}\nRaw Stdout: ${stdoutData}`));
                }
            });
        });
    }

    public static async invoke<T>(args: string[]): Promise<T> {
        return new Promise((resolve, reject) => {
            // Strictly passing args array to prevent command injection
            execFile(this.BIN_PATH, args, { shell: false }, (error, stdout, stderr) => {
                
                // Exit code checks and generic execution failures
                if (error) {
                    console.error(`[TCLI Error] Process failed with code: ${error.code}`);
                    console.error(`[TCLI Diagnostics]\n${stderr}`);
                    return reject(new Error(`TCLI Execution Failed: ${error.message}`));
                }

                // Log any non-fatal diagnostic warnings passed to stderr by Rust
                if (stderr && stderr.trim().length > 0) {
                    console.warn(`[TCLI Warning]\n${stderr}`);
                }

                // Parse structured JSON communication
                try {
                    const parsed: TcliJsonResponse<T> = JSON.parse(stdout);
                    
                    if (parsed.error) {
                        return reject(new Error(`TCLI Explicit Error: ${parsed.error}`));
                    }
                    
                    if (parsed.result !== undefined) {
                        return resolve(parsed.result);
                    }
                    
                    return reject(new Error('TCLI response contained neither result nor error metadata.'));
                } catch (parseError: any) {
                    reject(new Error(`Failed to parse tcli stdout JSON: ${parseError.message}\nRaw Stdout: ${stdout}`));
                }
            });
        });
    }
}