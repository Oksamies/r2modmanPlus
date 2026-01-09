<template>
  <div class="package-list">
    <div class="package-list__controls">
      <!-- Shared Search (Styled for Cyberstorm) -->
      <div class="package-list__tools-wrapper">
          <div class="package-list__search-group">
            <div class="package-list__search">
                <i class="q-icon material-icons">search</i>
                <input 
                type="text" 
                v-model="searchQuery" 
                @keyup.enter="performSearch"
                placeholder="Search..." 
                />
            </div>
            <!-- Filter Button (Visual only for now, triggers same filters) -->
            <button class="package-list__btn-secondary" @click="activeFilter = activeFilter === 'All' ? 'Updates' : 'All'">
                <i class="q-icon material-icons">filter_list</i>
                <span>Filters</span>
            </button>
          </div>

          <!-- Installed Mode Specific Tools -->
          <div class="package-list__actions-group" v-if="mode === 'installed'">
             <button class="package-list__btn-secondary" @click="$emit('check-updates')">
                 Check for updates
             </button>
             
             <div class="package-list__view-toggle">
                 <button 
                    class="package-list__toggle-btn" 
                    :class="{ 'active': viewMode === 'grid' }"
                    @click="viewMode = 'grid'"
                    title="Show as grid"
                 >
                     <i class="q-icon material-icons">grid_view</i>
                 </button>
                 <button 
                    class="package-list__toggle-btn"
                    :class="{ 'active': viewMode === 'list' }"
                    @click="viewMode = 'list'"
                    title="Show as list"
                 >
                     <i class="q-icon material-icons">view_list</i>
                 </button>
             </div>

             <button class="package-list__btn-secondary icon-only" title="Mass edit">
                 <i class="q-icon material-icons">build</i>
             </button>
          </div>

          <!-- Online Mode Sort (Legacy) -->
          <div class="package-list__sort" v-if="mode === 'online'">
            <span class="package-list__sort-label">Sort by:</span>
            <div class="package-list__select-wrapper">
                <select v-model="ordering" @change="performSearch">
                    <option :value="Order.Updated">Last Updated</option>
                    <option :value="Order.Created">Newest</option>
                    <option :value="Order.Downloaded">Most Downloaded</option>
                    <option :value="Order.Rated">Top Rated</option>
                </select>
                <i class="q-icon material-icons">expand_more</i>
            </div>
          </div>
      </div>
      
      <!-- Legacy Filter Bar (Only for Online or if user wants to see granular filters) -->
      <div class="package-list__filters" v-if="mode === 'online'">
           <label class="package-list__checkbox-filter">
             <input type="checkbox" v-model="nsfw" @change="performSearch">
             <span>NSFW</span>
           </label>
           
           <label class="package-list__checkbox-filter">
             <input type="checkbox" v-model="deprecated" @change="performSearch">
             <span>Deprecated</span>
           </label>
      </div>
    </div>

    <div class="package-list__content" ref="scrollContainer">
      <template v-if="mode === 'online'">
        <div v-if="loading && onlinePackages.length === 0" class="package-list__loading">
            Loading...
        </div>
        <div v-else-if="error" class="package-list__error">
            {{ error }}
        </div>
        <div v-else class="package-list__grid">
            <OnlinePackageCard 
                v-for="pkg in onlinePackages" 
                :key="pkg.namespace + '-' + pkg.name" 
                :pkg="pkg" 
            />
        </div>
        
        <div v-if="loading && onlinePackages.length > 0" class="package-list__loading-more">
            Loading more...
        </div>
        
        <button v-if="hasMore && !loading" @click="loadMore" class="package-list__load-more-btn">
            Load More
        </button>
      </template>

      <template v-else>
        <!-- Figma Design Implementation for Installed Mods -->
        <div class="package-list__installed-view">
             <!-- Column Headers -->
            <div class="package-list__header-row">
                <div class="package-list__col-mod">
                    Mod <i class="q-icon material-icons">keyboard_arrow_down</i>
                </div>
                <div class="package-list__col-author">Author</div>
                <div class="package-list__col-version">Version</div>
                <div class="package-list__col-categories">Categories</div>
                <div class="package-list__col-enabled">Enabled</div>
                <div class="package-list__col-more"></div>
            </div>

            <!-- List Items -->
            <div class="package-list__rows">
                <div class="package-list__row" v-for="pkg in installedPackages" :key="pkg.id">
                    
                    <!-- Mod Info Column -->
                    <div class="package-list__col-mod">
                         <div class="package-list__img-container">
                            <img :src="pkg.image" class="package-list__img" />
                         </div>
                         <div class="package-list__info">
                             <div class="package-list__title">{{ pkg.name }}</div>
                             <div class="package-list__desc" :title="pkg.description">{{ pkg.description }}</div>
                         </div>
                    </div>

                    <!-- Author Column -->
                    <div class="package-list__col-author">
                        <span class="package-list__text-link">{{ pkg.author }}</span>
                    </div>

                    <!-- Version Column -->
                    <div class="package-list__col-version">
                        {{ pkg.version }}
                    </div>

                     <!-- Categories Column -->
                    <div class="package-list__col-categories">
                         <div class="package-list__tags">
                            <span v-for="tag in pkg.tags.slice(0, 3)" :key="tag" class="package-list__pill">
                                {{ tag }}
                            </span>
                             <span v-if="pkg.tags.length > 3" class="package-list__pill">...</span>
                         </div>
                    </div>

                    <!-- Enabled Column -->
                     <div class="package-list__col-enabled">
                        <!-- Custom Switch -->
                        <label class="package-list__switch-new" :class="{ 'disabled': pkg.isModLoader }">
                            <input 
                                type="checkbox" 
                                :checked="pkg.enabled" 
                                @change="togglePackage(pkg)" 
                                :disabled="pkg.isModLoader" 
                            />
                            <div class="slider-new"></div>
                        </label>
                    </div>

                    <!-- More Menu Column -->
                    <div class="package-list__col-more">
                         <!-- Placeholder for 'more' menu -->
                    </div>

                </div>
            </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import GameManager from '../model/game/GameManager';
