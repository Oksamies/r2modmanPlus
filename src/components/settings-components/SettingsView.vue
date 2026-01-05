<template>
    <div id="settings-view" class="settings-layout">
        <div class="settings-sidebar">
            <div class="sidebar-nav">
                <div
                    v-for="tab in tabs"
                    :key="tab.id"
                    class="nav-item"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                >
                    <div class="nav-item-inner">
                        <i :class="tab.icon"></i>
                        <span>{{ tab.label }}</span>
                    </div>
                    <div class="active-indicator" v-if="activeTab === tab.id"></div>
                </div>
            </div>
        </div>

        <div class="settings-content">
            <div class="search-container">
                <div class="search-bar">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" v-model="search" placeholder="Search for a setting..." />
                </div>
            </div>

            <div class="content-scroll">
                <h2 class="section-title">{{ activeTabLabel }}</h2>

                <!-- General Tab -->
                <div v-if="activeTab === 'general'" class="settings-section">
                    <SettingsSelect
                        title="Startup screen"
                        description="Select startup screen between game selection or last selected game"
                        :modelValue="startupScreen"
                        :options="[
                            { label: 'Game selection', value: 'game_selection' },
                            { label: 'Last selected game', value: 'last_selected' }
                        ]"
                        @update:modelValue="updateStartupScreen"
                    />
                    <div class="divider"></div>
                    <SettingsSwitch
                        title="Show sidebar"
                        description="Show or hide game graphics sidebar. Hiding requires premium subscription."
                        v-model="showSidebar"
                    />
                </div>

                <!-- Other Tabs (Using existing SettingsItem for now) -->
                <div v-else class="settings-section">
                    <SettingsItem v-for="(key, _) in getFilteredSettings()" :key="`setting-${key.action}`"
                                  :action="key.action"
                                  :description="key.description"
                                  :value="key.value"
                                  :icon="key.icon"
                                  @click="key.clickAction()"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue';
import SettingsItem from './SettingsItem.vue';
import SettingsSwitch from './SettingsSwitch.vue';
import SettingsSelect from './SettingsSelect.vue';
import SettingsRow from '../../model/settings/SettingsRow';
import ManagerSettings from '../../r2mm/manager/ManagerSettings';
import GameDirectoryResolverProvider from '../../providers/ror2/game/GameDirectoryResolverProvider';
import R2Error from '../../model/errors/R2Error';
import PathResolver from '../../r2mm/manager/PathResolver';
import LogOutputProvider from '../../providers/ror2/data/LogOutputProvider';
import VersionNumber from '../../model/VersionNumber';
import ManagerInformation from '../../_managerinf/ManagerInformation';
import ProfileModList from '../../r2mm/mods/ProfileModList';
import { Platform } from '../../model/schema/ThunderstoreSchema';
import moment from 'moment';
import CdnProvider from '../../providers/generic/connection/CdnProvider';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import VueRouter from 'vue-router';
import { getLaunchType, LaunchType } from "../../model/real_enums/launch/LaunchType";
import { LaunchTypeModalOpen } from "../../components/modals/launch-type/LaunchTypeRefs";
import appWindow from '../../providers/node/app/app_window';

const store = getStore<State>();
let router!: VueRouter;

onMounted(() => {
    router = getCurrentInstance()!.proxy.$router;
})

