<template>
    <div class="nimbus-scope">
        <ModalCard id="select-platform-modal" v-show="showPlatformModal" :is-active="showPlatformModal" @close-modal="() => {showPlatformModal = false;}" class="z-max z-top">
            <template v-slot:header>
                <h2 class='modal-title'>Which store manages your game?</h2>
            </template>
            <template v-slot:body>
                <div v-if="selectedGame !== null">
                    <div v-for="(platform, index) of selectedGame.storePlatformMetadata" :key="`${index}-${platform.storePlatform}`">
                        <input type="radio" :id="`${index}-${platform.storePlatform}`" :value="platform.storePlatform" v-model="selectedPlatform"/>
                        <label :for="`${index}-${platform.storePlatform}`"><span class="margin-right margin-right--half-width"/>{{ platformLabels[platform.storePlatform] }}</label>
                    </div>
                </div>
            </template>
            <template v-slot:footer>
                <button class='button is-info' @click='selectPlatform'>
                    Select platform
                </button>
            </template>
        </ModalCard>
        <div class="game-selection-container">
            <div class="game-selection-header">
                <div class="game-selection-title">
                    <span class="text-white">Select </span>
                    <span class="text-primary cursor-pointer" @click="toggleGameServer">
                        {{ activeTab.toLowerCase() }}
                        <i class="fas fa-caret-down"></i>
                    </span>
                </div>
                <div class="game-selection-search">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input
                            v-model="filterText"
                            class="search-input"
                            type="text"
                            placeholder="Search..."
                            autocomplete="off"
                        />
                    </div>
                </div>
                <div class="game-selection-view-toggle">
                    <div class="view-toggle-button" :class="{'is-active': viewMode === GameSelectionViewMode.CARD}" @click="viewMode = GameSelectionViewMode.CARD">
                        <i class="fas fa-th-large"></i>
                    </div>
                    <div class="view-toggle-button" :class="{'is-active': viewMode === GameSelectionViewMode.LIST}" @click="viewMode = GameSelectionViewMode.LIST">
                        <i class="fas fa-list"></i>
                    </div>
                </div>
            </div>

            <div class="game-selection-content">
                <div v-if="runningMigration" class="nimbus-notification nimbus-notification--warning nimbus-notification--square margin-bottom">
                    <div class="nimbus-container">
                        <p>An update to the manager has occurred and needs to do background work.</p>
                        <p>The options to select a game are disabled until the work has completed.</p>
                    </div>
                </div>

                <div v-if="favouriteGames.length > 0" class="game-section">
                    <h3 class="title is-4 has-text-white">My games</h3>
                    <div class="game-list" :class="{'is-list-view': viewMode === GameSelectionViewMode.LIST}">
                        <div v-for="(game, index) of favouriteGames" :key="`${index}-${game.displayName}-fav`" class="game-card-wrapper">
                            <div class="game-card" @click="selectGame(game)">
                                <div class="game-card-image">
                                    <img :src="getImageHref(`/images/game_selection/${game.gameImage}`)" alt="Game Logo" />
                                    <div class="game-card-fav" @click.stop="toggleFavourite(game)">
                                        <i class="fas fa-star text-warning"></i>
                                    </div>
                                </div>
                                <div class="game-card-title">{{ game.displayName }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="game-section">
                    <h3 class="title is-4 has-text-white">All games</h3>
                    <div class="game-list" :class="{'is-list-view': viewMode === GameSelectionViewMode.LIST}">
                        <div v-for="(game, index) of nonFavouriteGames" :key="`${index}-${game.displayName}-all`" class="game-card-wrapper">
                            <div class="game-card" @click="selectGame(game)">
                                <div class="game-card-image">
                                    <img :src="getImageHref(`/images/game_selection/${game.gameImage}`)" alt="Game Logo" />
                                    <div class="game-card-fav" @click.stop="toggleFavourite(game)">
                                        <i class="far fa-star"></i>
                                    </div>
                                </div>
                                <div class="game-card-title">{{ game.displayName }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Game from '../model/game/Game';
import GameManager from '../model/game/GameManager';
import { Hero } from '../components/all';
import * as ManagerUtils from '../utils/ManagerUtils';
import ManagerSettings from '../r2mm/manager/ManagerSettings';
import { GameSelectionViewMode } from '../model/enums/GameSelectionViewMode';
import R2Error from '../model/errors/R2Error';
import { GameInstanceType, GameSelectionDisplayMode, Platform } from '../model/schema/ThunderstoreSchema';
import ProviderUtils from '../providers/generic/ProviderUtils';
import ModalCard from '../components/ModalCard.vue';
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import { useRouter } from 'vue-router';
import ProtocolProvider from '../providers/generic/protocol/ProtocolProvider';

const store = getStore<State>();
const router = useRouter();

const runningMigration = ref<boolean>(false);
const selectedGame = shallowRef<Game | null>(null);
const filterText = ref<string>("");
const showPlatformModal = ref<boolean>(false);
const selectedPlatform = ref<Platform | null>(null);
const favourites = ref<string[]>([]);
const settings = shallowRef<ManagerSettings | undefined>(undefined);
const isSettingDefaultPlatform = ref<boolean>(false);
const viewMode = ref<GameSelectionViewMode>(GameSelectionViewMode.LIST);
const activeTab = ref<GameInstanceType>(GameInstanceType.GAME);
const gameImages = reactive({});

const filteredGameList = computed(() => {
    const displayNameInAdditionalSearch = (game: Game, filterText: string): boolean => {
        return game.additionalSearchStrings.find(value => value.toLowerCase().trim().indexOf(filterText.toLowerCase().trim()) >= 0) !== undefined;
    }
    return gameList.value
        .filter(value => value.displayName.toLowerCase().indexOf(
            filterText.value.toLowerCase()) >= 0
            || filterText.value.trim().length === 0
            || displayNameInAdditionalSearch(value, filterText.value))
        .filter(value => value.displayMode === GameSelectionDisplayMode.VISIBLE)
        .filter(value => value.instanceType === activeTab.value);
});

const favouriteGames = computed(() => {
    return filteredGameList.value.filter(game => favourites.value.includes(game.settingsIdentifier));
});

const nonFavouriteGames = computed(() => {
    return filteredGameList.value.filter(game => !favourites.value.includes(game.settingsIdentifier));
});

const gameList = computed<Game[]>(() => {
    return GameManager.gameList.sort((a, b) => {
        if (favourites.value.includes(a.settingsIdentifier)) {
            if (favourites.value.includes(b.settingsIdentifier)) {
                return a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
            } else {
                return -1;
            }
        } else if (favourites.value.includes(b.settingsIdentifier)) {
            return 1;
        }
        return a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
    });
});

function getImageHref(image: string) {
    return ProtocolProvider.getPublicAssetUrl(image);
}

function changeTab(tab: GameInstanceType) {
    activeTab.value = tab;
}

function toggleGameServer() {
    if (activeTab.value === GameInstanceType.GAME) {
        activeTab.value = GameInstanceType.SERVER;
    } else {
        activeTab.value = GameInstanceType.GAME;
    }
}

function markAsSelectedGame(game: Game) {
    selectedGame.value = game;
}

function selectGame(game: Game | null) {
    if (game === null) {
        return;
    }
    selectedGame.value = game;
    isSettingDefaultPlatform.value = false;
    if (game.storePlatformMetadata.length > 1) {
        ManagerSettings.getSingleton(game)
            .then(managerSettings => managerSettings.getLastSelectedPlatform())
            .then(platform => {
                if (platform) {
                    selectedPlatform.value = platform;
                } else {
                    selectedPlatform.value = null;
                }
            });
        showPlatformModal.value = true;
    } else {
        selectedPlatform.value = game.storePlatformMetadata[0]!.storePlatform;
        showPlatformModal.value = false;
        proceed();
    }
}

function selectDefaultGame(game: Game | null) {
    if (game === null) {
        return;
    }
    selectedGame.value = game;
    isSettingDefaultPlatform.value = true;
    if (game.storePlatformMetadata.length > 1) {
        showPlatformModal.value = true;
    } else {
        selectedPlatform.value = game.storePlatformMetadata[0]!.storePlatform;
        showPlatformModal.value = false;
        proceedDefault();
    }
}

const platformLabels = {
    [Platform.STEAM]: "Steam",
    [Platform.STEAM_DIRECT]: "Steam",
    [Platform.EPIC_GAMES_STORE]: "Epic Games Store",
    [Platform.OCULUS_STORE]: "Oculus Store",
    [Platform.ORIGIN]: "Origin / EA Desktop",
    [Platform.XBOX_GAME_PASS]: "Xbox Game Pass",
    [Platform.OTHER]: "Other"
}

function selectPlatform() {
    if (isSettingDefaultPlatform.value) {
        proceedDefault()
    } else {
        proceed();
    }
}

async function proceed() {
    if (runningMigration.value || selectedGame.value === null || selectedPlatform.value === null) {
        return;
    }

    try {
        ProviderUtils.setupGameProviders(selectedGame.value, selectedPlatform.value);
    } catch (error) {
        if (error instanceof R2Error) {
            store.commit('error/handleError', error);
            return;
        }

        throw error;
    }

    const settings = await ManagerSettings.getSingleton(selectedGame.value);
    await settings.setLastSelectedGame(selectedGame.value);
    await settings.setLastSelectedPlatform(selectedPlatform.value);
    await GameManager.activate(selectedGame.value, selectedPlatform.value);
    await store.dispatch("setActiveGame", selectedGame.value);

    await router.push({name: "splash"});
}

async function proceedDefault() {
    if (runningMigration.value || selectedGame.value === null || selectedPlatform.value === null) {
        return;
    }

    const settings = await ManagerSettings.getSingleton(selectedGame.value);
    await settings.setDefaultGame(selectedGame.value);
    await settings.setDefaultStorePlatform(selectedPlatform.value);

    return proceed();
}

function toggleFavourite(game: Game) {
    if (favourites.value.includes(game.settingsIdentifier)) {
        favourites.value = favourites.value.filter(value => value !== game.settingsIdentifier)
    } else {
        favourites.value = [...favourites.value, game.settingsIdentifier];
    }
    if (settings.value !== undefined) {
        settings.value.setFavouriteGames(favourites.value);
    }
}

function isFavourited(game: Game) {
    if (settings.value !== undefined) {
        return favourites.value.includes(game.settingsIdentifier);
    }
}

function isGameSelected(game: Game) {
    return selectedGame.value !== null && selectedGame.value.internalFolderName === game.internalFolderName;
}

function isAnyGameSelected() {
    return selectedGame.value !== null;
}

onMounted(async () => {

    // Check for updates in the background
    window.app.checkForApplicationUpdates()

    runningMigration.value = true;
    await store.dispatch('checkMigrations');
    runningMigration.value = false;

    await store.dispatch('resetLocalState');

    settings.value = await ManagerSettings.getSingleton(GameManager.defaultGame);
    const globalSettings = settings.value.getContext().global;
    favourites.value = globalSettings.favouriteGames || [];
    selectedGame.value = GameManager.findByFolderName(globalSettings.lastSelectedGame) || null;

    switch(globalSettings.gameSelectionViewMode) {
        case GameSelectionViewMode.LIST:
        case GameSelectionViewMode.CARD:
            viewMode.value = globalSettings.gameSelectionViewMode;
            break;
        default:
            viewMode.value = GameSelectionViewMode.CARD;
    }

    // Skip game selection view if valid default game & platform are set.
    const {defaultGame, defaultPlatform} = ManagerUtils.getDefaults(settings.value!);

    if (defaultGame && defaultPlatform) {
        selectedGame.value = defaultGame;
        selectedPlatform.value = defaultPlatform;
        proceed();
    }
})

function toggleViewMode() {
    if (viewMode.value === GameSelectionViewMode.LIST) {
        viewMode.value = GameSelectionViewMode.CARD;
    } else {
        viewMode.value = GameSelectionViewMode.LIST;
    }
    if (settings.value !== undefined) {
        settings.value.setGameSelectionViewMode(viewMode.value);
    }
}

function capitalize(str: string) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}
</script>


<style lang="scss" scoped>
.game-selection-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    // background-color: var(--background-color); // Assuming global styles handle this
}

