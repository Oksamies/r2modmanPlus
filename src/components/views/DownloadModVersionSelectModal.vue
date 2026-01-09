<template>
    <div class="modal-overlay" v-if="isOpen && thunderstoreMod">
        <div class="modal-backdrop" @click="closeModal()"></div>
        <div class="cyber-modal">
            <div class="cyber-modal-header">
                <h2 class="modal-title">
                    Download <span class="highlight">{{thunderstoreMod.getName()}}</span>
                </h2>
                <button class="close-btn" @click="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="cyber-modal-body">
                <p class="description">It's recommended to select the latest version. Installing outdated versions may cause conflicts.</p>
                
                <div class="selection-area">
                    <!-- Current Version Block -->
                    <div v-if="currentVersion" class="version-block">
                        <span class="label">Current</span>
                        <div class="version-display">{{ currentVersion }}</div>
                    </div>

                    <div v-if="currentVersion" class="arrow-divider">
                        <i class="fas fa-long-arrow-alt-right"></i>
                    </div>

                    <!-- Target Version Block -->
                    <div class="version-block">
                        <span class="label">Target</span>
                        <div class="custom-select">
                            <select v-model="selectedVersion">
                                <option v-for="(value, index) in versionNumbers" :key="index" :value="value">{{value}}</option>
                            </select>
                            <i class="fas fa-chevron-down select-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Status Indicators -->
                <div class="status-area">
                    <div v-if="selectedVersion === null" class="status-msg info">
                        Please select a version to proceed.
                    </div>
                    <div v-else-if="recommendedVersion === selectedVersion" class="status-msg success">
                        <i class="fas fa-check-circle"></i>
                        {{selectedVersion}} is the recommended version.
                    </div>
                    <div v-else-if="versionNumbers[0] === selectedVersion" class="status-msg success">
                        <i class="fas fa-star"></i>
                        {{selectedVersion}} is the latest version.
                    </div>
                    <div v-else class="status-msg warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        {{selectedVersion}} is an outdated version.
                    </div>
                </div>
            </div>

            <div class="cyber-modal-footer">
                <button class="btn-ghost" @click="closeModal()">
                    Cancel
                </button>
                <button class="btn-primary" @click="downloadMod" :disabled="!selectedVersion">
                    <i class="fas fa-download"></i>
                    <span>Download with dependencies</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import R2Error from "../../model/errors/R2Error";
import ManifestV2 from "../../model/ManifestV2";
import ThunderstoreVersion from "../../model/ThunderstoreVersion";
import { MOD_LOADER_VARIANTS } from "../../r2mm/installing/profile_installers/ModLoaderVariantRecord";
import * as PackageDb from "../../r2mm/manager/PackageDexieStore";
import ProfileModList from "../../r2mm/mods/ProfileModList";
import Game from '../../model/game/Game';
import { computed, ref, watch } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import ThunderstoreMod from '../../model/ThunderstoreMod';
import ThunderstoreCombo from "../../model/ThunderstoreCombo";
import { InstallMode } from "../../utils/DependencyUtils";

const store = getStore<State>();

const versionNumbers = ref<string[]>([]);
const recommendedVersion = ref<string | null>(null);
const selectedVersion = ref<string | null>(null);
const currentVersion = ref<string | null>(null);

const isOpen = computed(() => store.state.modals.isDownloadModVersionSelectModalOpen);
const thunderstoreMod = computed(() => store.state.modals.downloadModalMod);

function closeModal() {
    store.commit("closeDownloadModVersionSelectModal");
}

watch(() => store.state.modals.downloadModalMod, async () => {
    currentVersion.value = null;
    if (thunderstoreMod.value !== null) {
        const activeGame: Game = store.state.activeGame;
        selectedVersion.value = thunderstoreMod.value.getLatestVersion();
        recommendedVersion.value = null;

        versionNumbers.value = await PackageDb.getPackageVersionNumbers(
            activeGame.internalFolderName,
            thunderstoreMod.value.getFullName()
        );

        const foundRecommendedVersion = MOD_LOADER_VARIANTS[activeGame.internalFolderName]
            .find(value => value.packageName === thunderstoreMod.value!.getFullName());

        if (foundRecommendedVersion && foundRecommendedVersion.recommendedVersion) {
            recommendedVersion.value = foundRecommendedVersion.recommendedVersion.toString();

            // Auto-select recommended version if it's found.
            const recommendedVersionToSelect = versionNumbers.value.find(
                (ver) => ver === foundRecommendedVersion.recommendedVersion!.toString()
            );
            if (recommendedVersionToSelect) {
                selectedVersion.value = recommendedVersionToSelect;
            }
        }

        const modListResult = await ProfileModList.getModList(store.getters['profile/activeProfile'].asImmutableProfile());
        if (!(modListResult instanceof R2Error)) {
            const manifestMod = modListResult.find((local: ManifestV2) => local.getName() === thunderstoreMod.value!.getFullName());
            if (manifestMod !== undefined) {
                currentVersion.value = manifestMod.getVersionNumber().toString();
            }
        }
    }
});

