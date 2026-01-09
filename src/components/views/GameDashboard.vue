<template>
  <div class="island-item dashboard-wrapper">
    <div class="game-cover-card">
      <div class="game-image-wrapper">
         <img 
            :src="community?.cover_image_url || community?.hero_image_url || activeGame.gameImage" 
            alt="Game Art" 
            class="game-hero-img" 
            v-if="community || (activeGame && activeGame.gameImage)" 
         />
         <div v-else class="game-hero-placeholder"></div>
      </div>
    </div>
    <div class="dashboard-content">
      <!-- Left Column: Launch & Status -->
      <div class="launch-column">
        <!-- Game Cover -->

        <div class="launch-helpers">
           <!-- Conflicts Card -->
           <div class="status-card warning" v-if="conflictsCount > 0">
              <div class="status-card-content">
                  <div class="status-icon"><i class="fas fa-exclamation-triangle"></i></div>
                  <div class="status-text">
                      <span class="status-count">{{ conflictsCount }}</span> unresolved conflicts
                  </div>
                  <button class="btn-small is-primary" @click="fixConflicts">Fix</button>
              </div>
           </div>

           <!-- Updates Card -->
           <div class="status-card info" v-if="updatesCount > 0">
              <div class="status-card-content">
                  <div class="status-icon"><i class="fas fa-download"></i></div>
                  <div class="status-text">
                      <span class="status-count">{{ updatesCount }}</span> updates available
                  </div>
                  <button class="btn-small is-primary" @click="updateAll">Update all</button>
              </div>
           </div>
        </div>

        <div class="launch-area">
           <div class="launch-group">
                <button class="launch-main" @click="launchModded">
                    <i class="fas fa-play"></i>
                    <span>Play modded</span>
                </button>
                <div class="relative">
                    <button class="launch-caret" @click.stop="toggleMenu('launch')">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div v-if="activeMenu === 'launch'" class="dropdown-menu">
                        <div class="dropdown-item" @click="launchVanilla">
                            <i class="fas fa-play"></i> Play vanilla
                        </div>
                    </div>
                </div>
           </div>
        </div>
      </div>

      <!-- Middle Column: Profile & Mods -->
      <div class="profile-column">
        <div class="profile-header-strip">
            <!-- Profile Selector -->
            <div class="profile-select-container dropdown-container relative">
                <button class="profile-select-btn" @click.stop="!isDownloading && toggleMenu('profile')" :title="isDownloading ? 'Cannot change profile while downloading' : ''" :class="{ 'disabled': isDownloading }">
                    <div class="profile-text-group">
                        <span class="label-tiny">PROFILE</span>
                        <span class="label-name">{{ activeProfileName }}</span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div v-if="activeMenu === 'profile'" class="profile-dropdown-wrapper">
                    <DropdownProfiles />
                </div>
            </div>

            <!-- Profile Actions -->
            <div class="profile-actions-group">
                <div class="relative dropdown-container">
                    <button class="action-icon-btn" @click.stop="!isDownloading && toggleMenu('manageProfile')" :title="isDownloading ? 'Cannot manage profile while downloading' : 'Manage profile'" :class="{ 'disabled': isDownloading }">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <DropdownProfileMenuLite
                        v-if="activeMenu === 'manageProfile'"
                        @rename="handleAction('rename')"
                        @share="handleAction('share')"
                        @backup="handleAction('backup')"
                        @clone="handleAction('clone')"
                        @sync="handleAction('sync')"
                        @delete="handleAction('delete')"
                        @export-file="handleAction('export-file')"
                        @export-code="handleAction('export-code')"
                    />
                </div>
                <div class="relative dropdown-container">
                    <button class="action-icon-btn" @click.stop="!isDownloading && toggleMenu('addProfile')" :title="isDownloading ? 'Cannot add profile while downloading' : 'Add profile'" :class="{ 'disabled': isDownloading }">
                        <i class="fas fa-plus"></i>
                    </button>
                    <DropdownProfileMenuNew
                        v-if="activeMenu === 'addProfile'"
                        @new-profile="handleAction('new-profile')"
                        @import-profile="handleAction('import-profile')"
                    />
                </div>
            </div>
        </div>

        <!-- Mod List -->
        <div class="mod-list-panel">
            <div class="mod-list-header-row">
                <div class="header-col col-mod">
                    <span>Mod</span>
                    <i class="fas fa-caret-down"></i>
                </div>
                <div class="header-col col-ver">Version</div>
                <div class="header-col col-en">Enabled</div>
            </div>
            <div class="mod-list-scroll-area">
                <div 
                    v-for="mod in modList" 
                    :key="mod.getUuid()" 
                    class="mod-list-item"
                    :class="{ 'disabled': !mod.isEnabled() }"
                >
                    <div class="col-mod">
                        <div class="mod-icon">
                            <img :src="mod.icon" @error="handleImageError" alt="" v-if="mod.icon"/>
                            <i class="fas fa-cube" v-else></i>
                        </div>
                        <span class="mod-name" :title="mod.getName()">{{ mod.getName() }}</span>
                    </div>
                    <div class="col-ver">{{ mod.getVersionNumber().toString() }}</div>
                    <div class="col-en">
                        <label class="switch-toggle" @click.prevent="toggleMod(mod)">
                            <input type="checkbox" :checked="mod.isEnabled()" />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import GameRunnerProvider from '../../providers/generic/game/GameRunnerProvider';
