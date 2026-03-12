import R2Error from '../../../model/errors/R2Error';
import ManagerSettings from '../ManagerSettings';
import GameDirectoryResolverProvider from '../../../providers/ror2/game/GameDirectoryResolverProvider';
import Game from '../../../model/game/Game';
import GameManager from '../../../model/game/GameManager';
import TcliBridge from '../../../r2mm/tcli/TcliBridge';

export default class GameDirectoryResolverImpl extends GameDirectoryResolverProvider {

    public async getSteamDirectory(): Promise<string | R2Error> {
        const settings = await ManagerSettings.getSingleton(GameManager.activeGame);
        if (settings.getContext().global.steamDirectory != null && settings.getContext().global.steamDirectory!.length > 0) {
            return settings.getContext().global.steamDirectory!;
        }
        try {
            return await TcliBridge.invoke<string>(['system', 'locate-steam']);
        } catch(e) {
            const err = e as Error;
            return new R2Error(
                'Unable to resolve steam install folder',
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
            const gameDir = await TcliBridge.invoke<string>(['system', 'locate-game', game.activePlatform.storePlatform, game.activePlatform.storeIdentifier as string]);
            return gameDir;
        } catch(e) {
            const err: Error = e as Error;
            return new R2Error(
                `Unable to resolve the ${game.displayName} install folder`,
                err.message,
                `Try manually locating the ${game.displayName} install folder through the settings`
            )
        }
    }

}
