import GameRunnerProvider from '../../../../providers/generic/game/GameRunnerProvider';
import Game from '../../../../model/game/Game';
import R2Error from '../../../../model/errors/R2Error';
import Profile from '../../../../model/Profile';
import TcliBridge from '../../../tcli/TcliBridge';

export default class XboxGamePassGameRunner extends GameRunnerProvider {

    public async getGameArguments(game: Game, profile: Profile): Promise<string[] | R2Error> {
        return [];
    }

    public async startModded(game: Game, profile: Profile): Promise<void | R2Error> {
        return this.start(game, profile);
    }

    public async startVanilla(game: Game, profile: Profile): Promise<void | R2Error> {
        return this.start(game, profile);
    }

    async start(game: Game, profile: Profile): Promise<void | R2Error> {
        try {
            await TcliBridge.invoke(['launch', 'xbox', game.settingsIdentifier, profile.getProfileName()]);
        } catch (err: any) {
            return new R2Error('Error starting the game', err.message, 'Ensure that the game has been set correctly via Xbox or settings');
        }
    }
}

