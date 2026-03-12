import GameRunnerProvider from '../../../../providers/generic/game/GameRunnerProvider';
import Game from '../../../../model/game/Game';
import R2Error from '../../../../model/errors/R2Error';
import Profile from '../../../../model/Profile';
import ManagerSettings from '../../../manager/ManagerSettings';
import LoggerProvider, { LogSeverity } from '../../../../providers/ror2/logging/LoggerProvider';
import GameInstructions from '../../instructions/GameInstructions';
import GameInstructionParser from '../../instructions/GameInstructionParser';
import TcliBridge from '../../../tcli/TcliBridge';

export default class SteamGameRunner_Darwin extends GameRunnerProvider {

    public async getGameArguments(game: Game, profile: Profile): Promise<string[] | R2Error> {
        const instructions = await GameInstructions.getInstructionsForGame(game, profile);
        return await GameInstructionParser.parseList(instructions.moddedParameterList, game, profile);
    }

    public async startModded(game: Game, profile: Profile): Promise<void | R2Error> {
        const args = await this.getGameArguments(game, profile);
        if (args instanceof R2Error) {
            return args
        }
        return this.start(game, args);
    }

    public async startVanilla(game: Game, profile: Profile): Promise<void | R2Error> {
        const instructions = await GameInstructions.getInstructionsForGame(game, profile);
        return this.start(game, instructions.vanillaParameterList);
    }

    async start(game: Game, args: string[]): Promise<void | R2Error> {
        const settings = await ManagerSettings.getSingleton(game);
        const additionalArgs = settings.getContext().gameSpecific.launchParameters.trim().split(" ").filter(Boolean);
        const allArgs = [...args, ...additionalArgs];

        try {
            LoggerProvider.instance.Log(LogSeverity.INFO, `Invoking tcli: launch steam-mac ${game.activePlatform.storeIdentifier} ${allArgs.join(' ')}`);
            await TcliBridge.invoke(['launch', 'steam-mac', game.activePlatform.storeIdentifier, ...allArgs]);
        } catch(err) {
            LoggerProvider.instance.Log(LogSeverity.ACTION_STOPPED, 'Error was thrown whilst starting the game');
            LoggerProvider.instance.Log(LogSeverity.ERROR, (err as Error).message);
            throw new R2Error('Error starting Steam', (err as Error).message, 'Ensure that the Steam folder has been set correctly in the settings');
        }
    }
}