async function downloadMod() {
    const mod = thunderstoreMod.value;
    const versionString = selectedVersion.value;
    if (mod === null || versionString === null) {
        // Shouldn't happen, but shouldn't throw an error.
        console.log(`Download initiated with null mod [${mod}] or version [${versionString}]`);
        return;
    }

    let version: ThunderstoreVersion;
    const activeGame: Game = store.state.activeGame;

    try {
        version = await PackageDb.getVersionAsThunderstoreVersion(
            activeGame.internalFolderName,
            mod.getFullName(),
            versionString
        );
    } catch {
        console.log(`Failed to get version [${versionString}] for mod [${mod.getFullName()}]`);
        return;
    }

    downloadHandler(mod, version);
}

async function downloadHandler(tsMod: ThunderstoreMod, tsVersion: ThunderstoreVersion) {
    closeModal();

    const combos = [new ThunderstoreCombo()];
    combos[0].setMod(tsMod);
    combos[0].setVersion(tsVersion);

    await store.dispatch('download/downloadAndInstallCombos', {
        combos,
        profile: store.getters['profile/activeProfile'].asImmutableProfile(),
        game: store.state.activeGame,
        installMode: InstallMode.INSTALL_SPECIFIC
    });
}

</script>

<style lang="scss" scoped>
/* Modal Structure */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
}

.cyber-modal {
    position: relative;
    background-color: #101028;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modalSlideUp 0.2s ease-out;
}

@keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.cyber-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #f5f5f6;
    
    .highlight {
        color: #23ffab;
    }
}

.close-btn {
    background: transparent;
    border: none;
    color: #a7aed2;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    &:hover { color: #f5f5f6; }
}

.cyber-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.description {
    color: #a7aed2;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
}

/* Selection Area */
.selection-area {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(0, 0, 0, 0.2);
    padding: 16px;
    border-radius: 8px;
}

.version-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.arrow-divider {
    color: #a7aed2;
    font-size: 14px;
    margin-top: 18px; // align with input
}

.label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: #a7aed2;
}

.version-display {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    color: #f5f5f6;
    font-family: monospace;
    font-size: 14px;
}

.custom-select {
    position: relative;
    height: 40px;
    width: 100%;
    
    select {
        width: 100%;
        height: 100%;
        background: rgba(59, 63, 125, 0.24);
        border: 1px solid transparent;
        border-radius: 4px;
        color: #f5f5f6;
        padding: 0 32px 0 12px;
        appearance: none;
        cursor: pointer;
        font-family: monospace;
        font-size: 14px;
        
        &:hover { border-color: rgba(255,255,255,0.1); }
        &:focus { border-color: #623bce; outline: none; }
    }
    
    .select-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #a7aed2;
        font-size: 12px;
    }
}

/* Status Messages */
.status-area {
    font-size: 14px;
}

.status-msg {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 4px;
    font-weight: 500;
    
    &.info {
        background: rgba(70, 70, 149, 0.2);
        color: #a7aed2;
    }
    
    &.success {
        background: rgba(35, 255, 171, 0.1);
        color: #23ffab;
    }
    
    &.warning {
        background: rgba(243, 207, 79, 0.1);
        color: #f3cf4f;
    }
}

.cyber-modal-footer {
    display: flex;
    padding: 20px 24px;
    justify-content: flex-end;
    gap: 12px;
    background-color: rgba(0, 0, 0, 0.2);
}

/* Buttons */
button {
    height: 40px;
    padding: 0 20px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    transition: all 0.2s;
}

.btn-primary {
    background: #623bce;
    color: #f5f5f6;
    
    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-ghost {
    background: transparent;
    color: #a7aed2;
    
    &:hover { color: #f5f5f6; background: rgba(255,255,255,0.05); }
}

</style>
