import { BrowserWindow, ipcMain } from 'electron';

export function hookChildProcessIpc(browserWindow: BrowserWindow) {
    const errorMsg = "Blocked: Use TcliBridge";

    ipcMain.on("node:child_process:execSync", (event) => {
        throw new Error(errorMsg);
    });

    ipcMain.on("node:child_process:spawnSync", (event) => {
        throw new Error(errorMsg);
    });

    ipcMain.handle("node:child_process:exec", async () => {
        throw new Error(errorMsg);
    });
}
