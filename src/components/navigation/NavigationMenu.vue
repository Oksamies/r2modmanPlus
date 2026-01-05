<template>
    <div class="navigation-menu island-item" :class="{ 'is-collapsed': isCollapsed }">
        <div class="menu-content">
            <!-- Game Selection Mode -->
            <template v-if="isGameSelection">
                <!-- Empty in Figma design for Game Selection -->
            </template>

            <!-- Active Game Mode -->
            <template v-else>
                <!-- Game Header (Top) -->
                <div class="game-header" v-if="!isCollapsed">
                    <div class="game-icon-container">
                        <img :src="ProtocolProvider.getPublicAssetUrl(`/images/game_selection/${activeGame.gameImage}`)" alt="Game icon"/>
                    </div>
                    <div class="game-info">
                        <p class="game-title">{{ activeGame.displayName }}</p>
                        <a href="#" @click.prevent="changeGame" class="change-game-link">Change game</a>
                    </div>
                </div>
                <div class="game-header-collapsed" v-else>
                     <div class="game-icon-container" @click="changeGame" title="Change game">
                        <img :src="ProtocolProvider.getPublicAssetUrl(`/images/game_selection/${activeGame.gameImage}`)" alt="Game icon"/>
                    </div>
                </div>

                <!-- Launch Buttons (Preserved functionality) -->
                <div class="menu-section launch-section">
                    <ul class="menu-list">
                        <li>
                            <a href="#" @click.prevent="launchGame(LaunchMode.MODDED)" class="menu-link" title="Start Modded">
                                <i class="fas fa-play icon-margin-right text-primary"/>
                                <span v-if="!isCollapsed">Start Modded</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" @click.prevent="launchGame(LaunchMode.VANILLA)" class="menu-link" title="Start Vanilla">
                                <i class="far fa-play-circle icon-margin-right"/>
                                <span v-if="!isCollapsed">Start Vanilla</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Main Navigation -->
                <div class="menu-section">
                    <ul class="menu-list">
                        <li>
                            <router-link :to="{name: 'manager.installed'}" class="menu-link" title="Home">
                                <i class="fas fa-home icon-margin-right" />
                                <span v-if="!isCollapsed">Home</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'manager.installed'}" class="menu-link" title="My Mods">
                                <i class="fas fa-box icon-margin-right" />
                                <span v-if="!isCollapsed">My Mods</span>
                                <span v-if="!isCollapsed" class="tag is-small is-dark margin-left-auto">{{localModCount}}</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'manager.online'}" class="menu-link" :class="{'is-active': $route.name === 'downloads'}" title="Get Mods">
                                <i class="fas fa-download icon-margin-right" />
                                <span v-if="!isCollapsed">Get Mods</span>
                            </router-link>
                        </li>
                         <li>
                            <router-link :to="{name: 'config-editor'}" class="menu-link" title="Edit Config">
                                <i class="fas fa-edit icon-margin-right" />
                                <span v-if="!isCollapsed">Edit Config</span>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </template>
        </div>

        <!-- Footer Actions -->
        <div class="menu-footer">
            <ul class="menu-list">
                <li>
                    <router-link :to="{name: 'help'}" class="menu-link" title="Help">
                        <i class="fas fa-question-circle icon-margin-right" />
                        <span v-if="!isCollapsed">Help</span>
                    </router-link>
                </li>
                <li>
                    <router-link :to="{name: 'manager.settings'}" class="menu-link" title="Settings">
                        <i class="fas fa-cog icon-margin-right" />
                        <span v-if="!isCollapsed">Settings</span>
                    </router-link>
                </li>
                <li>
                    <a href="#" class="menu-link" title="Log In">
                        <i class="fas fa-user-circle icon-margin-right" />
                        <span v-if="!isCollapsed">Log In</span>
                    </a>
                </li>
                <li>
                    <a href="#" @click.prevent="toggleCollapse" class="menu-link" title="Collapse Menu">
                        <i class="fas icon-margin-right" :class="isCollapsed ? 'fa-angle-right' : 'fa-angle-left'" />
                        <span v-if="!isCollapsed">Collapse menu</span>
                    </a>
                </li>
            </ul>
            <div class="version-info" v-if="!isCollapsed">
                2.1.0
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import R2Error from '../../model/errors/R2Error';
import Game from '../../model/game/Game';
import Profile from '../../model/Profile';
import {
    LaunchMode,
    launch,
    linkProfileFiles,
    setGameDirIfUnset,
    throwIfNoGameDir
 } from '../../utils/LaunchUtils';
