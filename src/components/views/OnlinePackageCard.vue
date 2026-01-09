<template>
    <div class="package-card" @click="openDetails">
        <div class="package-card__top">
            <div class="package-card__image-wrapper">
                <img :src="pkg.icon_url || 'https://thunderstore.io/static/img/defaults/icon-128.png'" 
                     class="package-card__image" 
                     alt="Mod Icon" />
            </div>
            
            <div class="package-card__badges">
                <div v-if="pkg.is_pinned" class="badge badge--pinned" title="Pinned">
                    <i class="fas fa-thumbtack"></i>
                </div>
                <div v-if="pkg.is_deprecated" class="badge badge--deprecated" title="Deprecated">
                    <i class="fas fa-ban"></i>
                </div>
                <div v-if="pkg.is_nsfw" class="badge badge--nsfw" title="NSFW">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
            </div>
        </div>
        
        <div class="package-card__content">
            <div class="package-card__header">
                <h3 class="package-card__title" :title="pkg.name">{{ pkg.name }}</h3>
                <div class="package-card__author" :title="pkg.namespace">by {{ pkg.namespace }}</div>
            </div>
            
            <p class="package-card__description">{{ pkg.description }}</p>
            
            <div class="package-card__categories">
                <span v-for="cat in (pkg.categories || []).slice(0, 3)" :key="cat.slug" class="tag">
                    {{ cat.name }}
                </span>
                <span v-if="(pkg.categories || []).length > 3" class="tag">+{{ pkg.categories.length - 3 }}</span>
            </div>
        </div>

        <div class="package-card__footer">
            <div class="package-card__stats">
                <div class="stat" title="Downloads">
                    <i class="q-icon material-icons">download</i>
                    <span>{{ formatNumber(pkg.download_count) }}</span>
                </div>
                <div class="stat" title="Likes">
                    <i class="q-icon material-icons">thumb_up</i>
                    <span>{{ formatNumber(pkg.rating_count) }}</span>
                </div>
            </div>

            <div class="actions">
                <div v-if="isInstalled" class="switch-toggle" @click.stop="toggleMod" title="Toggle Mod">
                    <div class="switch" :class="{ 'is-active': isEnabled }">
                        <div class="switch-handle"></div>
                    </div>
                </div>

                <button v-if="canUpdate" class="install-btn update-btn" @click.stop="updateMod" :disabled="installing" title="Update">
                    <i class="q-icon material-icons" :class="{'fa-spin': installing}">{{ installing ? 'autorenew' : 'system_update_alt' }}</i>
                </button>
                <button v-else-if="isInstalled" class="install-btn installed-btn" disabled title="Installed">
                    <i class="q-icon material-icons">check</i>
                </button>
                <button v-else class="install-btn" @click.stop="installMod" :disabled="installing" title="Install">
                    <i class="q-icon material-icons" :class="{'fa-spin': installing}">{{ installing ? 'autorenew' : 'download' }}</i>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import globalStore from '../../store'; // Fallback import (default export is the store instance)
import { fetchPackageListingDetails } from '../../r2mm/api/get/packageListingDetails';
import type { PackageListing } from '../../r2mm/api/schemas/objectSchemas';
import GameManager from '../../model/game/GameManager';
import ThunderstoreMod from '../../model/ThunderstoreMod';
import ManifestV2 from '../../model/ManifestV2';
import ProfileModList from '../../r2mm/mods/ProfileModList';
import { upsertPackageListChunk } from '../../r2mm/manager/PackageDexieStore';
import type { DexiePackage, DexieVersion } from '../../r2mm/manager/PackageDexieStoreMockables';

const props = defineProps<{
    pkg: PackageListing;
}>();

const router = useRouter();
const store = useStore() || globalStore; // Use global store as fallback if injection fails
const installing = ref(false);

const localMod = computed(() => {
    const modList = (store.state.profile.modList as ManifestV2[]) || [];
    const modId = `${props.pkg.namespace}-${props.pkg.name}`;
    return modList.find(m => m.getName() === modId);
});

const isInstalled = computed(() => !!localMod.value);
const isEnabled = computed(() => localMod.value?.isEnabled() ?? false);

const canUpdate = computed(() => {
    if (!localMod.value || !props.pkg.latest_version_number) return false;
    return localMod.value.getVersionNumber().toString() !== props.pkg.latest_version_number;
});

const openDetails = () => {
    router.push({
        name: 'manager.mod_details.details',
        params: {
            community: props.pkg.community_identifier,
            namespace: props.pkg.namespace,
            package: props.pkg.name
        }
    });
};

const toggleMod = async () => {
    if (!localMod.value) return;
    try {
        if (localMod.value.isEnabled()) {
            await ProfileModList.disableMod(localMod.value, store.state.profile.modList);
        } else {
            await ProfileModList.enableMod(localMod.value, store.state.profile.modList);
        }
    } catch (e) {
        console.error("Failed to toggle mod:", e);
    }
};

const updateMod = () => {
    installMod();
};

