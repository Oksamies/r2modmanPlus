<template>
    <div id="help-view" class="help-layout">
        <div class="help-sidebar">
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

        <div class="help-content">
            <div class="search-container">
                <div class="search-bar">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" v-model="searchQuery" placeholder="Search..." />
                </div>
            </div>

            <div class="content-scroll">
                <!-- General Section -->
                <div v-if="shouldShowSection('general')" class="help-section">
                    <h2 class="section-title">General</h2>
                    
                    <Collapsible v-if="matchesSearch('Getting started with installing mods')">
                        <template #title>Getting started with installing mods</template>
                        <template #content>
                            <p>Go to the "Online" tab, find a mod, and hit download. It'll also download the dependencies saving you time.</p>
                            <p>Once you've installed the mods you'd like, just click <strong>Start modded</strong> in the top left.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('Slow game with mods / stuttering?')">
                        <template #title>Slow game with mods / stuttering?</template>
                        <template #content>
                            <p>This is likely due to a mod throwing errors. One solution is to attempt to disable half of your mods and check to see if the issue persists.</p>
                            <p>If the issue still remains then disable another half. Continue doing this until the issue is solved.</p>
                            <p>In the case of stuttering there may be optimization mods to help with this.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('Dedicated servers')">
                        <template #title>Dedicated servers</template>
                        <template #content>
                            <p>Dedicated servers aren't directly supported through the manager however a solution is to instead copy the contents of your profile folder into your dedicated server folder yourself.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('Launching the game from outside the mod manager')">
                        <template #title>Launching the game from outside the mod manager</template>
                        <template #content>
                            <p>By design your experience by starting the game through Steam will be vanilla (un-modded).</p>
                            <p>You will need to place the corresponding argument in your platform's relevant launch parameter area.</p>
                            <p>For Steam, this would be located in the game's properties.</p>
                            <br/>
                            <p>Your current argument would be:</p>
                            <code v-if="launchArgs.length > 0">{{ launchArgs }}</code>
                            <code v-else>These parameters will be available after installing BepInEx.</code>
                            <br/><br/>
                            <template v-if="doorstopTarget.length > 0">
                                <button class="button" @click="copyLaunchArgsToClipboard" v-if="!copyingDoorstopText">
                                    <i class="fas fa-clipboard"></i>
                                    <span class="margin-left--half-width smaller-font">Copy launch arguments</span>
                                </button>
                                <button class="button is-loading" v-else>Copy launch arguments</button>
                            </template>
                        </template>
                    </Collapsible>

                     <Collapsible v-if="matchesSearch('Auto-updates')">
                        <template #title>Auto-updates</template>
                        <template #content>
                            <p>The manager updates automatically on close assuming an update is available.</p>
                            <p>Updates are downloaded in the background.</p>
                            <p>You may receive a prompt to run <i>old_uninstaller</i> as an admin. This is the updater.</p>
                            <p>If a problem occurs with an update, download and run the latest installer.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('I don\'t want updates')">
                        <template #title>I don't want updates</template>
                        <template #content>
                            <p>On GitHub there is a portable version that doesn't auto update. You are however prompted that an update is available.</p>
                        </template>
                    </Collapsible>
                </div>

                <!-- Games Section -->
                <div v-if="shouldShowSection('games')" class="help-section">
                    <h2 class="section-title">Games</h2>
                    
                    <Collapsible v-if="matchesSearch('A red box appears when I try to start the game')">
                        <template #title>A red box appears when I try to start the game</template>
                        <template #content>
                            <p>Read the suggestion at the bottom of the red box.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('I\'m taken to the Steam store page')">
                        <template #title>I'm taken to the Steam store page</template>
                        <template #content>
                            <p>That's because you don't legally own the game. The manager only supports legal copies.</p>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="matchesSearch('A text window appears and closes immediately.')">
                        <template #title>A text window appears and closes immediately.</template>
                        <template #content>
                            <p>Try running "Reset {{store.state.activeGame.displayName}} installation" on the Settings screen.</p>
                            <p>If it persists, force exit Steam and start modded with Steam closed.</p>
                        </template>
                    </Collapsible>
                </div>

                <!-- Mods Section -->
                <div v-if="shouldShowSection('mods')" class="help-section">
                    <h2 class="section-title">Mods</h2>
                    
                    <Collapsible v-if="matchesSearch('Mods not appearing')">
                        <template #title>Mods not appearing</template>
                        <template #content>
                            <p>The most common issues are solved by following the instructions exactly as listed
                                <ExternalLink url="https://github.com/ebkr/r2modmanPlus/wiki/Why-aren't-my-mods-working%3F">
                                    here
                                </ExternalLink>
                            </p>
                        </template>
                    </Collapsible>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, onMounted } from 'vue';