const activeTab = ref('general');
const search = ref('');
const tabs = [
    { id: 'general', label: 'General', icon: 'fas fa-cog' },
    { id: 'locations', label: 'Locations', icon: 'fas fa-folder-open' },
    { id: 'cache', label: 'Cache', icon: 'fas fa-hdd' },
    { id: 'profiles', label: 'Profiles', icon: 'fas fa-users' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-user-secret' },
    { id: 'about', label: 'About', icon: 'fas fa-info-circle' },
    { id: 'account', label: 'Account', icon: 'fas fa-user-circle' },
    { id: 'game', label: 'Game', icon: 'fas fa-gamepad' },
];

const activeTabLabel = computed(() => tabs.find(t => t.id === activeTab.value)?.label || 'Settings');

const logOutput = ref<LogOutputProvider>(LogOutputProvider.instance);
const managerVersionNumber = ref<VersionNumber>(ManagerInformation.VERSION);
const searchableSettings = ref<SettingsRow[]>([]);

const activeGame = computed(() => store.state.activeGame);
const settings = computed(() => store.getters['settings']);
const localModList = computed(() => store.state.profile.modList);
const appName = computed(() => ManagerInformation.APP_NAME);

// General Tab State
const startupScreen = ref('game_selection');
const showSidebar = ref(true);

// Initialize General Tab State
onMounted(async () => {
    const settingsInstance = await ManagerSettings.getSingleton(activeGame.value);
    const context = settingsInstance.getContext();
    startupScreen.value = context.global.defaultGame ? 'last_selected' : 'game_selection';
    showSidebar.value = settingsInstance.getShowSidebar();
});

watch(showSidebar, async (newValue) => {
    const settingsInstance = await ManagerSettings.getSingleton(activeGame.value);
    await settingsInstance.setShowSidebar(newValue);
});

async function updateStartupScreen(value: string | number | null) {
    startupScreen.value = value as string;
    const settingsInstance = await ManagerSettings.getSingleton(activeGame.value);
    if (value === 'last_selected') {
        await settingsInstance.setDefaultGame(activeGame.value);
    } else {
        await settingsInstance.setDefaultGame(undefined);
    }
}

// Existing Settings Logic
let settingsList = [
    new SettingsRow(
        'Locations',
        'Browse data folder',
        'Open the folder where mods are stored for all games and profiles.',
        async () => PathResolver.ROOT,
        'fa-door-open',
        () => {
            emitInvoke('BrowseDataFolder');
        }
    ),
    new SettingsRow(
        'Locations',
        `Change ${activeGame.value.displayName} folder`,
        `Change the location of the ${activeGame.value.displayName} folder that ${appName.value} uses.`,
        async () => {
            if (settings.value.getContext().gameSpecific.gameDirectory !== null) {
                const directory = await GameDirectoryResolverProvider.instance.getDirectory(activeGame.value);
                if (!(directory instanceof R2Error)) {
                    return directory;
                }
            }
            return 'Please set manually';
        },
        'fa-folder-open',
        () => {
            if (Platform.XBOX_GAME_PASS == activeGame.value.activePlatform.storePlatform) {
                emitInvoke('ChangeGameDirectoryGamePass');
            }
            else {
                emitInvoke('ChangeGameDirectory');
            }
        }
    ),
    new SettingsRow(
        'Locations',
        'Browse profile folder',
        'Open the folder where mods are stored for the current profile.',
        async () => {
            return store.getters['profile/activeProfile'].getProfilePath();
        },
        'fa-door-open',
        () => emitInvoke('BrowseProfileFolder')
    ),
    new SettingsRow(
        'Locations',
        'Change data folder',
        'Change the folder where mods are stored for all games and profiles. The folder will not be deleted, and existing profiles will not carry across.',
        async () => {
            return PathResolver.ROOT;
        },
        'fa-folder-open',
        () => emitInvoke('ChangeDataFolder')
    ),
    new SettingsRow(
        'Cache', // Mapped from Debugging
        'Toggle download cache',
        'Downloading a mod will ignore mods stored in the cache. Mods will still be placed in the cache.',
        async () => {
            return store.state.download.ignoreCache
                ? 'Current: cache is disabled'
                : 'Current: cache is enabled (recommended)';
        },
        'fa-exchange-alt',
        () => emitInvoke('ToggleDownloadCache')
    ),
    new SettingsRow(
        'Game', // Mapped from Debugging
        'Set launch parameters',
        'Provide custom arguments used to start the game.',
        async () => 'These commands are used against the Steam executable on game startup',
        'fa-wrench',
        () => emitInvoke('SetLaunchParameters')
    ),
    new SettingsRow(
        'Cache', // Mapped from Debugging
        'Clean mod cache',
        'Free extra space caused by cached mods that are not currently in a profile.',
        async () => 'Check all profiles for unused mods and clear cache',
        'fa-trash',
        () => emitInvoke('CleanCache')
    ),
    new SettingsRow(
        'Cache', // Mapped from Debugging
        'Clean online mod list',
        'Deletes local copy of mod list, forcing the next refresh to fetch a new one.',
        async () => store.dispatch('tsMods/getActiveGameCacheStatus'),
        'fa-trash',
        () => store.dispatch('tsMods/resetActiveGameCache')
    ),
    new SettingsRow(
        'Cache', // Mapped from Debugging
        'Toggle preferred Thunderstore CDN',
        'Switch the CDN until app is restarted. This might bypass issues with downloading mods.',
        async () => `Current: ${CdnProvider.current.label} (${CdnProvider.current.url})`,
        'fa-exchange-alt',
        CdnProvider.togglePreferredCdn
    ),
    new SettingsRow(
        'Profiles', // Mapped from Profile
        'Change profile',
        'Change the mod profile.',
        async () => {
            return `Current profile: ${store.getters['profile/activeProfile'].getProfileName()}`
        },
        'fa-file-import',
        () => emitInvoke('ChangeProfile')
    ),
    new SettingsRow(
        'Profiles',
        'Enable all mods',
        'Enable all mods for the current profile',
        async () => `${localModList.value.length - ProfileModList.getDisabledModCount(localModList.value)}/${localModList.value.length} enabled`,
        'fa-file-import',
        () => emitInvoke('EnableAll')
    ),
    new SettingsRow(
        'Profiles',
        'Disable all mods',
        'Disable all mods for the current profile',
        async () => `${ProfileModList.getDisabledModCount(localModList.value)}/${localModList.value.length} disabled`,
        'fa-file-import',
        () => emitInvoke('DisableAll')
    ),
    new SettingsRow(
        'Profiles',
        'Import local mod',
        'Install a mod offline from your files.',
        async () => 'Not all mods can be installed locally',
        'fa-file-import',
        () => store.commit("openLocalFileImportModal")
    ),
    new SettingsRow(
        'Profiles',
        'Export profile as a file',
        'Export your mod list and configs as a file.',
        async () => 'The exported file can be shared with friends to get an identical profile quickly and easily',
        'fa-file-export',
        () => store.dispatch("profileExport/exportProfileAsFile")
    ),
    new SettingsRow(
        'Profiles',
        'Export profile as a code',
        'Export your mod list and configs as a code.',
        async () => 'The exported code can be shared with friends to get an identical profile quickly and easily',
        'fa-file-export',
        () => store.dispatch("profileExport/exportProfileAsCode")
    ),
    new SettingsRow(
        'Profiles',
        'Update all mods',
        'Quickly update every installed mod to their latest versions.',
        async () => {
            const outdatedMods = store.getters['profile/modsWithUpdates'];
            if (outdatedMods.length === 1) {
                return "1 mod has an update available";
            }
            return `${outdatedMods.length} mods have an update available`;
        },
        'fa-cloud-upload-alt',
        () => emitInvoke('UpdateAllMods')
    ),
    new SettingsRow(
        'About', // Mapped from Other
        'Toggle funky mode',
        'Enable/disable funky mode.',
        async () => {
            return settings.value.getContext().global.funkyModeEnabled
                ? 'Current: enabled'
                : 'Current: disabled (default)';
        },
        'fa-exchange-alt',
        () => emitInvoke('ToggleFunkyMode')
    ),
    new SettingsRow(
        'About', // Mapped from Other
        'Switch theme',
        'Switch between light and dark themes.',
        async () => {
            return settings.value.getContext().global.darkTheme
                ? 'Current: dark theme'
                : 'Current: light theme (default)';
        },
        'fa-exchange-alt',
        () => emitInvoke('SwitchTheme')
    ),
    new SettingsRow(
        'About', // Mapped from Other
        'Switch card display type',
        'Switch between expanded or collapsed cards.',
        async () => {
            return settings.value.getContext().global.expandedCards
                ? 'Current: expanded'
                : 'Current: collapsed (default)';
        },
        'fa-exchange-alt',
        () => emitInvoke('SwitchCard')
    ),
    new SettingsRow(
        'Cache', // Mapped from Other
        'Refresh online mod list',
        'Check for any new mod releases.',
        async () => {
                if (store.state.tsMods.isThunderstoreModListUpdateInProgress) {
                    return store.state.tsMods.thunderstoreModListUpdateStatus || "Refreshing...";
                }
                if (store.state.tsMods.thunderstoreModListUpdateError) {
                    return `Error refreshing the mod list: ${store.state.tsMods.thunderstoreModListUpdateError.message}`;
                }
                if (store.getters['download/activeDownloadCount'] > 0) {
                    return "Refreshing the mod list is disabled while there are active downloads.";
                }
                if (store.state.tsMods.modsLastUpdated !== undefined) {
                    return "Cache date: " + moment(store.state.tsMods.modsLastUpdated).format("MMMM Do YYYY, h:mm:ss a");
                }
                return "No API information available";
            },
        'fa-exchange-alt',
        async () => await store.dispatch("tsMods/syncPackageList")
    ),
    new SettingsRow(
      'Game', // Mapped from Other
      'Change game',
      'Change the current game',
      async () => "",
        'fa-gamepad',
        async () => {
            await ManagerSettings.resetDefaults();
            await router.push({name: 'index'});
        }
    ),
    new SettingsRow(
        'About', // Mapped from Modpacks
        'Show dependency strings',
        'View a list of installed mods with their version strings. Used inside the dependencies array inside the manifest.json file.',
        async () => `Show dependency strings for ${localModList.value.length} mod(s)`,
        'fa-file-alt',
        () => emitInvoke('ShowDependencyStrings')
    ),
    // Debugging items mapped to About/Game
    new SettingsRow(
        'About',
        'Copy log file contents to clipboard',
        'Copy the text inside the LogOutput.log file to the clipboard, with Discord formatting.',
        async () => logOutput.value.exists ? 'Log file exists' : 'Log file does not exist',
        'fa-clipboard',
        () => {
            if (logOutput.value.exists) {
                emitInvoke('CopyLogToClipboard')
            }
        }
    ),
    new SettingsRow(
        'About',
        'Copy troubleshooting information to clipboard',
        'Copy settings and other information to the clipboard, with Discord formatting.',
        async () => 'Share this information when requesting support on Discord.',
        'fa-clipboard',
        () => emitInvoke('CopyTroubleshootingInfoToClipboard')
    ),
];

watch(search, () => {
    searchableSettings.value = settingsList
        .filter(value =>
            value.action.toLowerCase().indexOf(search.value.toLowerCase()) >= 0
            || value.description.toLowerCase().indexOf(search.value.toLowerCase()) >= 0);
});

function getFilteredSettings() {
    if (search.value.trim() !== '') {
        return searchableSettings.value;
    }
    return settingsList.filter(value => value.group.toLowerCase() === activeTab.value.toLowerCase())
        .sort((a, b) => a.action.localeCompare(b.action));
}

onMounted(async () => {
    if ([Platform.STEAM, Platform.STEAM_DIRECT].includes(activeGame.value.activePlatform.storePlatform)) {
        settingsList.push(
            new SettingsRow(
                'Locations',
                'Change Steam folder',
                `Change the location of the Steam folder that ${appName.value} uses.`,
                async () => {
                    if (settings.value.getContext().global.steamDirectory !== null) {
                        const directory = await GameDirectoryResolverProvider.instance.getSteamDirectory();
                        if (!(directory instanceof R2Error)) {
                            return directory;
                        }
                    }
                    return 'Please set manually';
                },
                'fa-folder-open',
                () => emitInvoke('ChangeSteamDirectory')
            ),
            new SettingsRow(
                'Game', // Mapped from Debugging
                `Reset ${activeGame.value.displayName} installation`,
                'Fix problems caused by corrupted files or files left over from manual modding attempts.',
                async () => `This will delete all contents of the ${activeGame.value.steamFolderName} folder, and verify the files through Steam`,
                'fa-wrench',
                () => emitInvoke('ValidateSteamInstallation')
            )
        )
    }

    if (['linux', 'darwin'].includes(appWindow.getPlatform()) && activeGame.value.activePlatform.storePlatform === Platform.STEAM) {
        settingsList.push(
            new SettingsRow(
                'Game', // Mapped from Debugging
                'Change launch behaviour',
                'Select specific launch behaviour such as forcing Steam to launch with Proton',
                async () => {
                    const launchType = await getLaunchType(activeGame.value);
                    return `The current launch behaviour is set to: ${launchType}`;
                },
                'fa-gamepad',
                () => {
                    LaunchTypeModalOpen.value = true;
                }
            )
        );
    }
    settingsList = settingsList.sort((a, b) => a.action.localeCompare(b.action));
    searchableSettings.value = settingsList;

    const gameDirectory = await GameDirectoryResolverProvider.instance.getDirectory(activeGame.value);
    if (!(gameDirectory instanceof R2Error)) {
        await settings.value.setGameDirectory(gameDirectory);
    }

    const steamDirectory = await GameDirectoryResolverProvider.instance.getSteamDirectory();
    if (!(steamDirectory instanceof R2Error)) {
        await settings.value.setSteamDirectory(steamDirectory);
    }
});

const emits = defineEmits<{
    (e: 'setting-invoked', setting: string): void;
}>();

function emitInvoke(invoked: string) {
    emits('setting-invoked', invoked);
}

</script>

<style lang="scss" scoped>
#settings-view {
    width: 100%;
    height: 100%;
    display: flex;
    background-color: #101028;
    color: #f5f5f6;
    border-radius: 8px;
    overflow: hidden;
}

