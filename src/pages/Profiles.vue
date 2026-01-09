<template>
  <div class="nimbus-scope cyberstorm-container cyberstorm-container--full island">
    <CreateProfileModal />
    <DeleteProfileModal />
    <RenameProfileModal />
    <ImportProfileModal />
    <div class="island cyberstorm-container cyberstorm-container--y cyberstorm-container--full">
      <div class="island-item">
        <hero
          title="Profile selection"
          subtitle="Profiles help to organise mods easily"
          heroType="primary"
        />
      </div>
      <div class="island-item">
        <div class="nimbus-stack">
          <div class='nimbus-notification'>
              <div class="nimbus-container nimbus-inline">
                  <i class='fas fa-long-arrow-alt-left margin-right' />
                  <strong><a @click="backToGameSelection">Back to game selection</a></strong>
              </div>
          </div>
          <div class="content">
            <div v-for="(profileName) of profileList" :key="profileName">
              <a @click="setSelectedProfile(profileName, false)">
                <div class="nimbus-container">
                  <div class="border-at-bottom">
                    <div class="nimbus-card">
                      <p
                        :class="['nimbus-card__title', {'has-text-info':activeProfileName === profileName}]"
                      >{{profileName}}</p>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div class="nimbus-container">
            <div class="nimbus-toolbar nimbus-toolbar--center">
              <a id="select-profile" class="button is-info" @click="moveToNextScreen()">Select profile</a>
              <a id="rename-profile-disabled" class="button" v-if="activeProfileName === 'Default'" :disabled="true">Rename</a>
              <a id="rename-profile" class="button" @click="openRenameProfileModal()" v-else>Rename</a>
              <a id="create-profile" class="button" @click="openCreateProfileModal()">Create new</a>
              <a class="button" @click="openImportProfileModal()">Import / Update</a>
              <a class="button is-danger" @click="openDeleteProfileModal()">Delete</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup>
import { Hero } from '../components/all';
import R2Error from '../model/errors/R2Error';
import ManagerSettings from '../r2mm/manager/ManagerSettings';
import DeleteProfileModal from '../components/profiles-modals/DeleteProfileModal.vue';
import RenameProfileModal from '../components/profiles-modals/RenameProfileModal.vue';
import CreateProfileModal from '../components/profiles-modals/CreateProfileModal.vue';
import ImportProfileModal from '../components/profiles-modals/ImportProfileModal.vue';
import { computed, onMounted } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import { useRouter } from 'vue-router';

const store = getStore<State>();
const router = useRouter();

const profileList = computed(() => store.state.profiles.profileList);
const activeProfileName = computed(() => store.getters['profile/activeProfileName']);

function openCreateProfileModal() {
    store.commit('openCreateProfileModal');
}

function openDeleteProfileModal() {
    store.commit('openDeleteProfileModal');
}

function openRenameProfileModal() {
    store.commit('openRenameProfileModal');
}

function openImportProfileModal() {
    store.commit('openImportProfileModal');
}

async function moveToNextScreen() {
    await setSelectedProfile(activeProfileName.value, true);
    await router.push({name: 'manager.installed'});
}

async function setSelectedProfile(profileName: string, prewarmCache: boolean) {
    try {
        await store.dispatch('profiles/setSelectedProfile', { profileName: profileName, prewarmCache: prewarmCache });
    } catch (e) {
        const err = R2Error.fromThrownValue(e, 'Error while selecting profile');
        store.commit('error/handleError', err);
    }
}

async function updateProfileList() {
    try {
        await store.dispatch('profiles/updateProfileList');
    } catch (e) {
        const err = R2Error.fromThrownValue(e, 'Error whilst updating ProfileList');
        store.commit('error/handleError', err);
    }
}

async function backToGameSelection() {
    await ManagerSettings.resetDefaults();
    await router.push({name: "index"});
}

onMounted( async () => {
    console.debug("Profiles view entered with active game", store.state.activeGame.settingsIdentifier);

    const settings = await store.getters.settings;
    await settings.load();

    const lastSelectedProfileName = await store.dispatch('profile/loadLastSelectedProfile');

    // If the view was entered via game selection, the mod list was updated
    // and the cache cleared. The profile is already set in the Vuex store
    // but we want to trigger the cache prewarming. Always doing this for
    // empty profiles is deemed a fair tradeoff. On the other hand there's
    // no point to trigger this when returning from the manager view and the
    // mods are already cached.
    if (store.state.tsMods.cache.size === 0) {
        await setSelectedProfile(lastSelectedProfileName, false);
    }

    await updateProfileList();
})
</script>
