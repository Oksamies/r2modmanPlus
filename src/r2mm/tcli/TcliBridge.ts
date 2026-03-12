export interface TcliJsonResponse<T> {
    result?: T;
    error?: string;
}

/**
 * TcliBridge: Core IPC layer for securely invoking the Rust `tcli` binary.
 */
export default class TcliBridge {

    public static async invokeWithProgress<T>(args: string[], onProgress: (data: any) => void): Promise<T> {
        return new Promise(async (resolve, reject) => {
            const reqId = Math.random().toString(36).substring(7);
            
            const result = await (window as any).tcli.invokeWithProgress(args, reqId, (dataRaw: string) => {
                const lines = dataRaw.split('\n');
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

            if (result.code !== 0) {
                return reject(new Error(result.error || `TCLI Process failed with code: ${result.code}`));
            }

            try {
                // Grab the last valid JSON line
                const lines = (result.stdout || '').split('\n').filter((l: string) => l.trim().length > 0);
                if (lines.length === 0) return resolve(undefined as any);
                
                const lastLine = lines[lines.length - 1];
                const parsed: TcliJsonResponse<T> = JSON.parse(lastLine);
                
                if (parsed.error) {
                    return reject(new Error(`TCLI Explicit Error: ${parsed.error}`));
                }
                
                if (parsed.result !== undefined) {
                    return resolve(parsed.result);
                }
                
                return resolve(undefined as any); // T might be void
            } catch (e: any) {
                return reject(new Error(`Failed to parse tcli structured output: ${e.message}`));
            }
        });
    }

    public static async invoke<T>(args: string[]): Promise<T> {
        const { error, stdout, stderr } = await (window as any).tcli.invoke(args);
                
        // Exit code checks and generic execution failures
        if (error) {
            console.error(`[TCLI Diagnostics]\n${stderr}`);
            throw new Error(`TCLI Execution Failed: ${error.message}`);
        }

        // Log any non-fatal diagnostic warnings passed to stderr by Rust
        if (stderr && stderr.trim().length > 0) {
            console.warn(`[TCLI Warning]\n${stderr}`);
        }

        // Parse structured JSON communication
        try {
            const parsed: TcliJsonResponse<T> = JSON.parse(stdout);
            
            if (parsed.error) {
                throw new Error(`TCLI Explicit Error: ${parsed.error}`);
            }
            
            if (parsed.result !== undefined) {
                return parsed.result;
            }
            
            return undefined as any; // T might be void
        } catch (e: any) {
            throw new Error(`Failed to parse tcli JSON stdout: ${e.message}`);
        }
    }
}