.game-selection-header {
    display: flex;
    align-items: center;
    padding: 1.5rem 2.5rem;
    gap: 1.5rem; // Reduced gap to match Figma
}

.game-selection-title {
    font-size: 36px; // Figma: 36px
    font-weight: 700; // Figma: Bold
    flex-shrink: 0;
    letter-spacing: 0;
    line-height: normal;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .text-white {
        color: #f5f5f6;
    }
}

.game-selection-search {
    flex-grow: 0; // Don't grow indefinitely
    width: 272px; // Figma: 272px

    .search-container {
        display: flex;
        align-items: center;
        background-color: rgba(59, 63, 125, 0.24); // Figma: var(--input/bg-color--default)
        border: 1px solid rgba(70, 70, 149, 0.66); // Figma: var(--input/border-color--default)
        border-radius: 8px; // Figma: 8px
        height: 36px; // Figma: 36px
        padding: 0 16px; // Figma: 16px
        transition: border-color 0.2s;

        &:focus-within {
            border-color: #23ffab;
        }

        .search-icon {
            color: #a7aed2; // Figma: var(--input/icon-color--default)
            margin-right: 16px; // Figma: gap 16px
            font-size: 16px;
        }

        .search-input {
            background: transparent;
            border: none;
            color: #f5f5f6;
            flex-grow: 1;
            height: 100%;
            outline: none;
            font-size: 14px; // Figma: 14px
            font-family: 'Inter', sans-serif;
            
            &::placeholder {
                color: #a7aed2; // Figma: var(--input/placeholder-color)
            }
        }
    }
}

