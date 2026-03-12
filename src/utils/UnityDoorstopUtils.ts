import Profile from '../model/Profile';
import TcliBridge from '../r2mm/tcli/TcliBridge';

export async function getUnityDoorstopVersion(profile: Profile): Promise<number> {
    try {
        const version = await TcliBridge.invoke<number>(['system', 'check-doorstop', profile.getProfileName()]);
        return version || 3;
    } catch {
        return 3;
    }
}
