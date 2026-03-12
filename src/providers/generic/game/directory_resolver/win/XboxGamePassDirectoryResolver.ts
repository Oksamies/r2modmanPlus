import GameDirectoryResolverProvider from '../../../../ror2/game/GameDirectoryResolverProvider';
import Game from '../../../../../model/game/Game';
import R2Error from '../../../../../model/errors/R2Error';
import ManagerSettings from '../../../../../r2mm/manager/ManagerSettings';
import TcliBridge from '../../../../../r2mm/tcli/TcliBridge';

export default class XboxGamePassDirectoryResolver extends GameDirectoryResolverProvider {

    public async getDirectory(game: Game): Promise<string | R2Error> {
        const settings = await ManagerSettings.getSingleton(game);
        if (settings.getContext().gameSpecific.gameDirectory !== null) {
            return settings.getContext().gameSpecific.gameDirectory!;
        }

        try {
            return await TcliBridge.invoke(['system', 'locate-game', 'xbox', game.settingsIdentifier]);
        } catch (err: any) {
            return new R2Error(
                `Unable to resolve the ${game.displayName} install folder`,
                err.message,
                `Try manually locating the ${game.displayName} install folder through the settings`
            );
        }
    }

    public async getSteamDirectory(): Promise<string | R2Error> {
        return new R2Error("Folder shouldn't be retrieved for a non-steam game", "", null);
    }

}