const installMod = async () => {
    if (installing.value) return;
    installing.value = true;
    try {
        const activeGame = GameManager.activeGame;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;
        
        let communityId = props.pkg.community_identifier || activeGame.internalFolderName;
        if (!communityId) {
             try {
                const packageIndexUrl = new URL(activeGame.thunderstoreUrl);
                const pathParts = packageIndexUrl.pathname.split('/');
                if (pathParts[1] === 'c' && pathParts[2]) {
                    communityId = pathParts[2];
                }
            } catch (e) {
                // Ignore
            }
        }

        const details = await fetchPackageListingDetails({
            config: () => ({ apiHost }),
            params: {
                community_id: communityId,
                namespace_id: props.pkg.namespace,
                package_name: props.pkg.name
            },
            data: {},
            queryParams: {}
        });

        const dexieVersions: DexieVersion[] = (details.versions || []).map(v => ({
            full_name: `${details.namespace}-${details.name}-${v.version_number}`,
            name: details.name,
            version_number: v.version_number,
            uuid4: '', 
            dependencies: [],
            description: details.description,
            icon: details.icon_url || '',
            is_active: true,
            downloads: v.download_count,
            download_url: v.download_url,
            website_url: details.website_url || '',
            file_size: 0,
            date_created: new Date(v.datetime_created)
        }));

        // Fallback if versions missing from API response (using top-level latest version info)
        if (dexieVersions.length === 0) {
            const dependencies = (details.dependencies || []).map(dep => `${dep.namespace}-${dep.name}-${dep.version_number}`);
            dexieVersions.push({
                full_name: details.full_version_name,
                name: details.name,
                version_number: details.latest_version_number,
                uuid4: '',
                dependencies: dependencies,
                description: details.description,
                icon: details.icon_url || '',
                is_active: true,
                downloads: details.download_count,
                download_url: details.download_url,
                website_url: details.website_url || '',
                file_size: details.size || 0,
                date_created: new Date(details.last_updated)
            });
        }
        
        const dexiePackage: DexiePackage = {
            full_name: `${details.namespace}-${details.name}`,
            owner: details.namespace,
            name: details.name,
            uuid4: '', 
            package_url: details.website_url || '',
            categories: details.categories.map(c => c.name),
            rating_score: details.rating_count,
            is_pinned: details.is_pinned,
            is_deprecated: details.is_deprecated,
            has_nsfw_content: details.is_nsfw,
            donation_link: details.team.donation_link || null,
            date_created: new Date(details.datetime_created),
            date_updated: new Date(details.last_updated),
            versions: dexieVersions,
            community: activeGame.internalFolderName,
            date_fetched: new Date()
        };

        await upsertPackageListChunk(activeGame.internalFolderName, [dexiePackage]);

        const mod = ThunderstoreMod.parseFromThunderstoreData({
            ...dexiePackage,
            versions: dexieVersions
        });

        store.commit("openDownloadModVersionSelectModal", mod);
    } catch (e) {
        console.error("Failed to prepare install:", e);
    } finally {
        installing.value = false;
    }
};

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};
</script>

<style lang="scss" scoped>
.package-card {
    display: flex;
    flex-direction: column;
    background-color: rgba(57, 57, 106, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    height: 100%;
    position: relative;
    overflow: hidden;

    &:hover {
        background-color: rgba(57, 57, 106, 0.3);
        transform: translateY(-2px);
        border-color: rgba(35, 255, 171, 0.3);

        .package-card__image-wrapper {
            filter: brightness(1.2);
        }

        .package-card__image {
            transform: scale(1.035);
        }
    }
}

.package-card__top {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background-color: #070721;
    overflow: hidden;
}

.package-card__image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: filter 0.2s ease-out;
}

.package-card__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease-out;
}

.package-card__badges {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
}

.badge {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    
    &--pinned { background-color: #083149; color: #bbe3fc; }
    &--deprecated { background-color: #450a0a; color: #fca5a5; }
    &--nsfw { background-color: #422006; color: #fdba74; }
}

.package-card__content {
    padding: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.package-card__header {
    margin-bottom: 4px;
}

.package-card__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f5f5f6;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.package-card__author {
    font-size: 12px;
    color: #23ffab;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

.package-card__description {
    margin: 0;
    font-size: 13px;
    color: #a7aed2;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    flex: 1;
}

.package-card__categories {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: auto;
    
    .tag {
        font-size: 10px;
        background-color: rgba(70, 70, 149, 0.3);
        color: #cbd0ec;
        padding: 2px 8px;
        border-radius: 4px;
        white-space: nowrap;
    }
}

.package-card__footer {
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(0, 0, 0, 0.2);
}

.package-card__stats {
    display: flex;
    gap: 12px;
    
    .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #7d84a8;
        
        .q-icon { font-size: 14px; }
        span { font-weight: 600; }
    }
}

.install-btn {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: none;
    background-color: #23ffab;
    color: #031912;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s;
    
    &:hover { opacity: 0.9; }
    &:disabled { background-color: #374151; color: #9ca3af; cursor: not-allowed; }
    
    .q-icon { font-size: 18px; }
    .fa-spin { animation: fa-spin 2s infinite linear; }
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.switch-toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
    
    .switch {
        width: 32px;
        height: 18px;
        background-color: #374151;
        border-radius: 99px;
        position: relative;
        transition: background-color 0.2s;
        
        &.is-active {
            background-color: #23ffab;
            
            .switch-handle {
                transform: translateX(14px);
                background-color: #031912;
            }
        }
    }
    
    .switch-handle {
        width: 14px;
        height: 14px;
        background-color: #9ca3af;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform 0.2s, background-color 0.2s;
    }
}

.installed-btn {
    background-color: transparent;
    border: 1px solid #23ffab;
    color: #23ffab;
    cursor: default;
    opacity: 1;
    
    &:hover { opacity: 1; }
}

@keyframes fa-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>