import ProfileModList from '../../r2mm/mods/ProfileModList';
import R2Error from '../../model/errors/R2Error';

// API
import { fetchCommunity } from '../../r2mm/api/get/community';
import type { CommunityResponseData } from '../../r2mm/api/schemas/responseSchemas';

// Components
import DropdownProfiles from './GameHeader/Dropdowns/DropdownProfiles.vue';
import DropdownProfileMenuLite from './GameHeader/Dropdowns/DropdownProfileMenuLite.vue';
import DropdownProfileMenuNew from './GameHeader/Dropdowns/DropdownProfileMenuNew.vue';
import ManifestV2 from '../../model/ManifestV2';

const store = getStore<State>();
const router = useRouter();

const activeGame = computed(() => store.state.activeGame);
const activeProfile = computed(() => store.getters['profile/activeProfile']);
const modList = computed(() => store.state.profile.modList);
const activeProfileName = computed(() => activeProfile.value ? activeProfile.value.getProfileName() : 'Default');
const activeDownloadCount = computed(() => store.getters['download/activeDownloadCount']);
const isDownloading = computed(() => activeDownloadCount.value > 0);

const community = ref<CommunityResponseData | null>(null);

// Mock data for counts until properly wired
const conflictsCount = computed(() => 0); // TODO: wire conflict logic
const updatesCount = computed(() => 0); // TODO: wire update logic

const activeMenu = ref<string | null>(null);

const toggleMenu = (menu: string) => {
    activeMenu.value = activeMenu.value === menu ? null : menu;
};

const closeMenu = () => {
    activeMenu.value = null;
};

// Click outside logic
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (activeMenu.value && !target.closest('.dropdown-container') && !target.closest('.launch-group')) {
        closeMenu();
    }
};

