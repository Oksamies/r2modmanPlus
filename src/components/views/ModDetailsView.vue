<template>
    <div class="island cyberstorm-container cyberstorm-container--y mod-details-view">
        <GameHeader />
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading mod details...</p>
        </div>
        <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ error }}</p>
        </div>
        <div v-else-if="details" class="cyberstorm-container cyberstorm-container--y">
            <!-- Header Section -->
            <div class="header-base" id="header-base">
                <div class="cyberstorm-container cyberstorm-container--y header-sticky-wrapper" :class="{ 'is-sticky': isSticky }">
                
                    <!-- COMPACT STICKY HEADER -->
                    <div v-if="isSticky" class="header-sticky-content">
                        <div class="sticky-left">
                            <div class="sticky-icon-container">
                                <img :src="details.icon_url || 'https://thunderstore.io/static/img/defaults/icon-128.png'" 
                                     class="sticky-icon" 
                                     alt="Mod Icon" />
                            </div>
                            <div class="sticky-info">
                                <div class="sticky-title">{{ details.name }}</div>
                                <div class="sticky-author">
                                    <span class="by-text">by</span>
                                    <span class="author-text">{{ details.namespace }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="sticky-right">
                             <!-- Switch for Installed Mod (Compact) -->
                            <div v-if="isInstalled" class="switch-container-compact" @click="toggleEnabled" :title="localMod?.isEnabled() ? 'Disable Mod' : 'Enable Mod'">
                                <div class="b-switch-compact" :class="{ 'is-active': localMod?.isEnabled() }">
                                    <div class="switch-handle-compact"></div>
                                </div>
                            </div>

                             <!-- Actions (Compact) -->
                            <div class="sticky-actions">
                                <button v-if="!isInstalled" class="btn-compact btn-compact--primary" @click="installMod" :disabled="installing">
                                    <i class="fas" :class="installing ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                                </button>
                                <button v-else class="btn-compact btn-compact--secondary" @click="checkUpdates">
                                     <i class="fas fa-sync-alt"></i>
                                </button>
                                
                                <button class="btn-compact btn-icon-only">
                                     <i class="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- FULL HEADER -->
                    <div v-else class="island-item header-full-content">
                        <div class="header-image-container">
                            <img :src="details.icon_url || 'https://thunderstore.io/static/img/defaults/icon-128.png'" 
                                 class="header-icon" 
                                 alt="Mod Icon" />
                        </div>
                        
                        <div class="header-info">
                            <div class="title-row">
                                <h1 class="mod-title">{{ details.name }}</h1>
                                <div class="tags-container" v-if="hasTags">
                                    <div v-if="details.is_pinned" class="tag-pill tag-pill--pinned">
                                        <i class="fas fa-thumbtack tag-icon"></i>
                                        <span>Pinned</span>
                                    </div>
                                    <div v-if="details.is_deprecated" class="tag-pill tag-pill--deprecated">
                                        <i class="fas fa-ban tag-icon"></i>
                                        <span>Deprecated</span>
                                    </div>
                                    <div v-if="details.is_nsfw" class="tag-pill tag-pill--nsfw">
                                        <i class="fas fa-exclamation-circle tag-icon"></i>
                                        <span>NSFW</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="author-row">
                                <span class="by-label">by</span>
                                <span class="author-name">{{ details.namespace }}</span>
                            </div>

                            <div class="description-row">
                                <p class="description">{{ details.description }}</p>
                            </div>
                        </div>

                        <div class="header-actions">
                            <div class="action-buttons">
                                <!-- Switch for Installed Mod -->
                                <div v-if="isInstalled" class="switch-module">
                                    <div class="b-switch-lg" :class="{ 'is-active': localMod?.isEnabled() }" @click="toggleEnabled">
                                        <div class="switch-handle-lg"></div>
                                    </div>
                                    <div class="switch-tooltip">
                                        <div class="tooltip-content">{{ localMod?.isEnabled() ? 'Enabled' : 'Disabled' }}</div>
                                        <div class="tooltip-arrow"></div>
                                    </div>
                                </div>

                                <div v-if="isInstalled" class="ver-divider"></div>

                                <!-- Update / Install Buttons -->
                                <button v-if="!isInstalled" class="btn btn--primary" @click="installMod" :disabled="installing">
                                    <i class="fas" :class="installing ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                                    <span>{{ installing ? 'Installing...' : 'Install' }}</span>
                                </button>
                                <button v-else class="btn btn--secondary" @click="checkUpdates"> <!-- Placeholders for specific Update logic -->
                                    <i class="fas fa-sync-alt"></i>
                                    <span>Update</span>
                                </button>
                            
                                <div class="icon-actions">
                                    <button class="btn-icon-box" title="More">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                     <a v-if="details.team.donation_link" :href="details.team.donation_link" target="_blank" class="btn-icon-box btn-icon-box--secondary" title="Donate to Author">
                                        <i class="fas fa-heart"></i>
                                    </a>
                                     <button class="btn-icon-box btn-icon-box--secondary" title="Like">
                                        <i class="fas fa-thumbs-up"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                     
                    <!-- Footer Meta -->
                    <div v-if="!isSticky" class="island-item header-footer">
                        <div class="footer-tags">
                             <div class="tag-pill-sm" v-for="cat in (details.categories || []).slice(0, 5)" :key="cat.name">
                                {{ cat.name }}
                             </div>
                             <div v-if="(details.categories || []).length > 5" class="tag-pill-sm">
                                +{{ details.categories.length - 5 }} more
                             </div>
                        </div>
                        <div class="footer-meta">
                             <div class="footer-meta-item">
                                <i class="fas fa-history"></i>
                                <span>{{ timeAgo(details.last_updated) }}</span>
                            </div>
                            <div class="footer-meta-item">
                                <i class="fas fa-download"></i>
                                <span>{{ formatNumber(details.download_count) }}</span>
                            </div>
                             <div class="footer-meta-item">
                                <i class="fas fa-thumbs-up"></i>
                                <span>{{ formatNumber(details.rating_count) }}</span>
                            </div>
                             <div class="footer-meta-item">
                                <i class="fas fa-hdd"></i>
                                <span>{{ formatFileSize(details.size) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Navigation -->
                    <div v-if="!isSticky" class="island-item tab-navigation">
                        <router-link 
                            v-for="tab in tabs" 
                            :key="tab.id"
                            :to="{ name: tab.routeName, params: route.params }"
                            class="tab-item" 
                            exact-active-class="is-active"
                        >
                            {{ tab.label }}
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="island-item content-section mod-details-tabs">
                <router-view></router-view>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, provide } from 'vue';
import { useRoute } from 'vue-router';
import GameHeader from '../GameHeader.vue';
import { useStore } from 'vuex';
import store from '../../store'; // Import direct store instance if injection fails, though uncommon.
import GameManager from '../../model/game/GameManager';
import { fetchPackageListingDetails } from '../../r2mm/api/get/packageListingDetails';
import type { PackageListingDetailsResponseData } from '../../r2mm/api/schemas/responseSchemas';
import ThunderstoreMod from '../../model/ThunderstoreMod';
import { upsertPackageListChunk } from '../../r2mm/manager/PackageDexieStore';
import type { DexiePackage, DexieVersion } from '../../r2mm/manager/PackageDexieStoreMockables';
import ManifestV2 from '../../model/ManifestV2';

const route = useRoute();
// fallback to direct import if useStore() is null/undefined (happens in some mixed contexts)
const storeInstance = useStore() || store;
const details = ref<PackageListingDetailsResponseData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const installing = ref(false);
const isSticky = ref(false);

// Provide Mod Details to child components
provide('modDetails', details);

const localModList = computed(() => storeInstance.state.profile.modList as ManifestV2[]);

const localMod = computed(() => {
    if (!details.value) return null;
    return localModList.value.find(m => {
        const modName = m instanceof ManifestV2 ? m.getName() : (m as any).name;
        const modAuthor = m instanceof ManifestV2 ? m.getAuthorName() : (m as any).authorName;
        return modName === details.value?.name && modAuthor === details.value?.namespace;
    }) || null;
});

const isInstalled = computed(() => !!localMod.value);

const hasTags = computed(() => {
    if (!details.value) return false;
    return details.value.is_pinned || details.value.is_deprecated || details.value.is_nsfw;
});

const tabs = computed(() => {
    if (!details.value) return [];
    
    return [
        { id: 'details', label: 'Details', routeName: 'manager.mod_details.details' },
        { id: 'required', label: `Required (${details.value.dependencies?.length || 0})`, routeName: 'manager.mod_details.required' },
        { id: 'wiki', label: 'Wiki', routeName: 'manager.mod_details.wiki' },
        { id: 'changelog', label: 'Changelog', routeName: 'manager.mod_details.changelog' },
        { id: 'versions', label: `Versions (${details.value.versions?.length || 0})`, routeName: 'manager.mod_details.versions' },
    ];
});

onMounted(async () => {
    await loadDetails();
    
    // Setup intersection observer or scroll listener for sticky state
    const scrollContainer = document.querySelector('.mod-details-view');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
    }
});

const handleScroll = (e: Event) => {
    // Simple logic: if scrolled past a threshold, enable sticky mode styling
    const target = e.target as HTMLElement;
    if (target.scrollTop > 50) {
        isSticky.value = true;
    } else {
        isSticky.value = false;
    }
};

watch(() => route.params, async (newParams, oldParams) => {
    // Only reload details if package changed, no need to reload on tab change
    if (newParams.package !== oldParams.package || newParams.namespace !== oldParams.namespace) {
        await loadDetails();
    }
});

const loadDetails = async () => {
    // If we already have the correct package loaded (e.g. from tab navigation), don't reload
    if (details.value 
        && details.value.namespace === route.params.namespace 
        && details.value.name === route.params.package) {
            return;
    }

    loading.value = true;
    details.value = null;
    error.value = null;

    try {
        const activeGame = GameManager.activeGame;
        const communityId = route.params.community as string;
        const namespaceId = route.params.namespace as string;
        const packageName = route.params.package as string;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;

        if (!namespaceId || !packageName) {
           // Not a valid packet request
        }

        let actualCommunityId = communityId || activeGame.internalFolderName;
        if (!communityId) {
             try {
                const packageIndexUrl = new URL(activeGame.thunderstoreUrl);
                const pathParts = packageIndexUrl.pathname.split('/');
                if (pathParts[1] === 'c' && pathParts[2]) {
                    actualCommunityId = pathParts[2];
                }
            } catch (e) {
                // Ignore
            }
        }

        const result = await fetchPackageListingDetails({
            config: () => ({
                apiHost: apiHost
            }),
            params: {
                community_id: actualCommunityId,
                namespace_id: namespaceId,
                package_name: packageName
            },
            data: {}, 
            queryParams: {}
        });
        details.value = result;

    } catch (e: any) {
        console.error(e);
        const errorMsg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error occurred');
        error.value = errorMsg || "Failed to load mod details";
    } finally {
        loading.value = false;
    }
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
}

const installMod = async () => {
    if (!details.value || installing.value) return;
    
    installing.value = true;
    try {
        const activeGame = GameManager.activeGame;
        const d = details.value;

        // Create Legacy Dexie Package Structure
        const dexieVersions: DexieVersion[] = (d.versions || []).map(v => ({
            full_name: `${d.namespace}-${d.name}-${v.version_number}`,
            name: d.name,
            version_number: v.version_number,
            uuid4: '', 
            dependencies: [],
            description: d.description,
            icon: d.icon_url || '',
            is_active: true,
            downloads: v.download_count,
            download_url: v.download_url,
            website_url: d.website_url || '',
            file_size: 0,
            date_created: new Date(v.datetime_created)
        }));

        // Fallback if versions missing from API response (using top-level latest version info)
        if (dexieVersions.length === 0) {
            const dependencies = (d.dependencies || []).map(dep => `${dep.namespace}-${dep.name}-${dep.version_number}`);
            dexieVersions.push({
                full_name: d.full_version_name,
                name: d.name,
                version_number: d.latest_version_number,
                uuid4: '',
                dependencies: dependencies,
                description: d.description,
                icon: d.icon_url || '',
                is_active: true,
                downloads: d.download_count,
                download_url: d.download_url,
                website_url: d.website_url || '',
                file_size: d.size,
                date_created: new Date(d.last_updated)
            });
        }
        
        const dexiePackage: DexiePackage = {
            full_name: `${d.namespace}-${d.name}`,
            owner: d.namespace,
            name: d.name,
            uuid4: '', 
            package_url: d.website_url || '',
            categories: d.categories.map(c => c.name),
            rating_score: d.rating_count,
            is_pinned: d.is_pinned,
            is_deprecated: d.is_deprecated,
            has_nsfw_content: d.is_nsfw,
            donation_link: d.team.donation_link || null,
            date_created: new Date(d.datetime_created),
            date_updated: new Date(d.last_updated),
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
        console.error("Failed to start install", e);
    } finally {
        installing.value = false;
    }
};

const uninstallMod = async () => {
    if (!localMod.value) return;
    store.dispatch('profile/uninstallModsFromActiveProfile', {
        mods: [localMod.value]
    });
};

const checkUpdates = async () => {
    // Placeholder - navigate to updates or trigger update logic
    console.log("Check updates clicked");
};

const toggleEnabled = async () => {
    if (!localMod.value) return;
    if (localMod.value.isEnabled()) {
        store.dispatch('profile/disableModsFromActiveProfile', { mods: [localMod.value] });
    } else {
        store.dispatch('profile/enableModsOnActiveProfile', { mods: [localMod.value] });
    }
};
</script>

<style lang="scss" scoped>
// Variables based on Figma Tokens
$surface-bg: #101028; // Island bg color
$main-bg: #0b0c10;
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$accent-green: #23ffab;
$accent-green-dark: #031912;
$danger-red: #ef4444;
$tag-pinned-bg: #083149;
$tag-pinned-text: #bbe3fc;
$card-border: #2d2d3a; // Approx
$button-secondary-bg: rgba(70, 70, 149, 0.66);
$tooltip-bg: #333370;

.mod-details-view {
    padding: 0;
    height: 100%;
    overflow-y: auto; // Still needed for overall page scrolling
    color: $text-primary;
    background-color: transparent;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
}

.loading-state, .error-state {
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: $text-secondary;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.error-state {
    color: $danger-red;
    i { font-size: 32px; margin-bottom: 16px; }
}

/* Header Base Wrapper */
.header-base {
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-sticky-wrapper {
    background-color: transparent; 
    transition: all 0.3s ease;
    border-radius: 8px;

    &.is-sticky {
        background-color: $surface-bg;
        padding: 0 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
}

.header-sticky-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    
    .sticky-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .sticky-icon-container {
        width: 44px;
        height: 44px;
        background-color: rgba(59, 63, 125, 0.24);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sticky-icon { width: 100%; height: 100%; object-fit: cover; }
    .sticky-info { display: flex; flex-direction: column; justify-content: center; }
    .sticky-title {
        font-family: 'Hubot-Sans', sans-serif;
        font-weight: 700;
        font-size: 18px;
        color: $text-primary;
        line-height: normal;
    }
    .sticky-author {
        font-size: 12px;
        line-height: 1.2;
        .by-text { color: $text-secondary; font-weight: 700; margin-right: 4px; }
        .author-text { color: #39e9aa; font-weight: 700; }
    }
    .sticky-right { display: flex; align-items: center; gap: 12px; }
    .sticky-actions { display: flex; align-items: center; gap: 8px; }
}

.switch-container-compact { cursor: pointer; display: flex; align-items: center; }
.b-switch-compact {
    width: 44px; height: 28px; background-color: #374151; border-radius: 999px; position: relative; transition: background-color 0.2s;
    &.is-active { background-color: $accent-green; .switch-handle-compact { transform: translateX(100%); left: auto; right: 4px; } }
}
.switch-handle-compact {
    width: 20px; height: 20px; background-color: #f5f5f6; border-radius: 50%; position: absolute; top: 4px; left: 4px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.btn-compact {
    width: 40px; height: 40px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity 0.2s;
    &--primary { background-color: $accent-green; color: $accent-green-dark; }
    &--secondary { background-color: $button-secondary-bg; color: $text-primary; }
}
.btn-icon-only {
    width: 40px; height: 40px; background: transparent; color: $text-secondary; border: none; font-size: 16px; cursor: pointer;
    &:hover { color: $text-primary; }
}

.header-full-content {
    display: flex; gap: 24px; align-items: flex-start; padding: 24px; background-color: $surface-bg; border-radius: 8px 8px 0 0;
}
.header-image-container {
    width: 128px; height: 128px; background-color: rgba(61, 61, 127, 0.44); border-radius: 8px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.header-icon { width: 100%; height: 100%; object-fit: cover; }
.header-info { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.title-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.mod-title { margin: 0; font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700; color: $text-primary; line-height: normal; }
.tags-container { display: flex; gap: 4px; flex-wrap: wrap; }
.tag-pill {
    display: flex; align-items: center; gap: 6px; height: 20px; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase;
    i { font-size: 10px; }
    &--pinned { background-color: $tag-pinned-bg; color: $tag-pinned-text; i { color: $tag-pinned-text; } }
    &--deprecated { background-color: #450a0a; color: #fca5a5; }
    &--nsfw { background-color: #422006; color: #fdba74; }
}
.author-row { display: flex; gap: 4px; font-size: 14px; align-items: center; }
.by-label { color: $text-secondary; font-weight: 400; }
.author-name { color: $accent-green; font-weight: 700; }
.description-row .description { color: $text-secondary; font-size: 14px; line-height: 1.5; margin: 0; }

.header-actions { display: flex; flex-direction: column; align-items: flex-end; padding-left: 32px; }
.action-buttons { display: flex; gap: 12px; align-items: center; }
.switch-module { display: flex; flex-direction: column; align-items: center; position: relative; height: 28px; }
.b-switch-lg { @extend .b-switch-compact; cursor: pointer; }
.switch-handle-lg { @extend .switch-handle-compact; }
.switch-tooltip {
    position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background-color: $tooltip-bg; padding: 6px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 20;
    .tooltip-content { font-size: 14px; color: $text-primary; }
}
.ver-divider { width: 1px; height: 28px; background-color: #3c3c86; }
.btn {
    display: flex; align-items: center; justify-content: center; gap: 16px; height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s;
    &--primary { background-color: $accent-green; color: $accent-green-dark; &:hover { opacity: 0.9; } }
    &--secondary { background-color: $button-secondary-bg; color: $text-primary; &:hover { opacity: 0.9; } }
}
.icon-actions { display: flex; gap: 8px; align-items: center; }
.btn-icon-box {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; background: transparent; cursor: pointer; color: $text-secondary; font-size: 16px;
    &--secondary { background-color: $button-secondary-bg; color: $text-primary; }
    &:hover { opacity: 0.8; }
}

.header-footer {
    display: flex; align-items: center; gap: 16px; padding: 16px 24px; background-color: $surface-bg; border-radius: 0 0 8px 8px; margin-top: -1px;
}
.footer-tags { display: flex; gap: 4px; margin-right: auto; }
.tag-pill-sm {
    background-color: $button-secondary-bg; height: 20px; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; color: $text-primary; display: flex; align-items: center; justify-content: center;
}
.footer-meta { display: flex; gap: 32px; align-items: center; }
.footer-meta-item {
    display: flex; align-items: center; gap: 6px; color: $text-secondary; font-size: 12px;
    i { font-size: 12px; width: 14px; text-align: center; }
    span { font-weight: 700; }
}

.tab-navigation {
    display: flex;
    overflow-x: auto;
    border-bottom: 2px solid $card-border;
    margin: 0;
    margin-top: 8px;
    gap: 4px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.tab-item {
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: $text-secondary;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    text-decoration: none; // Link style reset
    
    &:hover {
        color: $text-primary;
    }

    &.is-active {
        color: $accent-green;
        border-bottom-color: $accent-green;
    }
}

.content-section {
    display: grid;
    gap: 32px;
}

.mod-details-tabs {
    display: flex;
    flex: 1;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}
</style>
