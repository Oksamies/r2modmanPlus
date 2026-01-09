<template>
    <div class="tab-content">
        <div v-if="loading" class="empty-placeholder">
             <i class="fas fa-spinner fa-spin"></i> Loading versions...
        </div>
        <div v-else-if="versions && versions.length > 0" class="version-list">
            <div class="version-header">
                <div>Version</div>
                <div>Date</div>
                <div>Downloads</div>
                <div style="text-align: right">Action</div>
            </div>
            <div v-for="ver in versions" :key="ver.version_number" class="version-item">
                <div class="ver-number">{{ ver.version_number }}</div>
                <div class="ver-date">{{ formatDate(ver.datetime_created) }}</div>
                <div class="ver-dl">{{ formatNumber(ver.download_count) }}</div>
                <div class="ver-actions">
                    <a href="javascript:void(0);" @click="installVersion(ver)" class="btn-icon-sm" title="Download and Install">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            </div>
        </div>
        <div v-else class="empty-placeholder">No versions found.</div>
    </div>
</template>

<script lang="ts" setup>
import { inject, Ref, ref, onMounted, watch } from 'vue';
import { PackageListingDetailsResponseData, PackageVersionsResponseData, PackageVersionData } from '../../../r2mm/api/schemas/responseSchemas';
import { fetchPackageVersions } from '../../../r2mm/api/get/packageVersions';
import GameManager from '../../../model/game/GameManager';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import * as PackageDb from '../../../r2mm/manager/PackageDexieStore';
import ThunderstoreMod from '../../../model/ThunderstoreMod';
import ThunderstoreCombo from '../../../model/ThunderstoreCombo';
import { InstallMode } from '../../../utils/DependencyUtils';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();
const modDetails = inject<Ref<PackageListingDetailsResponseData | null>>('modDetails');
const versions = ref<PackageVersionsResponseData>([]);
const loading = ref(false);

const loadVersions = async () => {
    if (!modDetails?.value) return;

    try {
        loading.value = true;
        const activeGame = GameManager.activeGame;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;

        const result = await fetchPackageVersions({
            config: () => ({ apiHost }),
            params: {
                 namespace_id: modDetails.value!.namespace,
                 package_name: modDetails.value!.name
            },
            data: {},
            queryParams: undefined
        });
        versions.value = result;
    } catch (e) {
        console.error("Failed to load versions from separate endpoint, falling back to details", e);
        if (modDetails.value?.versions) {
            versions.value = modDetails.value.versions;
        }
    } finally {
        loading.value = false;
    }
};

const installVersion = async (ver: PackageVersionData) => {
    if (!modDetails?.value) return;
    
    // Validate we have what we need
    const activeGame = store.state.activeGame;
    const fullName = `${modDetails.value.namespace}-${modDetails.value.name}`;

    try {
        // We need the full ThunderstoreMod and ThunderstoreVersion (with dependencies)
        // We fetch these from the local index (PackageDb)
        
        // 1. Get Mod
        const mods = await PackageDb.getPackagesByNames(activeGame.internalFolderName, [fullName]);
        if (mods.length === 0) {
            throw new Error(`Mod ${fullName} not found in local index. Please update the mod list.`);
        }
        const tsMod = mods[0];

        // 2. Get Version
        const tsVersion = await PackageDb.getVersionAsThunderstoreVersion(
            activeGame.internalFolderName,
            fullName,
            ver.version_number
        );
        
        // 3. Prepare Combo
        const combos = [new ThunderstoreCombo()];
        combos[0].setMod(tsMod);
        combos[0].setVersion(tsVersion);

        // 4. Dispatch Install
        await store.dispatch('download/downloadAndInstallCombos', {
            combos,
            profile: store.getters['profile/activeProfile'].asImmutableProfile(),
            game: activeGame,
            installMode: InstallMode.INSTALL_SPECIFIC
        });

    } catch (e: any) {
        // Handle error (e.g. version not indexed yet)
        console.error("Install failed", e);
        store.commit('error/handleError', new R2Error(
            'Install failed',
            e.message || `Could not find version details for ${fullName} v${ver.version_number}. Try updating your mod list.`
        ));
    }
};

onMounted(() => {
    if (modDetails?.value) {
        loadVersions();
    }
});

watch(() => modDetails?.value, (newVal) => {
    if (newVal) {
        loadVersions();
    }
});

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>

<style lang="scss" scoped>
$surface-bg: #101028;
$text-secondary: #a7aed2;
$text-primary: #f5f5f6;
$card-border: #2d2d3a;
$button-secondary-bg: rgba(70, 70, 149, 0.66);

.tab-content {
    display: flex;
    flex: 1;
    margin: 24px;
}

.empty-placeholder {
    padding: 40px;
    text-align: center;
    color: $text-secondary;
    background: rgba(16, 16, 40, 0.4);
    border-radius: 4px;
    font-size: 14px;
    flex: 1;
}

.version-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}

.version-header, .version-item {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 60px;
    padding: 12px 16px;
    align-items: center;
    font-size: 14px;
}

.version-header {
    font-weight: 700;
    color: $text-secondary;
    border-bottom: 1px solid $card-border;
    margin-bottom: 8px;
}

.version-item {
    background-color: $surface-bg;
    border-radius: 4px;
    margin-bottom: 8px;
    color: $text-primary;
}

.ver-number { font-weight: 700; color: $text-primary; }
.ver-date { color: $text-secondary; font-size: 13px; }
.ver-dl { color: $text-secondary; font-size: 13px; }

.ver-actions {
    display: flex;
    justify-content: flex-end;
}

.btn-icon-sm {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $button-secondary-bg;
    color: $text-primary;
    border-radius: 4px;
    text-decoration: none;
    
    &:hover { opacity: 0.8; }
}
</style>