import { ExternalLink } from '../components/all';
import Collapsible from '../components/Collapsible.vue';
import GameRunnerProvider from '../providers/generic/game/GameRunnerProvider';
import R2Error from '../model/errors/R2Error';
import InteractionProvider from '../providers/ror2/system/InteractionProvider';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import { getDeterminedLaunchType } from "../utils/LaunchUtils";
import { ComputedWrapperLaunchArguments } from "../components/computed/WrapperArguments";
import { getLaunchType, LaunchType } from "../model/real_enums/launch/LaunchType";
import appWindow from '../providers/node/app/app_window';

const store = getStore<State>();

const activeTab = ref('general');
const searchQuery = ref('');
const tabs = [
    { id: 'general', label: 'General', icon: 'fas fa-info-circle' },
    { id: 'games', label: 'Games', icon: 'fas fa-gamepad' },
    { id: 'mods', label: 'Mods', icon: 'fas fa-box' },
];

const doorstopTarget = ref("");
const copyingDoorstopText = ref(false);
const launchArgs = ref("");

function shouldShowSection(sectionId: string) {
    if (searchQuery.value.trim() !== '') {
        return true;
    }
    return activeTab.value === sectionId;
}

function matchesSearch(text: string) {
    if (searchQuery.value.trim() === '') {
        return true;
    }
    return text.toLowerCase().includes(searchQuery.value.toLowerCase());
}

watchEffect(async () => {
    const loaderArgs = doorstopTarget.value;
    const prerequisiteText = ComputedWrapperLaunchArguments.value;
    if (appWindow.getPlatform() === 'win32') {
        launchArgs.value = loaderArgs;
        return;
    }
    const storedLaunchType = await getLaunchType(store.state.activeGame);
    const launchType = await getDeterminedLaunchType(store.state.activeGame, storedLaunchType);
    if (launchType === LaunchType.NATIVE) {
        launchArgs.value = `${prerequisiteText} ${loaderArgs}`;
    } else {
        launchArgs.value = `%command% ${loaderArgs}`;
    }
});

function copyLaunchArgsToClipboard() {
    InteractionProvider.instance.copyToClipboard(launchArgs.value);
    copyingDoorstopText.value = true;
    setTimeout(stopShowingCopy, 400);
}

function stopShowingCopy() {
    copyingDoorstopText.value = false;
}

onMounted(() => {
    GameRunnerProvider.instance.getGameArguments(
        store.state.activeGame,
        store.getters['profile/activeProfile']
    ).then(target => {
        if (target instanceof R2Error) {
            doorstopTarget.value = "";
            return;
        } else {
            doorstopTarget.value = target;
        }
    });
});
</script>

<style lang="scss" scoped>
#help-view {
    width: 100%;
    height: 100%;
    display: flex;
    background-color: #101028;
    color: #f5f5f6;
    border-radius: 8px;
    overflow: hidden;
}

.help-sidebar {
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

.help-content {
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

.help-section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 20px;
    font-weight: bold;
    color: #23ffab;
    margin-bottom: 24px;
}
</style>
