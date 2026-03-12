import GameDirectoryResolverProvider from '../../../providers/ror2/game/GameDirectoryResolverProvider';
import Game from '../../../model/game/Game';
import R2Error from '../../../model/errors/R2Error';
import ManagerSettings from '../../manager/ManagerSettings';
import TcliBridge from '../../../r2mm/tcli/TcliBridge';

export default class DarwinGameDirectoryResolver extends GameDirectoryResolverProvider {

    async getDirectory(game: Game): Promise<string | R2Error> {
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

    async getSteamDirectory(): Promise<string | R2Error> {
        try {
            return await TcliBridge.invoke<string>(['system', 'locate-steam']);
        } catch(e) {
            const err = e as Error;
            return new R2Error("Steam is not installed", err.message, null);
        }
    }

}
