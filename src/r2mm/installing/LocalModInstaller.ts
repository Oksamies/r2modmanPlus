import R2Error, { throwForR2Error } from '../../model/errors/R2Error';
import ManifestV2 from '../../model/ManifestV2';
import ProfileInstallerProvider from '../../providers/ror2/installing/ProfileInstallerProvider';
import ZipExtract from './ZipExtract';
import FsProvider from '../../providers/generic/file/FsProvider';
import PathResolver from '../manager/PathResolver';
import ProfileModList from '../mods/ProfileModList';
import LocalModInstallerProvider from '../../providers/ror2/installing/LocalModInstallerProvider';
import { ImmutableProfile } from '../../model/Profile';
import FileUtils from '../../utils/FileUtils';
import path from '../../providers/node/path/path';
import TcliBridge from '../tcli/TcliBridge';

export default class LocalModInstaller extends LocalModInstallerProvider {

    public async extractToCacheWithManifestData(profile: ImmutableProfile, zipFile: string, manifest: ManifestV2) {
        try {
            await TcliBridge.invoke(['install', 'local', zipFile, profile.getProfileName()]);
        } catch (e) {
            throw R2Error.fromThrownValue(e, 'Failed to extract local mod');
        }
    }

    public async placeFileInCache(profile: ImmutableProfile, file: string, manifest: ManifestV2) {
        try {
            await TcliBridge.invoke(['install', 'local', file, profile.getProfileName()]);
        } catch (e) {
            throw R2Error.fromThrownValue(e, 'Failed to place local mod file');
        }
    }
}