.game-selection-view-toggle {
    display: flex;
    gap: 2px; // Figma: 2px
    margin-left: auto; // Keep it pushed to the right? Figma shows it next to search?
    // Actually Figma shows [Title] [Search] [Toggle] all left aligned with gaps?
    // "Select game" is flex-1? No.
    // Let's keep margin-left: auto for now unless Figma shows otherwise.
    // Figma: [Title] [Search] [Toggle] are in a row.
    // Wait, Figma structure: [Title + Dropdown] (flex-1) ... [Search] [Toggle]
    // No, Figma structure:
    // div (flex, w-full)
    //   div (flex-1) -> Title "Select game"
    //   Input (w-[272px])
    //   list-type (toggle)
    
    // So Title takes available space?
    // Let's check the Figma code again.
    // <div className="content-stretch flex gap-[8px] h-[44px] items-center relative shrink-0 w-full">
    //   <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-start ..."> -> Title
    //   <Input ... w-[272px] />
    //   <div ... list-type>
    
    // So Title area grows. Search and Toggle are fixed width on the right?
    // Wait, flex-[1_0_0] on Title means it takes remaining space.
    // So layout is: [Title Area -----------------] [Search] [Toggle]
    // My current layout is: [Title] [Search (grow)] [Toggle]
    // I should change it to match Figma.
}

