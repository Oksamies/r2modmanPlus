import { ImmutableProfile } from '../../model/Profile';
import TcliBridge from '../tcli/TcliBridge';
import FsProvider from '../../providers/generic/file/FsProvider';
import R2Error from '../../model/errors/R2Error';
import YamlParseError from '../../model/errors/Yaml/YamlParseError';
import FileWriteError from '../../model/errors/FileWriteError';
import ManifestV2 from '../../model/ManifestV2';
import PathResolver from '../manager/PathResolver';
import FileUtils from '../../utils/FileUtils';
import ManagerInformation from '../../_managerinf/ManagerInformation';
import LinkProvider from '../../providers/components/LinkProvider';
import AsyncLock from 'async-lock';
import InteractionProvider from '../../providers/ror2/system/InteractionProvider';
import { ProfileApiClient } from '../profiles/ProfilesClient';
import path from '../../providers/node/path/path';

export default class ProfileModList {

    public static SUPPORTED_CONFIG_FILE_EXTENSIONS = [".cfg", ".txt", ".json", ".yml", ".yaml", ".ini"];
    public static readonly MAX_EXPORT_AS_CODE_SIZE = 20000000; // 20MB

    private static lock = new AsyncLock();

    public static async requestLock(fn: () => any) {
        return this.lock.acquire("acquire", fn);
    }

    public static async getModList(profile: ImmutableProfile): Promise<ManifestV2[] | R2Error> {
        try {
            const parsedYaml = await TcliBridge.invoke<any[]>(['profile', 'mods', profile.getProfileName()]);
            for(let modIndex in parsedYaml){
                const mod = new ManifestV2().fromJsObject(parsedYaml[modIndex]);
                this.setIconPath(mod, profile);
                parsedYaml[modIndex] = mod;
            }
            return parsedYaml;
        } catch(e) {
            const err: Error = e as Error;
            console.error(err);
            return new YamlParseError(
                `Failed to parse yaml file of profile: ${profile.getProfileName()}/mods.yml`,
                err.message,
                null
            );
        }
    }

    public static async saveModList(profile: ImmutableProfile, modList: ManifestV2[]): Promise<R2Error | null> {
        return this.requestLock(async () => {
            try {
                // Pre-process the list to remove the icon before saving, same as replacer did
                const cleanedList = modList.map(mod => {
                    const jsObj = JSON.parse(JSON.stringify(mod));
                    delete jsObj.icon;
                    return jsObj;
                });
                
                await TcliBridge.invoke(['profile', 'save-mods', profile.getProfileName(), JSON.stringify(cleanedList)]);
                return null;
            } catch(e) {
                const err: Error = e as Error;
                return new FileWriteError(
                    `Failed to create mods.yml for profile: ${profile.getProfileName()}`,
                    err.message,
                    `Try running ${ManagerInformation.APP_NAME} as an administrator`
                );
            }
        });
    }

    public static async addMod(mod: ManifestV2, profile: ImmutableProfile): Promise<ManifestV2[] | R2Error> {
        return this.requestLock(async () => {
            try {
                await TcliBridge.invoke(['profile', 'add-mod', profile.getProfileName(), JSON.stringify(mod)]);
                return await this.getModList(profile);
            } catch(e) {
                const err: Error = e as Error;
                return new FileWriteError(`Failed to add mod: ${mod.getName()}`, err.message, null);
            }
        });
    }

    public static async removeMod(mod: ManifestV2, profile: ImmutableProfile): Promise<ManifestV2[] | R2Error> {
        return this.requestLock(async () => {
            try {
                await TcliBridge.invoke(['profile', 'remove-mod', profile.getProfileName(), mod.getName()]);
                return await this.getModList(profile);
            } catch(e) {
                const err: Error = e as Error;
                return new FileWriteError(`Failed to remove mod: ${mod.getName()}`, err.message, null);
            }
        });
    }

    public static async updateMods(modsToUpdate: ManifestV2[], profile: ImmutableProfile, apply: (mod: ManifestV2) => void): Promise<ManifestV2[] | R2Error> {
        return this.requestLock(async () => {
            try {
                const payload = modsToUpdate.map(m => {
                    apply(m);
                    return m;
                });
                await TcliBridge.invoke(['profile', 'update-mods', profile.getProfileName(), JSON.stringify(payload)]);
                return await this.getModList(profile);
            } catch(e) {
                const err: Error = e as Error;
                return new FileWriteError(`Failed to update mods in profile: ${profile.getProfileName()}`, err.message, null);
            }
        });
    }

