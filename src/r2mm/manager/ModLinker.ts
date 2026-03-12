import R2Error from '../../model/errors/R2Error';
import {ImmutableProfile} from '../../model/Profile';
import Game from '../../model/game/Game';
import GameDirectoryResolverProvider from '../../providers/ror2/game/GameDirectoryResolverProvider';
import LoggerProvider, {LogSeverity} from '../../providers/ror2/logging/LoggerProvider';
import TcliBridge from '../tcli/TcliBridge';

export default class ModLinker {

    public static async link(profile: ImmutableProfile, game: Game): Promise<string[] | R2Error> {
        try {
            const gameDirectory: string | R2Error = await GameDirectoryResolverProvider.instance.getDirectory(game);
            if (gameDirectory instanceof R2Error) {
                return gameDirectory;
            }

            LoggerProvider.instance.Log(LogSeverity.INFO, `Invoking tcli linker for profile ${profile.getProfileName()}`);
            
            const linkedFiles = await TcliBridge.invoke<string[]>([
                'install', 
                'link', 
                profile.getProfileName(), 
                gameDirectory
            ]);
            
            return linkedFiles || [];
        } catch (e: any) {
            return new R2Error(
                `Failed to link mods for profile ${profile.getProfileName()}`,
                e.message,
                `Try running the app as administrator or check native linker permissions.`
            );
        }
    }

}

