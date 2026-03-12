import R2Error from "../../model/errors/R2Error";
import { ActionTree } from "vuex";
import { State as RootState } from "../../store";
import Profile from "../../model/Profile";
import TcliBridge from "../../r2mm/tcli/TcliBridge";

interface State {
    profileList: string[];
}

/**
 * State for Profiles, i.e. list for profiles in a single game/community.
 */
export const ProfilesModule = {
    namespaced: true,

    state: (): State => ({
        profileList: ['Default'],
    }),
    mutations: {
        setProfileList(state: State, profileList: string[]) {
            state.profileList = profileList;
        },
        reset(state: State) {
            state.profileList = ['Default'];
        },
    },
    actions: <ActionTree<State, RootState>>{
        async addProfile({rootGetters, state, dispatch}, name: string) {
            try {
                await dispatch('setSelectedProfile', { profileName: name, prewarmCache: true });
                await dispatch('updateProfileList');
            } catch (e) {
                throw R2Error.fromThrownValue(e, 'Error whilst creating a profile');
            }
        },

        async ensureProfileExists({commit, dispatch, rootGetters, state}) {
            const activeProfile: Profile = rootGetters['profile/activeProfile'];
            const profileList = await TcliBridge.invoke<string[]>(['profile', 'list']);

            if (!profileList.includes(activeProfile.getProfileName())) {
                await dispatch('profile/updateActiveProfile', 'Default', { root: true });
                commit(
                    'setProfileList',
                    state.profileList.filter((p) => p !== activeProfile.getProfileName())
                );
            }
        },

        async removeSelectedProfile({rootGetters, state, dispatch, commit}) {
            const activeProfile: Profile = rootGetters['profile/activeProfile'];
            const profileName = activeProfile.getProfileName();

            try {
                await TcliBridge.invoke(['profile', 'delete', profileName]);
            } catch (e) {
                throw R2Error.fromThrownValue(e, 'Error whilst deleting profile from disk');
            }

            const filteredProfileList = state.profileList.filter((p: string) => p !== profileName || p === 'Default');
            commit(
                'setProfileList',
                filteredProfileList
            );
            await dispatch('setSelectedProfile', { profileName: 'Default', prewarmCache: true });
        },

        async setSelectedProfile({dispatch}, params: { profileName: string, prewarmCache: boolean }) {
            await dispatch('profile/updateActiveProfile', params.profileName, { root: true });
            if (params.prewarmCache) {
                await dispatch('profile/updateModListFromFile', null, { root: true });
                await dispatch('tsMods/prewarmCache', null, { root: true });
            }
        },

        async renameProfile({commit, rootGetters, state, dispatch}, params: { newName: string }) {
            const activeProfile: Profile = rootGetters['profile/activeProfile'];
            const oldName = activeProfile.getProfileName();

            try {
                await TcliBridge.invoke(['profile', 'rename', oldName, params.newName]);
            } catch (e) {
                throw R2Error.fromThrownValue(e, 'Error whilst renaming a profile on disk');
            }
            await dispatch('setSelectedProfile', { profileName: params.newName, prewarmCache: false });
            await dispatch('updateProfileList');
        },

        async updateProfileList({commit, rootGetters}) {
            try {
                const profileList = await TcliBridge.invoke<string[]>(['profile', 'list']);
                const filtered = profileList.filter(file => file.toLowerCase() !== 'default' && file.toLowerCase() !== '_profile_update');
                commit('setProfileList', ["Default", ...filtered].sort());
            } catch (e) {
                // If tcli fails, fallback to default
                commit('setProfileList', ['Default']);
            }
        },
    }
}
