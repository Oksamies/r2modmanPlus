import ManifestV2 from '../../model/ManifestV2';
import TcliBridge from '../tcli/TcliBridge';
import Profile from '../../model/Profile';

export default class Dependants {

    public static async getDependantListAsync(activeProfile: Profile, manifestMod: ManifestV2, modList: ManifestV2[]): Promise<Set<ManifestV2>> {
        try {
            const deps = await TcliBridge.invoke<ManifestV2[]>(['package', 'get-dependants', activeProfile.getProfileName(), manifestMod.getName()]);
            return new Set<ManifestV2>(deps);
        } catch (e) {
            console.warn('Failed to get dependants via TcliBridge, falling back to legacy iteration.', e);
            return this.getDependantList(manifestMod, modList);
        }
    }

    public static getDependantList(manifestMod: ManifestV2, modList: ManifestV2[], dependantSet?: Set<ManifestV2>): Set<ManifestV2> {
        const dependants = dependantSet || new Set<ManifestV2>();

        // For all mods
        modList.forEach(mod => {
            // Get mod dependencies
            mod.getDependencies().forEach(dependency => {
                // If mod name equals mod trying to get dependants
                if (dependency.startsWith(manifestMod.getName() + "-")) {
                    if (!dependants.has(mod)) {
                        dependants.add(mod);
                        // Get dependants of new mod
                        this.getDependantList(mod, modList, dependants).forEach(recursive => {
                            dependants.add(recursive);
                        })
                    }
                }
            })
        })
        return dependants;
    }

    public static getDependencyList(manifestMod: ManifestV2, modList: ManifestV2[], dependencySet?: Set<ManifestV2>): Set<ManifestV2> {
        const dependencies = dependencySet || new Set<ManifestV2>();
        manifestMod.getDependencies().forEach(dependant => {
            modList.forEach(mod => {
                if (dependant.startsWith(mod.getName() + "-")) {
                    if (!dependencies.has(mod)) {
                        dependencies.add(mod);
                        this.getDependencyList(mod, modList, dependencies).forEach(recursive => {
                            dependencies.add(recursive);
                        })
                    }
                }
            })
        })
        return dependencies;
    }

}