onMounted(async () => {
    document.addEventListener('click', handleClickOutside);
    // Fetch community data
    if (activeGame.value) {
        try {
            const result = await fetchCommunity({
                config: () => ({ apiHost: new URL(activeGame.value.thunderstoreUrl).origin }),
                params: { community_id: activeGame.value.internalFolderName },
                data: {},
                queryParams: undefined
            });
            community.value = result;
        } catch (e) {
            console.warn("Failed to fetch community data", e);
        }
    }
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Actions
const launchModded = () => {
    if (activeProfile.value) GameRunnerProvider.instance.startModded(activeGame.value, activeProfile.value);
};

const launchVanilla = () => {
    if (activeProfile.value) {
        GameRunnerProvider.instance.startVanilla(activeGame.value, activeProfile.value);
        closeMenu();
    }
};

const fixConflicts = () => {
    // Navigate to conflicts view or handle modal
};

const updateAll = () => {
    store.commit("openUpdateAllModsModal");
};

const toggleMod = async (mod: ManifestV2) => {
    try {
        if (mod.isEnabled()) {
            await ProfileModList.disableMod(mod, activeProfile.value);
        } else {
            await ProfileModList.enableMod(mod, activeProfile.value);
        }
        // Refresh handled by store/listeners usually, but we might need to trigger update
    } catch (e) {
        // Handle error
    }
};

const handleAction = async (action: string) => {
    closeMenu();
    if (action === 'rename' || action === 'clone' || action === 'delete' || action === 'new-profile' || action === 'import-profile') {
        router.push({name: 'profiles'});
    } else if (action === 'export-file') {
         try { await store.dispatch("profileExport/exportProfileAsFile"); } 
         catch (e) { store.commit('error/handleError', R2Error.fromThrownValue(e)); }
    } else if (action === 'export-code') {
         try { await store.dispatch("profileExport/exportProfileAsCode"); } 
         catch (e) { store.commit('error/handleError', R2Error.fromThrownValue(e)); }
    }
}

const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = require('../../assets/images/default_icon.png'); // Fallback
}

</script>

<style lang="scss" scoped>
/* Tokens */
$bg-main: #050510;
$bg-island: #101028;
$bg-card: rgba(67, 67, 132, 0.32);
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$accent-green: #23ffab;
$accent-primary: #623bce;
$accent-danger: #f3cf4f; /* Using yellow for warning/conflict */
$accent-info: #1ca3f5;
$border-radius: 8px;

.dashboard-wrapper {
    display: flex;
    height: 100%;
    width: 100%;
    // gap: 16px; // Gap not needed if content handles spacing
    box-sizing: border-box;
    // background-color: $bg-main;
    color: $text-primary;
    position: relative; // Context for absolute background
    overflow: hidden; // Clip blur edges
}

.dashboard-content {
    flex: 1;
    display: flex;
    gap: 24px;
    background-color: transparent; // $bg-island previously
    // border-radius: $border-radius;
    padding: 24px;
    min-width: 0; /* flex fix */
    z-index: 10; // Above background
}

/* Left Column */
.launch-column {
    display: flex;
    flex-direction: column;
    width: 360px;
    flex-shrink: 0;
    gap: 40px; /* Figma: gap-[40px] */
}

// Background Image Container
.game-cover-card {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
}

.game-image-wrapper {
    width: 50%;
    height: 100%;
    position: relative;

    // Gradient overlay to darken image for text legibility
    &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, rgba(5,5,16,0.5) 0%, rgba(5,5,16,0.95) 100%);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.4;
        filter: blur(2px);
    }
}

.launch-helpers {
    display: flex;
    flex-direction: column;
    gap: 8px; /* Figma: 8px between cards */
    width: 100%;
    margin-top: auto; /* Push to bottom if space allows, or just flow */
}