import { fetchCommunityPackageListings } from '../r2mm/api/get/communityPackageListings';
import { PackageListingsOrderingEnum } from '../r2mm/api/schemas/queryParamSchemas';
import type { PackageListing } from '../r2mm/api/schemas/objectSchemas';
import OnlinePackageCard from './views/OnlinePackageCard.vue';
import ManifestV2 from '../model/ManifestV2';
import R2Error from '../model/errors/R2Error';
import { LogSeverity } from '../providers/ror2/logging/LoggerProvider';

const store = getStore<State>();

const props = defineProps<{
  mode: 'installed' | 'online';
}>();

// Shared State
const activeFilter = ref('All');
const searchQuery = ref('');

// Online Mode State
const onlinePackages = ref<PackageListing[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const ordering = ref(PackageListingsOrderingEnum.Updated);
const nsfw = ref(false);
const deprecated = ref(false);
const page = ref(1);
const hasMore = ref(false);
const Order = PackageListingsOrderingEnum;

// Installed Mode Logic
const localFilters = ['All', 'Updates', 'Disabled', 'Deprecated'];
const viewMode = ref<'list' | 'grid'>('list');

const rawInstalledPackages = computed(() => {
    return (store.getters['profile/visibleModList'] as ManifestV2[]) || [];
});

const installedPackages = computed(() => {
    let mods = rawInstalledPackages.value;

    // Apply Local Filter
    if (activeFilter.value === 'Updates') {
        mods = mods.filter(mod => !store.getters['tsMods/isLatestVersion'](mod));
    } else if (activeFilter.value === 'Disabled') {
        mods = mods.filter(mod => !mod.isEnabled());
    } else if (activeFilter.value === 'Deprecated') {
        mods = mods.filter(mod => store.state.tsMods.deprecated.get(mod.getName()));
    }

    return mods.map(mod => {
        const tsMod = store.getters['tsMods/tsMod'](mod);
        const isLatest = store.getters['tsMods/isLatestVersion'](mod);
        const isDeprecated = store.state.tsMods.deprecated.get(mod.getName());
        
        return {
            id: mod.getName(), 
            name: mod.getDisplayName(),
            author: mod.getAuthorName(),
            description: mod.getDescription(),
            image: mod.getIcon(),
            tags: [
               ...(tsMod?.getCategories() || []),
            ],
            version: mod.getVersionNumber().toString(),
            enabled: mod.isEnabled(),
            isLatest,
            isDeprecated,
            isModLoader: store.getters['isModLoader'](mod.getName()),
            manifest: mod,
        };
    });
});

// Methods
const fetchPackages = async (reset = false) => {
    if (props.mode !== 'online') return;
    if (loading.value) return;
    
    loading.value = true;
    error.value = null;

    if (reset) {
        onlinePackages.value = [];
        page.value = 1;
    }

    try {
        const activeGame = GameManager.activeGame;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;

        // Try to find the community identifier from the packageIndex URL if available
        // as internally we might use CamelCase while API expexts kebab-case
        let communityId = activeGame.internalFolderName;
        try {
            const packageIndexUrl = new URL(activeGame.thunderstoreUrl);
            const pathParts = packageIndexUrl.pathname.split('/');
            // Expected format: /c/community-slug/api/v1/...
            // Index 0 is empty, index 1 is 'c', index 2 is the slug
            if (pathParts[1] === 'c' && pathParts[2]) {
                communityId = pathParts[2];
            }
        } catch (e) {
            console.warn("Failed to extract community slug from URL", e);
        }

        const result = await fetchCommunityPackageListings({
            config: () => ({
                apiHost: apiHost,
                sessionId: undefined
            }),
            params: {
                community_id: communityId
            },
            data: {},
            queryParams: [
                { key: "ordering", value: ordering.value, impotent: PackageListingsOrderingEnum.Updated },
                { key: "page", value: page.value, impotent: 1 },
                { key: "q", value: searchQuery.value },
                { key: "nsfw", value: nsfw.value, impotent: false },
                { key: "deprecated", value: deprecated.value, impotent: false }
            ]
        });

        onlinePackages.value = [...onlinePackages.value, ...result.results];
        
        // Check if there is a next page
        hasMore.value = !!result.next;
        if (hasMore.value) {
            page.value++;
        }

    } catch (e: any) {
        console.error("Failed to fetch packages:", e);
        error.value = e.message || "Failed to load packages. Please try again.";
    } finally {
        loading.value = false;
    }
};

const performSearch = () => {
    if (props.mode === 'online') {
        fetchPackages(true);
    } else {
        store.commit('profile/setSearchQuery', searchQuery.value);
    }
};

watch(searchQuery, (newVal) => {
    if (props.mode === 'installed') {
         store.commit('profile/setSearchQuery', newVal);
    }
});

const togglePackage = async (pkg: any) => {
    const mod = pkg.manifest as ManifestV2;
    // Prevent toggling if it's a modloader or locked
    if (store.getters['isModLoader'](mod.getName())) return;

    try {
        if (mod.isEnabled()) {
            await store.dispatch('profile/disableModsFromActiveProfile', { mods: [mod] });
        } else {
             await store.dispatch('profile/enableModsOnActiveProfile', { mods: [mod] });
        }
    } catch (e: any) {
         store.commit('error/handleError', {
            error: R2Error.fromThrownValue(e),
            severity: LogSeverity.WARN
        });
    }
}

const loadMore = () => {
    fetchPackages();
};

// Lifecycle
onMounted(() => {
    if (props.mode === 'online') {
        fetchPackages(true);
    }
});

// Watch mode change if component is kept alive but props change
watch(() => props.mode, (newMode) => {
    if (newMode === 'online' && onlinePackages.value.length === 0) {
        fetchPackages(true);
    }
});

</script>

<style lang="scss" scoped>
.package-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #fff;
  overflow: hidden;

  &__controls {
    display: flex;
    flex-direction: column;
    padding: 1rem 2rem;
    gap: 1rem;
    border-bottom: 1px solid #262639;
  }

  &__tools-wrapper {
      display: flex;
      align-items: center;
      gap: 24px;
      width: 100%;
  }

  &__search-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
  }

  &__actions-group {
      display: flex;
      align-items: center;
      gap: 24px;
  }

  &__search {
    display: flex;
    align-items: center;
    background-color: rgba(59, 63, 125, 0.24);
    border: 1px solid rgba(70, 70, 149, 0.66);
    border-radius: 8px;
    padding: 0 1rem;
    flex: 1;
    max-width: 400px;
    min-width: 144px;
    height: 36px;
    box-sizing: border-box;

    .q-icon {
      color: #a7aed2;
      margin-right: 16px;
      font-size: 16px;
    }

    input {
      background: none;
      border: none;
      color: #f5f5f6;
      width: 100%;
      outline: none;
      font-size: 16px;

      &::placeholder {
        color: #a7aed2;
      }
    }
  }

  &__btn-secondary {
      height: 36px;
      padding: 0 12px;
      gap: 12px;
      background-color: rgba(70, 70, 149, 0.66);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      color: #f5f5f6;
      font-weight: 700;
      font-size: 14px;
      transition: filter 0.2s;

      &:hover {
          filter: brightness(1.1);
      }

      .q-icon {
          font-size: 14px;
      }

      &.icon-only {
          width: 36px;
          padding: 0;
          
          .q-icon {
              font-size: 16px;
          }
      }
  }

  &__view-toggle {
      display: flex;
      align-items: center;
      gap: 2px;
  }

  &__toggle-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      background-color: rgba(70, 70, 149, 0.66);
      color: #f5f5f6;
      transition: background-color 0.2s;

      &:first-child {
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
      }

      &:last-child {
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
      }

      &.active {
          background-color: #623bce;
      }

      .q-icon {
          font-size: 16px;
      }
  }

  &__filters {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  &__sort {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__sort-label {
      color: #9ca3af;
      font-size: 0.9rem;
  }

  &__select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background-color: #111121;
      border: 1px solid #262639;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;

      select {
          background: none;
          border: none;
          color: #fff;
          outline: none;
          appearance: none;
          padding-right: 1.5rem;
          cursor: pointer;
      }

      .q-icon {
          position: absolute;
          right: 0.5rem;
          pointer-events: none;
          font-size: 16px;
      }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
  }

  &__loading, &__error, &__loading-more {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
  }
  
  &__error {
      color: #ef4444;
  }

  &__load-more-btn {
    display: block;
    margin: 20px auto;
    padding: 8px 24px;
    background-color: #374151;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
        background-color: #4b5563;
    }
  }
  
  &__checkbox-filter {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #cbd0ec;
    user-select: none;

    input {
        cursor: pointer;
    }
  }

  /* Legacy Styles for Installed Items */
  &__item {
    display: flex;
    align-items: center;
    background-color: #111121;
    padding: 1rem;
    border-radius: 4px;
    gap: 1rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: #1a1a2e;
    }

    &-image {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      object-fit: cover;
    }

    &-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    &-header {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    &-name {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    &-author {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    &-desc {
      font-size: 0.85rem;
      color: #d1d5db;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &-tags {
      display: flex;
      gap: 0.5rem;
    }

    &-tag {
      font-size: 0.7rem;
      background-color: #1f2937;
      color: #9ca3af;
      padding: 0.1rem 0.4rem;
      border-radius: 2px;
    }

    &-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
  }

  &__switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;

    input {
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .slider {
        background-color: #3b82f6;
      }

      &:checked + .slider:before {
        transform: translateX(20px);
      }
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #374151;
      transition: .4s;
      border-radius: 20px;

      &:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
    }
  }

  &__version {
      color: #9ca3af;
      font-size: 0.9rem;
      min-width: 60px;
      text-align: right;
  }

  /* --- NEW INSTALLED VIEW STYLES (Figma Match) --- */
  
  &__installed-view {
      display: flex;
      flex-direction: column;
      gap: 2px;
  }

  &__rows {
      display: flex;
      flex-direction: column;
      gap: 2px;
  }

  &__header-row {
      display: flex;
      align-items: center;
      gap: 2px;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
      margin-bottom: 0;
      flex-shrink: 0;
  }

  &__row {
      display: flex;
      align-items: center;
      gap: 2px;
      background-color: rgba(57, 57, 106, 0.15);
      padding: 8px;
      border-radius: 0;
      
      &:hover {
          background-color: rgba(57, 57, 106, 0.25);
      }

      &:last-child {
          border-radius: 0 0 8px 8px;
      }
  }

  /* Common Column Layout */
  &__col-mod {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      min-width: 0; /* Text truncation fix */
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px; /* Header height */

      /* Text styles for header */
      font-weight: 700;
      font-size: 12px;
      color: #f5f5f6;
      
      .package-list__row & {
          height: auto;
          background: none;
          padding: 0 16px 0 8px; /* Adjustment for image */
      }
  }

  &__col-author {
      width: 124px;
      padding: 10px 16px;
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px;
      display: flex;
      align-items: center;
      flex-shrink: 0;

      font-weight: 700;
      font-size: 12px;
      color: #cbd0ec;

      .package-list__row & {
          height: auto;
          background: none;
          font-weight: 400;
          color: #cbd0ec;
      }
  }

  &__col-version {
      width: 76px;
      padding: 10px 16px;
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;

      font-weight: 700;
      font-size: 12px;
      color: #cbd0ec;

      .package-list__row & {
          height: auto;
          background: none;
          font-weight: 400;
      }
  }

  &__col-categories {
      width: 180px;
      padding: 10px 16px;
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px;
      display: flex;
      align-items: center;
      flex-shrink: 0;

      font-weight: 700;
      font-size: 12px;
      color: #cbd0ec;

      .package-list__row & {
          height: auto;
          background: none;
          padding: 0 16px;
          overflow: hidden;
      }
  }

  &__col-enabled {
      width: 76px;
      padding: 10px 16px;
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px;
      display: flex;
      align-items: center;
       justify-content: flex-end;
      flex-shrink: 0;

      font-weight: 700;
      font-size: 12px;
      color: #cbd0ec;

      .package-list__row & {
          height: auto;
          background: none;
      }
  }

  &__col-more {
      width: 40px;
      padding: 10px;
      background-color: rgba(59, 63, 125, 0.24);
      height: 36px;
      flex-shrink: 0;

      .package-list__row & {
          width: 32px;
          height: auto;
          background: none;
          padding: 0;
      }
  }

  /* Content Styling */
  &__img-container {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
      background-color: #070721;
  }

  &__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
  }

  &__info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      flex: 1;
      min-width: 0;
  }

  &__title {
      font-size: 14px;
      font-weight: 700;
      color: #f5f5f6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
  }

  &__desc {
      font-size: 12px;
      color: #a7aed2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }

  &__text-link {
     font-size: 12px;
     color: #cbd0ec;
     cursor: pointer;
     
     &:hover {
         text-decoration: underline;
     }
  }

  &__tags {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      
      /* Mask effect from Figma (optional, complex in plain CSS) */
      mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }

  &__pill {
      background: rgba(70, 70, 149, 0.66);
      border-radius: 100px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 600;
      color: #f5f5f6;
      white-space: nowrap;
  }

  /* New Switch Design */
  &__switch-new {
      position: relative;
      display: inline-block;
      width: 30px;
      height: 20px;
      cursor: pointer;

      &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
      }

      input {
          opacity: 0;
          width: 0;
          height: 0;

          &:checked + .slider-new {
              background-color: #23ffab; /* Active green from Figma */
              border-color: #23ffab;
          }

           &:checked + .slider-new:before {
               transform: translateX(10px);
                background-color: #f5f5f6;
                 box-shadow: 0px -1px 0px 0px rgba(0,0,0,0.05), 0px 1px 2px 0px rgba(0,0,0,0.65);
           }
      }

      .slider-new {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(63, 63, 136, 0.55);
          border: 1px solid rgba(70, 70, 149, 0.66);
          transition: .4s;
          border-radius: 20px;

          &:before {
              position: absolute;
              content: "";
              height: 14px;
              width: 14px;
              left: 2px;
              bottom: 2px; /* Center vert: (20-14-2)/2 approx */
              background-color: #f5f5f6;
              transition: .4s;
              border-radius: 50%;
              box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.55);
          }
      }
  }

}
</style>
