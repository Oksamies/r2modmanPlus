import { BrowserWindow, ipcMain } from 'electron';
import { execFile, spawn } from 'child_process';
import * as path from 'path';
import * as process from 'process';

export function hookTcliIpc(browserWindow: BrowserWindow) {
    let BIN_PATH = path.join(process.cwd(), '..', 'tcli-rust', 'target', 'release', 'tcli.exe');
    if (process.env.PROD) {
        // adjust later if needed
    }

    ipcMain.handle('tcli:invoke', (event, args) => {
        return new Promise((resolve, reject) => {
            execFile(BIN_PATH, args, { shell: false }, (error, stdout, stderr) => {
                if (error) {
                    // Pass error properties back
                    resolve({ error: { message: error.message, code: error.code }, stdout, stderr });
                } else {
                    resolve({ error: null, stdout, stderr });
                }
            });
        });
    });

    ipcMain.on('tcli:invokeWithProgress', (event, reqId, args) => {
        try {
            const proc = spawn(BIN_PATH, args, { shell: false });
            let stdoutData = '';

            proc.stdout.on('data', (data) => {
                stdoutData += data.toString();
                browserWindow.webContents.send(`tcli:progress:${reqId}`, data.toString());
            });

            proc.stderr.on('data', (data) => {
                console.warn(`[TCLI Warning]\n${data.toString()}`);
            });

            proc.on('close', (code) => {
                browserWindow.webContents.send(`tcli:close:${reqId}`, { code: code, stdout: stdoutData });
            });
            proc.on('error', (err) => {
                browserWindow.webContents.send(`tcli:close:${reqId}`, { code: -1, error: err.message });
            });
        } catch (e: any) {
            browserWindow.webContents.send(`tcli:close:${reqId}`, { code: -1, error: e.message });
        }
    });
}