.status-card {
    background-color: $bg-island;
    border-radius: 8px;
    width: 100%;
    box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.4), 0px 1px 2px 0px rgba(0,0,0,0.9);
    overflow: hidden;

    .status-card-content {
        background-color: rgba(67, 67, 132, 0.32);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-radius: 8px; /* Inner radius matching outer usually, or just fill */
    }

    &.warning {
        .status-text, .status-count { color: #f3cf4f; }
        .status-icon { color: #f3cf4f; }
    }
    
    &.info {
        .status-text { color: #50d99f; }
        .status-count { color: #50d99f; }
        .status-icon { color: #1ca3f5; }
    }
}

.status-icon { width: 14px; text-align: center; }
.status-text { flex: 1; font-size: 14px; font-weight: 400; line-height: 1.5; }
.status-count { font-weight: 700; }

.btn-small {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: none;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    background: #623bce;
    color: #f5f5f6;
    &:hover { filter: brightness(1.1); }
}

.launch-area {
    width: 100%;
}

.launch-group {
    display: flex;
    gap: 2px;
    width: 100%;
    height: 64px;
}

.launch-main {
    flex: 1;
    background-color: #23ffab;
    border: none;
    border-radius: 8px 0 0 8px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 16px;
    color: #031912;
    font-weight: 700;
    font-size: 20px;
    cursor: pointer;
    position: relative;
    /* Inset shadows for 3D effect */
    box-shadow: inset 0px 0px 16px 0px #40ae7f, inset 0px 1px 0px 0px rgba(255,255,255,0.2), inset 0px -3px 0px 0px rgba(0,0,0,0.35);
    
    &:hover { filter: brightness(1.05); }
    &:active { box-shadow: inset 0px 0px 20px 0px #309e6f, inset 0px 3px 0px 0px rgba(0,0,0,0.35); transform: translateY(1px); }
    
    i { font-size: 19px; }
}

.launch-caret {
    /* width implicit by flex? No, typically explicit or padding-based. Figma: p-[12px] */
    padding: 0 12px;
    height: 100%;
    background-color: #23ffab;
    border: none;
    border-radius: 0 8px 8px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #031912;
    cursor: pointer;
    position: relative;
    box-shadow: inset 0px 0px 16px 0px #40ae7f, inset 0px 1px 0px 0px rgba(255,255,255,0.2), inset 0px -3px 0px 0px rgba(0,0,0,0.35);

    &:hover { filter: brightness(1.05); }
    &:active { box-shadow: inset 0px 0px 20px 0px #309e6f, inset 0px 3px 0px 0px rgba(0,0,0,0.35); transform: translateY(1px); }
    
    i { font-size: 16px; }
}

/* Middle Column */
.profile-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
}

.profile-header-strip {
    height: 40px;
    display: flex;
    gap: 8px;
}

.profile-select-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(70, 70, 149, 0.66);
    padding: 0 16px;
    height: 40px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    flex: 1;
    max-width: 460px; /* From design */
    text-align: left;
    color: $text-primary;
    &:hover { background: rgba(70, 70, 149, 0.8); }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover { background: rgba(70, 70, 149, 0.66); }
    }
}

.profile-text-group {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.label-tiny { font-size: 10px; color: $text-secondary; font-weight: 500; text-transform: uppercase; }
.label-name { font-size: 14px; font-weight: 700; }

.profile-actions-group {
    display: flex;
    gap: 8px;
}

.action-icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: $text-primary;
    cursor: pointer;
    font-size: 16px;
    &:hover { background: rgba(255,255,255,0.05); }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover { background: transparent; }
    }
}

/* Mod List */
.mod-list-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px; /* Gap between header and list */
    border-radius: 8px;
    overflow: hidden;
}

.mod-list-header-row {
    display: flex;
    height: 36px;
    width: 100%;
    gap: 2px;
}

.header-col {
    background: rgba(59, 63, 125, 0.24);
    display: flex;
    align-items: center;
    padding: 0 16px; /* Vertical centering handled by flex + height */
    font-size: 12px;
    font-weight: 700;
}

.header-col.col-mod {
    flex: 1;
    color: $text-primary;
    gap: 12px;
    border-radius: 8px 0 0 8px;
}

.header-col.col-ver {
    width: 76px;
    justify-content: flex-end;
    color: $text-secondary;
}

.header-col.col-en {
    width: 76px;
    justify-content: flex-end;
    color: $text-secondary;
    border-radius: 0 8px 8px 0;
}

.mod-list-scroll-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mod-list-item {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 8px; /* Figma: p-[8px] - might be wrapper padding? No, seems to be item. Wait: h-40px, p-8px => content height 24px? */
    /* Actually Figma says: h-[40px] items-center p-[8px]. The children are height full? */
    /* Figma children: h-full. So 40-16=24px high content? */
    /* Let's stick to flex align center and fixed height for now */
    background: linear-gradient(0deg, rgba(57, 57, 106, 0.15), rgba(57, 57, 106, 0.15)), #101028;
    border-radius: 8px;
    border: 1px solid transparent; /* Placeholder to avoid layout shift if border added */
    
    &.disabled {
        .mod-name { 
            text-decoration: line-through; 
            color: $text-secondary;
            opacity: 0.8;
        }
        .mod-icon {
            opacity: 0.5;
        }
    }
}

.col-mod { flex: 1; display: flex; align-items: center; gap: 16px; overflow: hidden; padding-left: 8px; } /* Figma: pl-[8px] */
.col-ver { width: 76px; text-align: right; color: $text-secondary; padding-right: 16px; }
.col-en { width: 76px; display: flex; justify-content: flex-end; padding-right: 16px;}

.mod-icon {
    width: 24px;
    height: 24px;
    background: #070721;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    
    img { width: 100%; height: 100%; object-fit: cover; }
    i { font-size: 12px; color: $text-secondary; line-height: 24px; text-align: center; display: block;}
}

.mod-name {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Switch Toggle CSS */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 20px;
  
  input { 
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(63, 63, 136, 0.55);
  border: 1px solid rgba(70, 70, 149, 0.66);
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: #f5f5f6;
  -webkit-transition: .4s;
  transition: .4s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.55);
}

input:checked + .slider {
  background-color: #23ffab;
  border-color: #23ffab;
}

input:checked + .slider:before {
  -webkit-transform: translateX(10px);
  -ms-transform: translateX(10px);
  transform: translateX(10px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Utility */
.relative { position: relative; }
.dropdown-menu {
    position: absolute;
    bottom: 100%; /* Upwards for launch menu */
    left: 0;
    background: #333370;
    padding: 8px;
    border-radius: 8px;
    min-width: 150px;
    z-index: 50;
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    color: #f5f5f6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    &:hover { background: rgba(255,255,255,0.1); }
}

.profile-dropdown-wrapper {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    z-index: 100;
}
</style>