    public static async updateMod(mod: ManifestV2, profile: ImmutableProfile, apply: (mod: ManifestV2) => Promise<void>): Promise<ManifestV2[] | R2Error> {
        return this.requestLock(async () => {
            try {
                await apply(mod);
                await TcliBridge.invoke(['profile', 'update-mod', profile.getProfileName(), JSON.stringify(mod)]);
                return await this.getModList(profile);
            } catch(e) {
                const err: Error = e as Error;
                return new FileWriteError(`Failed to update mod: ${mod.getName()}`, err.message, null);
            }
        });
    }

    public static async exportModListToFile(profile: ImmutableProfile): Promise<R2Error | string> {
        const exportDirectory = path.join(PathResolver.MOD_ROOT, 'exports');
        try {
            await FileUtils.ensureDirectory(exportDirectory);
        } catch(e) {
            const err: Error = e as Error;
            return new R2Error('Failed to ensure folder exists', err.message,
                `Try running ${ManagerInformation.APP_NAME} as an administrator`);
        }
        const dir = await InteractionProvider.instance.selectFolder({
            title: `Select the folder to export your profile to`,
            defaultPath: exportDirectory,
            buttonLabel: 'Select export folder'
        });
        if (dir.length === 0) {
            return new R2Error("Failed to export profile", "No export folder was selected", null);
        }
        const exportPath = path.join(dir[0], `${profile.getProfileName()}_${new Date().getTime()}.r2z`);
        try {
            await TcliBridge.invoke(['profile', 'export', profile.getProfileName(), exportPath]);
            LinkProvider.instance.selectFile(exportPath);
            return exportPath;
        } catch(e) {
            return R2Error.fromThrownValue(e);
        }
    }

    public static async exportModListAsCode(profile: ImmutableProfile, callback: (code: string, err: R2Error | null) => void): Promise<R2Error | void> {
        const fs = FsProvider.instance;
        const exportDirectory = path.join(PathResolver.MOD_ROOT, 'exports');
        await FileUtils.ensureDirectory(exportDirectory);
        const exportPath = path.join(exportDirectory, `${profile.getProfileName()}.r2z`);
        
        try {
            await TcliBridge.invoke(['profile', 'export', profile.getProfileName(), exportPath]);

            const zipStats = await fs.lstat(exportPath);
            if (zipStats.size > this.MAX_EXPORT_AS_CODE_SIZE) {
                const zipSize = FileUtils.humanReadableSize(zipStats.size);
                const maxSize = FileUtils.humanReadableSize(this.MAX_EXPORT_AS_CODE_SIZE);
                const fileTypes = this.SUPPORTED_CONFIG_FILE_EXTENSIONS.join(', ');
                const configFolder = profile.joinToProfilePath('BepInEx', 'config');
                return new R2Error(
                    'The profile is too large to be exported as a code',
                    `Exported profile size is ${zipSize} while the maximum supported size is ${maxSize}.
                     Exported profile includes ${fileTypes} files and all the contents of ${configFolder}`,
                    'You can still try exporting the profile as a file from the settings view.'
                );
            }

            const profileBuffer = '#r2modman\n' + (await fs.base64FromZip(exportPath));
            const storageResponse = await ProfileApiClient.createProfile(profileBuffer);
            callback(storageResponse.data.key, null);
        } catch (e: R2Error | unknown) {
            callback('', R2Error.fromThrownValue(e, "Failed to export profile"));
        }
    }

    public static getDisabledModCount(modList: ManifestV2[]): number {
        return modList.filter(value => !value.isEnabled()).length;
    }

    public static async setIconPath(mod: ManifestV2, profile: ImmutableProfile): Promise<void> {
        const paths = [
            path.join(profile.getProfilePath(), "BepInEx", "plugins", mod.getName(), "icon.png"),
            path.join(PathResolver.MOD_ROOT, "cache", mod.getName(), mod.getVersionNumber().toString(), "icon.png"),
        ]

        for (const iconPath of paths) {
            try {
                const content = await FsProvider.instance.base64FromZip(iconPath);
                mod.setIcon(`data:image/png;base64,${content}`);
                return;
            } catch (e) {
                continue;
            }
        }

        mod.setIcon("/unknown.png");
    }
}
