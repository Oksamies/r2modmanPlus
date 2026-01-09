<template>
    <div class="navigation-header">
        <div class="header-left">
            <div class="logo-container">
                <img src="/icons/tslogo.svg" alt="Logo" class="logo-img" />
            </div>
            <div class="nav-controls">
                <button class="nav-button" @click="goBack">
                    <i class="fas fa-angle-left"></i>
                </button>
                <button class="nav-button" @click="goForward">
                    <i class="fas fa-angle-right"></i>
                </button>
            </div>
            <div class="header-title">
                <span v-if="isGameSelection">Select Game</span>
                <!-- Breadcrumbs -->
                <div v-else class="header-breadcrumbs">
                    <template v-for="(crumb, index) in crumbs" :key="index">
                        <span v-if="index > 0" class="breadcrumb-separator">/</span>
                        <span 
                            class="breadcrumb-item" 
                            :class="{'is-active': crumb.active}"
                            @click="crumb.to ? router.push(crumb.to) : null"
                        >
                            {{ crumb.label }}
                        </span>
                    </template>
                </div>
            </div>
        </div>
        <div class="header-right">
            <div class="header-actions">
                <button class="action-button text-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                </button>
                <button class="action-button">
                    <i class="fas fa-bell"></i>
                </button>
            </div>
            <div class="window-controls">
                <button class="window-control-button" @click="minimize">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="window-control-button" @click="maximize">
                    <i class="far fa-square"></i>
                </button>
                <button class="window-control-button is-close" @click="close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import { useRoute, useRouter } from 'vue-router';

const store = getStore<State>();
const route = useRoute();
const router = useRouter();
const activeGame = computed(() => store.state.activeGame);
const profile = computed(() => store.getters['profile/activeProfile']);

const isGameSelection = computed(() => route.name === 'index');

const crumbs = computed(() => {
    const routeName = (route.name as string) || '';
    const c = [];
    
    // Base Game Breadcrumb
    if (activeGame.value) {
        c.push({
            label: activeGame.value.displayName,
            to: { name: 'manager.installed' }
        });
    }

    if (routeName.includes('manager.installed')) {
        c.push({ label: 'Installed', active: true });
    } else if (routeName.includes('manager.online')) {
        c.push({ label: 'Online', active: true });
    } else if (routeName.includes('manager.settings')) {
        c.push({ label: 'Settings', active: true });
    } else if (routeName.includes('config-editor')) {
        c.push({ label: 'Config Editor', active: true });
    } else if (routeName.includes('downloads')) {
        c.push({ label: 'Downloads', active: true });
    } else if (routeName.includes('help')) {
        c.push({ label: 'Help', active: true });
    } else if (routeName.includes('manager.mod_details')) {
        // Formatted package name if possible
        const pkg = route.params.package as string;
        let label = pkg;
        // Try to strip namespace if it follows "Namespace-Name" pattern
        if (pkg && pkg.indexOf('-') > 0) {
            const parts = pkg.split('-');
            if (parts.length >= 2) {
                label = parts.slice(1).join('-');
            }
        }
        // Replace underscores
        if (label) {
            label = label.replace(/_/g, ' ');
            c.push({ label: label, active: true });
        } else {
             c.push({ label: 'Mod Details', active: true });
        }
    }

    return c;
});

function goBack() {
    router.back();
}

function goForward() {
    router.forward();
}

function minimize() {
    window.electron.minimize();
}

function maximize() {
    window.electron.maximize();
}

function close() {
    window.electron.close();
}
</script>

<style lang="scss" scoped>
.navigation-header {
    display: flex;
    align-items: center;
    padding: 0;
    background-color: var(--island-bg-color, #101028);
    border-radius: 0; /* Full width, no corners */
    margin: 0;
    height: 40px; /* Keep 40px for touch targets, or reduce to 36px if strict */
    flex-shrink: 0;
    -webkit-app-region: drag;
    user-select: none;
    overflow: hidden;
    width: 100%;
}

.header-left {
    display: flex;
    align-items: center;
    height: 100%;
}

.logo-container {
    width: 68px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .logo-img {
        width: 20px;
        height: 20px;
        display: block;
    }
}

.nav-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
    -webkit-app-region: no-drag;
}

.nav-button {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #f5f5f6;
    cursor: pointer;
    font-size: 14px;
    
    &:disabled {
        color: #a7aed2;
        cursor: default;
        opacity: 0.5;
    }
    
    &:not(:disabled):hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 12px;
    color: #a7aed2;
    
    .game-title {
        color: #f5f5f6;
    }
    
    .profile-name {
        color: #a7aed2;
        breadcrumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.breadcrumb-item {
    color: #a7aed2;
    cursor: pointer;
    font-weight: 400;
    transition: color 0.1s;
    
    &:hover, &.is-active {
        color: #f5f5f6; 
    }
    
    &.is-active {
        font-weight: 600;
        cursor: default;
    }
}

.breadcrumb-separator {
    color: #5b6288;
    font-weight: 400;
}

.header-font-weight: 400;
        &::before {
            content: '/';
            margin-right: 8px;
            opacity: 0.5;
        }
    }
}

.header-right {
    margin-left: auto;
    height: 100%;
    display: flex;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 16px;
    -webkit-app-region: no-drag;
}

.action-button {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #f5f5f6;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.text-warning {
        color: #f3cf4f;
    }
}

.window-controls {
    display: flex;
    height: 100%;
    -webkit-app-region: no-drag;
}

.window-control-button {
    background: transparent;
    border: none;
    color: #cbd0ec;
    width: 50px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    font-size: 10px;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
    }

    &.is-close:hover {
        background-color: #e81123;
        color: white;
    }
}
</style>
