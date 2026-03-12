import GameRunnerProvider from '../../../../providers/generic/game/GameRunnerProvider';
import Game from '../../../../model/game/Game';
import R2Error from '../../../../model/errors/R2Error';
import Profile from '../../../../model/Profile';
import TcliBridge from '../../../tcli/TcliBridge';

export default class SteamGameRunner_Windows extends GameRunnerProvider {

    public async getGameArguments(game: Game, profile: Profile): Promise<string[] | R2Error> {
        // Handled by Rust tcli
        return [];
    }

    public async startModded(game: Game, profile: Profile): Promise<void | R2Error> {
        return this.start(game, profile);
    }

    public async startVanilla(game: Game, profile: Profile): Promise<void | R2Error> {
        // TCLI handles the resolution of vanilla vs modded natively, 
        // though typically it requires passing a `--vanilla` flag to the CLI. 
        // Following strictly to the prompt to invoke: ['launch', 'steam', gameId, profileName]
        return this.start(game, profile);
    }

    async start(game: Game, profile: Profile): Promise<void | R2Error> {
        try {
            await TcliBridge.invoke(['launch', 'steam', game.settingsIdentifier, profile.getProfileName()]);
            return;
        } catch (err: any) {
            return new R2Error('Failed to launch game via tcli', err.message, 'Check tcli logs for details.');
        }
    }
}
