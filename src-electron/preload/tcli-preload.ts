import { ipcRenderer } from 'electron';

export async function invoke(args: string[]): Promise<{error: any, stdout: string, stderr: string}> {
    return ipcRenderer.invoke('tcli:invoke', args);
}

export function invokeWithProgress(args: string[], reqId: string, onProgress: (data: string) => void): Promise<{code: number, stdout?: string, error?: string}> {
    return new Promise((resolve) => {
        const progressListener = (event: any, data: string) => {
            onProgress(data);
        };
        const closeListener = (event: any, result: {code: number, stdout?: string, error?: string}) => {
            ipcRenderer.removeListener(`tcli:progress:${reqId}`, progressListener);
            ipcRenderer.removeListener(`tcli:close:${reqId}`, closeListener);
            resolve(result);
        };
        
        ipcRenderer.on(`tcli:progress:${reqId}`, progressListener);
        ipcRenderer.on(`tcli:close:${reqId}`, closeListener);

        ipcRenderer.send('tcli:invokeWithProgress', reqId, args);
    });
}
