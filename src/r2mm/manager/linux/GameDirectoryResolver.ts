import R2Error from '../../../model/errors/R2Error';
import FileNotFoundError from '../../../model/errors/FileNotFoundError';
import ManagerSettings from '../ManagerSettings';
import FsProvider from '../../../providers/generic/file/FsProvider';
import GameDirectoryResolverProvider from '../../../providers/ror2/game/GameDirectoryResolverProvider';
import Game from '../../../model/game/Game';
import GameManager from '../../../model/game/GameManager';
import path from '../../../providers/node/path/path';
import {getLaunchType, LaunchType} from "../../../model/real_enums/launch/LaunchType";
import TcliBridge from '../../../r2mm/tcli/TcliBridge';

const FORCE_PROTON_FILENAME = ".forceproton";

export default class GameDirectoryResolverImpl extends GameDirectoryResolverProvider {

    public async getSteamDirectory(): Promise<string | R2Error> {
        const settings = await ManagerSettings.getSingleton(GameManager.activeGame);
        if (settings.getContext().global.steamDirectory != null) {
            return settings.getContext().global.steamDirectory!;
        }
        try {
            return await TcliBridge.invoke<string>(['system', 'locate-steam']);
        } catch(e) {
            const err = e as Error;
            return new R2Error(
                'Unable to resolve Steam install folder',
                err.message,
                'Try manually setting the Steam folder through the settings'
            )
        }
    }

    public async getDirectory(game: Game): Promise<R2Error | string> {
        const settings = await ManagerSettings.getSingleton(game);
        if (settings.getContext().gameSpecific.gameDirectory != null) {
            return settings.getContext().gameSpecific.gameDirectory!;
        }
        try {
            return await TcliBridge.invoke<string>(['system', 'locate-game', game.activePlatform.storePlatform, game.activePlatform.storeIdentifier as string]);
        } catch(e) {
            const err: Error = e as Error;
            return new R2Error(
                `Unable to resolve the ${game.displayName} install folder`,
                err.message,
                `Try manually locating the ${game.displayName} install folder through the settings`
            )
        }
    }

    private async _isProtonForced(game: Game) {
        const fs = FsProvider.instance;
        const gameDir = await this.getDirectory(game);
        if (gameDir instanceof R2Error)
            return false;
        return fs.exists(path.join(gameDir, FORCE_PROTON_FILENAME));
    }

    public async isProtonGame(game: Game) {

        // Skip isProtonGame check if user has explicitly declared launch behaviour.
        const manualLaunchType = await getLaunchType(game);
        if (manualLaunchType !== LaunchType.AUTO) {
            return manualLaunchType === LaunchType.PROTON;
        }

        try {
            if (await this._isProtonForced(game)) {
                console.log(`Proton was forced due to presence of ${FORCE_PROTON_FILENAME} file`);
                return true;
            }

            // Fallback to exe lookup since manifest parsing is removed
            const fs = FsProvider.instance;
            const gameDir = await this.getDirectory(game);
            if (gameDir instanceof R2Error)
                return false;
            const dirContents = await fs.readdir(gameDir);
            // Assume running with proton if the game directory contains an executable.
            // If not found, we can relatively safely assume Linux.
            return dirContents.filter(value => value.toLowerCase().endsWith(".exe")).length > 0;

        } catch (e) {
            const err: Error = e as Error;
            return new R2Error(
                `Unable to check if ${game.displayName} is a Proton game`,
                err.message,
                `If this happened, it is very likely that your game folder is not inside steamapps/common.`
            )
        }
    }

    public async getCompatDataDirectory(game: Game){
        // Removed manifest lookup; returning an error for compat data.
        return new FileNotFoundError(
            `Compatibility data lookup via manifest has been disabled.`,
            `Cannot find compatibility data folder location anymore.`,
            null
        );
    }

    public async getLaunchArgs(game: Game): Promise<R2Error | string> {
        // Since getLaunchArgs parses app manifests natively on Linux, returning empty.
        // Needs a Rust equivalent in tcli.
        return '';
    }

}