.game-selection-view-toggle {
    display: flex;
    gap: 2px;
    background-color: transparent;
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
}

.view-toggle-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    background-color: rgba(70, 70, 149, 0.66); // Figma: Secondary default
    color: #c6c3ff; // Figma: Accent text

    &:hover {
        background-color: #6c44da; // Figma: Primary hover
        color: #f5f5f6;
    }

    &.is-active {
        background-color: #6c44da; // Figma: Primary hover (used as active here)
        color: #f5f5f6;
    }
    
    i {
        font-size: 16px;
    }
}

.game-selection-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 0 2.5rem 2.5rem 2.5rem; // Match header padding
}

.game-section {
    margin-bottom: 40px; // Figma: gap 40px
    
    .title.is-4 {
        font-size: 20px; // Figma: 20px
        font-weight: 700;
        color: #f5f5f6;
        margin-bottom: 24px; // Figma: gap 24px
    }
}

.game-list {
    display: flex;
    flex-wrap: wrap;
    gap: 40px 16px; // Figma: 40px row, 16px col

    &.is-list-view {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .game-card-wrapper {
            width: 100%;
            max-width: none;
        }

        .game-card {
            flex-direction: row;
            align-items: center;
            height: auto;
            padding: 0.5rem;
            border-radius: 4px;

            &:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }

            .game-card-image {
                width: 40px;
                height: 53px;
                margin-right: 1rem;
                margin-bottom: 0;
            }
        }
    }
}

.game-card-wrapper {
    flex: 1 0 0; // Figma: flex-[1_0_0]
    min-width: 146px; // Figma: min-w-[146px]
    max-width: 162px; // Figma: max-w-[162px]
}

.game-card {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.2s;
    width: 100%;
    
    &:hover {
        transform: translateY(-4px);
        
        .game-card-image {
            // box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
            // border: 1px solid #23ffab;
        }

        .game-card-title {
            // color: #fff;
            // text-shadow: 0 0 10px rgba(35, 255, 171, 0.5);
        }
    }
}

.game-card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 200/266.66; // Figma aspect ratio
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px; // Figma: gap 12px
    background-color: rgba(59, 63, 125, 0.24); // Figma: surface/a4
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.game-card-fav {
    position: absolute;
    top: 8px; // Figma: 8px
    left: 8px; // Figma: 8px
    width: 32px; // Figma: 32px
    height: 32px; // Figma: 32px
    background-color: rgba(0, 0, 0, 0.5); // Figma: bg
    border-radius: 8px; // Figma: 8px
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f5f5f6;
    opacity: 0;
    transition: opacity 0.2s;
    backdrop-filter: none; // Figma doesn't specify blur

    .game-card:hover & {
        opacity: 1;
    }
    
    i {
        font-size: 16px; // Adjust icon size
    }
}

.game-card-title {
    font-weight: 700; // Figma: Bold
    font-size: 14px; // Figma: 14px
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left; // Figma: left
    color: #f5f5f6; // Figma: text/primary
    width: 100%;
}

.text-primary {
    color: #23ffab !important; // Cyber green from design
}

.cursor-pointer {
    cursor: pointer;
}
</style>
