import path from "../providers/node/path/path";
import TcliBridge from '../r2mm/tcli/TcliBridge';
import FsProvider from '../providers/generic/file/FsProvider';

export default class FileUtils {

    public static async copyFileOrFolder(source: string, target: string) {
        const stat = await FsProvider.instance.stat(source);
        if (stat.isFile()) {
            await FsProvider.instance.copyFile(source, target);
        } else {
            await FsProvider.instance.copyFolder(source, target);
        }
    }

    public static async ensureDirectory(dir: string) {
        await FsProvider.instance.mkdirs(dir);
    }

    public static async emptyDirectory(dir: string) {
        const files = await FsProvider.instance.readdir(dir);
        for (const file of files) {
            const p = path.join(dir, file);
            const stat = await FsProvider.instance.stat(p);
            if (stat.isFile()) {
                await FsProvider.instance.unlink(p);
            } else {
                await this.recursiveRemoveDirectoryIfExists(p);
            }
        }
    }

    // Obfuscates the Windows username if it's part of the path.
    public static hideWindowsUsername(dir: string) {
        const separator = dir.includes('/') ? '/' : '\\';
        return dir.replace(
            /([A-Za-z]:)[\\\/]Users[\\\/][^\\\/]+[\\\/]/,
            `$1${separator}Users${separator}***${separator}`
        );
    }

    public static humanReadableSize(bytes: number) {
        // NumberFormat renders GBs as BBs ("billion bytes") when using "byte" unit type.
        if (bytes > 999999999 && bytes < 1000000000000) {
            return `${(bytes / 1000000000).toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            })} GB`;
        }

        return Intl.NumberFormat("en", {
            notation: "compact",
            style: "unit",
            unit: "byte",
            unitDisplay: "narrow",
        }).format(bytes);
    };

    public static async recursiveRemoveDirectoryIfExists(dir: string) {
        if (await FsProvider.instance.exists(dir)) {
            await FsProvider.instance.rmdir(dir);
        }
    }
}
