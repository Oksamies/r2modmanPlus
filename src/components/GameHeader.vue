<template>
  <div class="game-header">
    <!-- Left: Profile & Info -->
    <div class="header-left">
      <div class="relative dropdown-container">
        <button class="profile-btn" @click.stop="toggleMenu('profileSelection')" :class="{ 'active': activeMenu === 'profileSelection' }">
          <div class="profile-info">
            <span class="profile-label">PROFILE</span>
            <span class="profile-name">{{ activeProfile ? activeProfile.getProfileName() : 'Default' }}</span>
          </div>
          <i class="fas fa-chevron-down profile-caret"></i>
        </button>
        <div v-if="activeMenu === 'profileSelection'" class="profile-dropdown-wrapper">
          <DropdownProfiles />
        </div>
      </div>

      <div class="profile-actions">
        <!-- Manage Profile -->
        <div class="relative dropdown-container">
            <button class="icon-btn" @click.stop="toggleMenu('manageProfile')" title="Manage profile" :class="{ 'active': activeMenu === 'manageProfile' }">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <DropdownProfileMenuLite
                v-if="activeMenu === 'manageProfile'"
                @rename="handleAction('renameProfile')"
                @share="handleAction('shareProfile')"
                @backup="handleAction('backupProfile')"
                @clone="handleAction('cloneProfile')"
                @sync="handleAction('syncProfile')"
                @delete="handleAction('deleteProfile')"
                @export-file="handleAction('exportProfileFile')"
                @export-code="handleAction('exportProfileCode')"
            />
        </div>
        <!-- Add Profile -->
        <div class="relative dropdown-container">
             <button class="icon-btn" @click.stop="toggleMenu('addProfile')" title="Add profile" :class="{ 'active': activeMenu === 'addProfile' }">
                <i class="fas fa-plus"></i>
            </button>
            <DropdownProfileMenuNew
                v-if="activeMenu === 'addProfile'"
                @new-profile="handleAction('newProfile')"
                @import-profile="handleAction('importProfile')"
            />
        </div>
      </div>

      <div class="mod-count-tag" v-if="modCount !== null">
        <span class="count-text">{{ modCount }}</span>
      </div>
    </div>

    <!-- Right: Launch & Options -->
    <div class="header-right">
      <div class="relative dropdown-container">
          <button class="icon-btn" title="Game options" @click.stop="toggleMenu('gameOptions')" :class="{ 'active': activeMenu === 'gameOptions' }">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <DropdownProfileMenuAdvanced
              v-if="activeMenu === 'gameOptions'"
              @set-launch-parameters="handleAction('setLaunchParameters')"
              @show-dependency-strings="handleAction('showDependencyStrings')"
              @browse-profile-directory="handleAction('browseProfile')"
          />
      </div>
      
      <div class="launch-group relative dropdown-container">
        <button class="launch-main" @click="launchModded">
            <i class="fas fa-play"></i>
            <span>Play modded</span>
        </button>
        <div class="relative">
            <button class="launch-caret" @click.stop="toggleMenu('launch')">
                <i class="fas fa-chevron-down"></i>
            </button>
             <div v-if="activeMenu === 'launch'" class="dropdown-menu dropdown-right launch-menu-override">
                <div class="dropdown-item" @click="launchVanillaAndClose">
                    <div class="dropdown-icon"><i class="fas fa-play"></i></div>
                    <span class="dropdown-text">Play vanilla</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import GameRunnerProvider from '../providers/generic/game/GameRunnerProvider';
import LinkProvider from '../providers/components/LinkProvider';
import R2Error from '../model/errors/R2Error';
import DropdownProfiles from './views/GameHeader/Dropdowns/DropdownProfiles.vue';
import DropdownProfileMenuLite from './views/GameHeader/Dropdowns/DropdownProfileMenuLite.vue';
import DropdownProfileMenuNew from './views/GameHeader/Dropdowns/DropdownProfileMenuNew.vue';
import DropdownProfileMenuAdvanced from './views/GameHeader/Dropdowns/DropdownProfileMenuAdvanced.vue';

const store = getStore<State>();
const route = useRoute();
const router = useRouter();
const activeGame = computed(() => store.state.activeGame);
const activeProfile = computed(() => store.getters['profile/activeProfile']);
const modCount = computed(() => store.state.profile.modList.length);

const activeMenu = ref<string | null>(null);