import { computed, ref } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import { useRouter, useRoute } from 'vue-router';
import ProtocolProvider from '../../providers/generic/protocol/ProtocolProvider';

const store = getStore<State>();
const router = useRouter();
const route = useRoute();

const activeGame = computed<Game>(() => store.state.activeGame);
const profile = computed<Profile>(() => store.getters['profile/activeProfile']);
const localModCount = computed<number>(() => store.state.profile.modList.length);

const isGameSelection = computed(() => route.name === 'index');
const isCollapsed = ref(false);

const thunderstoreModCount = computed(() =>
    store.state.modFilters.showDeprecatedPackages
        ? store.state.tsMods.mods.length
        : store.getters['tsMods/undeprecatedModCount']
);

function openProfileManagementModal() {
    store.commit("openProfileManagementModal");
}

function changeGame() {
    router.push({name: 'index'});
}

function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value;
}

async function launchGame(mode: LaunchMode) {
    try {
        await setGameDirIfUnset(activeGame.value);
        await throwIfNoGameDir(activeGame.value);

        if (mode === LaunchMode.MODDED) {
            await linkProfileFiles(activeGame.value, profile.value.asImmutableProfile());
        }

        store.commit("openGameRunningModal");
        await launch(activeGame.value, profile.value, mode);
    } catch (error) {
        store.commit("closeGameRunningModal");
        store.commit("error/handleError", R2Error.fromThrownValue(error));
    }
}
</script>

<style lang="scss" scoped>
.navigation-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem 0.5rem;
    /* background-color: var(--island-bg-color, #101028); */ /* Handled by island-item */
    color: var(--color-text-secondary, #cbd0ec);
    transition: width 0.3s ease;
    width: 240px;
    /* border-radius: 0 8px 8px 0; */ /* Handled by island-item */
    
    &.is-collapsed {
        width: 68px;
        padding: 1rem 0.25rem;
        
        .menu-link {
            justify-content: center;
            padding: 0.5rem;
        }
        
        .icon-margin-right {
            margin-right: 0;
        }
    }
}

.menu-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.menu-section {
    margin-bottom: 1rem;
}

.menu-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
        margin-bottom: 0.25rem;
    }
}

.menu-link, a {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    color: var(--color-text-secondary, #cbd0ec);
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;
    white-space: nowrap;
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
    }
    
    &.router-link-active, &.is-active {
        background-color: rgba(67, 67, 132, 0.32); /* Match Figma active state if possible, or keep this nice blue */
        color: white;
        font-weight: 600;
    }
}

.icon-margin-right {
    margin-right: 1rem;
    width: 1.25rem;
    text-align: center;
    font-size: 1.1rem;
    color: #a7aed2; /* Match Figma icon color */
}

.margin-left-auto {
    margin-left: auto;
}

.text-primary {
    color: #23ffab !important;
}

.menu-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Game Header Styles */
.game-header {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin-bottom: 1.5rem;
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
}

.game-header-collapsed {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
    cursor: pointer;
}

.game-icon-container {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.game-info {
    margin-left: 1rem;
    overflow: hidden;
}

.game-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #f5f5f6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.1rem;
}

.change-game-link {
    font-size: 0.75rem;
    color: #a7aed2;
    text-decoration: none;
    
    &:hover {
        text-decoration: underline;
        color: white;
    }
}

.version-info {
    text-align: center;
    font-size: 0.7rem;
    color: #a7aed2;
    margin-top: 1rem;
}

.launch-section {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
}
</style>