.settings-sidebar {
    width: 240px;
    background-color: #101028;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #29295b;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.nav-item {
    position: relative;
    cursor: pointer;
    height: 44px;
    display: flex;
    align-items: center;
}

.nav-item-inner {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px;
    width: 100%;
    border-radius: 8px;
    color: #a7aed2;
    transition: background-color 0.2s, color 0.2s;

    i {
        width: 20px;
        text-align: center;
        font-size: 20px;
    }

    span {
        font-weight: bold;
        font-size: 14px;
    }
}

.nav-item.active .nav-item-inner {
    background: linear-gradient(90deg, #623bce 0%, #4136a1 100%);
    color: #f5f5f6;
}

.active-indicator {
    position: absolute;
    left: -8px;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #23ffab;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
}

.settings-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 48px;
    overflow: hidden;
}

.search-container {
    margin-bottom: 24px;
    max-width: 960px;
}

.search-bar {
    display: flex;
    align-items: center;
    background-color: rgba(59, 63, 125, 0.24);
    border: 1px solid rgba(70, 70, 149, 0.66);
    border-radius: 8px;
    padding: 12px 16px;
    gap: 16px;
    height: 40px;

    .search-icon {
        color: #a7aed2;
        font-size: 16px;
    }

    input {
        background: transparent;
        border: none;
        color: #f5f5f6;
        font-size: 14px;
        width: 100%;
        outline: none;

        &::placeholder {
            color: #a7aed2;
        }
    }
}

.content-scroll {
    flex: 1;
    overflow-y: auto;
    max-width: 960px;
}

.section-title {
    font-size: 20px;
    font-weight: bold;
    color: #23ffab;
    margin-bottom: 24px;
}

.settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.divider {
    height: 1px;
    background-color: rgba(61, 61, 127, 0.44);
    width: 100%;
    margin: 8px 0;
}
</style>