const toggleMenu = (menu: string) => {
    if (activeMenu.value === menu) {
        activeMenu.value = null;
    } else {
        activeMenu.value = menu;
    }
};

const closeMenu = () => {
    activeMenu.value = null;
};

const handleAction = (action: string) => {
    closeMenu();
    switch (action) {
        case 'renameProfile':
        case 'cloneProfile':
        case 'deleteProfile':
        case 'newProfile':
        case 'importProfile':
            router.push({name: 'profiles'});
            break;
        case 'browseProfile':
            if (activeProfile.value) {
                LinkProvider.instance.openLink('file://' + activeProfile.value.getProfilePath());
            }
            break;
        case 'setLaunchParameters':
        case 'shareProfile':
        case 'backupProfile':
        case 'syncProfile':
        case 'advancedProfile':
            // TODO: Implement handlers for share, backup, sync, advanced
        case 'showDependencyStrings':
             router.push({name: 'manager.settings'});
             break;
    }
}

const launchModded = () => {
    if (activeProfile.value) {
        GameRunnerProvider.instance.startModded(activeGame.value, activeProfile.value);
    }
}

const launchVanillaAndClose = () => {
    if (activeProfile.value) {
        GameRunnerProvider.instance.startVanilla(activeGame.value, activeProfile.value);
        closeMenu();
    }
}

// Simple click outside directive logic
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (activeMenu.value && !target.closest('.dropdown-container')) {
        closeMenu();
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
$accent-green: #23ffab;
$surface-bg: #101028;
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$danger-red: #ff4c4c;

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: $surface-bg;
  border-radius: 8px;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.relative {
    position: relative;
}

/* Profile Button */
.profile-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(70, 70, 149, 0.66);
    padding: 0 16px;
    height: 40px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    min-width: 200px;
    transition: background-color 0.2s;
    text-align: left;

    &:hover {
        background: rgba(70, 70, 149, 0.8);
    }
}

.profile-info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.profile-label {
    font-size: 10px;
    font-weight: 500;
    color: #a7aed2;
    text-transform: uppercase;
}

.profile-name {
    font-size: 14px;
    color: #f5f5f6;
    font-weight: 700;
}

.profile-caret {
    color: #f5f5f6;
    font-size: 12px;
}

/* Profile Actions */
.profile-actions {
    display: flex;
    gap: 2px;
}

.icon-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #f5f5f6;
    font-size: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover, &.active {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

/* Mod Count Tag */
.mod-count-tag {
    background-color: #4a4aa5;
    height: 20px;
    padding: 0 8px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.count-text {
    font-weight: 700;
    font-size: 10px;
    color: #f5f5f6;
}

/* Launch Group */
.launch-group {
    display: flex;
    align-items: center;
    gap: 2px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.launch-main {
    background-color: $accent-green;
    height: 44px;
    padding: 0 24px;
    border: none;
    border-radius: 8px 0 0 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    color: #031912;
    font-weight: 700;
    font-size: 16px;
    transition: filter 0.2s;

    i { font-size: 14px; }

    &:hover { filter: brightness(1.05); }
    &:active { filter: brightness(0.95); }
}

.launch-caret {
    background-color: $accent-green;
    height: 44px;
    padding: 0 12px;
    border: none;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    color: #031912;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid rgba(0,0,0,0.1);
    transition: filter 0.2s;

    &:hover { filter: brightness(1.05); }
    &:active { filter: brightness(0.95); }
}

/* Dropdown Menu - General */
.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    background-color: #333370;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    z-index: 50;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &.dropdown-right {
        left: auto;
        right: 0;
    }
}

.launch-menu-override {
    min-width: 160px;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    width: 100%;
    background: transparent;
    border: none;
    color: #f5f5f6;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    box-sizing: border-box;
    transition: background-color 0.1s;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.item-danger {
        color: $danger-red;
        
        .dropdown-icon {
            color: $danger-red;
        }

        &:hover {
            background-color: rgba(255, 76, 76, 0.1);
        }
    }
}

.dropdown-icon {
    width: 20px;
    display: flex;
    justify-content: center;
    color: #a7aed2; /* secondary text color for icons by default */
}

.dropdown-text {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
}

.dropdown-chevron {
    font-size: 10px;
    opacity: 0.7;
}

.dropdown-divider {
    height: 1px;
    background-color: rgba(255,255,255,0.1);
    margin: 4px 0;
}

.profile-dropdown-wrapper {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    width: 300px;
    height: 400px;
    z-index: 60;
}
</style>
