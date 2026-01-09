<template>
    <div class="package-search">
        <!-- Sidebar -->
        <div class="package-search__sidebar island-item">
            <div class="filters-container">
                <div v-if="filterError" class="filter-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>{{ filterError }}</span>
                    <button class="retry-text-btn" @click="fetchFilters">Retry</button>
                </div>

                <template v-if="loadingFilters">
                    <div class="skeleton-filter"></div>
                    <div class="skeleton-filter"></div>
                </template>
                <template v-else>
                    <Collapsible v-if="filters && filters.sections.length > 0" :initially-open="true">
                        <template #title>Sections</template>
                        <template #content>
                            <div class="drawer-content-scroll">
                                <RadioGroup 
                                    :sections="[...filters.sections, { uuid: '', name: 'All', slug: 'all', priority: -999 }]"
                                    :selected="section"
                                    :setSelected="setSection"
                                />
                            </div>
                        </template>
                    </Collapsible>

                    <Collapsible v-if="filters && filters.package_categories.length > 0" :initially-open="true">
                        <template #title>Categories</template>
                        <template #content>
                            <div class="drawer-content-scroll">
                                <CheckboxList :items="categoryItems" />
                            </div>
                        </template>
                    </Collapsible>

                    <Collapsible :initially-open="true">
                        <template #title>Date & Time</template>
                        <template #content>
                            <div class="date-filters-col">
                                <div class="date-group-vertical">
                                    <span class="sub-label">Updated</span>
                                    <div class="date-inputs-col">
                                        <input type="datetime-local" v-model="dateStart" class="date-input-full" />
                                        <span class="to-text">to</span>
                                        <input type="datetime-local" v-model="dateEnd" class="date-input-full" />
                                    </div>
                                </div>
                                <div class="date-group-vertical">
                                    <span class="sub-label">Created</span>
                                    <div class="date-inputs-col">
                                        <input type="datetime-local" v-model="createdStart" class="date-input-full" />
                                        <span class="to-text">to</span>
                                        <input type="datetime-local" v-model="createdEnd" class="date-input-full" />
                                    </div>
                                </div>
                                <button v-if="dateStart || dateEnd || createdStart || createdEnd" @click="clearDates" class="link-btn-clear">
                                    Clear Dates
                                </button>
                            </div>
                        </template>
                    </Collapsible>

                    <Collapsible :initially-open="true">
                        <template #title>Other Filters</template>
                        <template #content>
                            <div class="other-filters">
                                <label class="checkbox-simple">
                                    <input type="checkbox" v-model="deprecated">
                                    <span>Deprecated</span>
                                </label>
                                <label class="checkbox-simple">
                                    <input type="checkbox" v-model="nsfw">
                                    <span>NSFW</span>
                                </label>
                            </div>
                        </template>
                    </Collapsible>
                </template>
            </div>
        </div>

        <!-- Content -->
        <div class="package-search__content">
            <!-- Search & Controls -->
            <div class="search-controls island-item">
                <div class="search-input-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Search mods..." 
                        class="search-input"
                    />
                    <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="results-meta">
                    <div class="count-display" v-if="listings">
                        <span class="highlight">{{ listings.count }}</span> packages found
                    </div>
                    
                    <div class="results-controls">
                        <Pagination 
                            v-if="listings && listings.count > 0"
                            :currentPage="page"
                            :totalCount="listings.count"
                            :pageSize="20"
                            :onPageChange="setPage"
                        />
                        <PackageOrder :order="ordering" :setOrder="setOrder" />
                    </div>
                </div>
            </div>

            <!-- Grid -->
            <div class="listings-grid-container island-item" ref="scrollContainer">
                <div v-if="loadingListings" class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading packages...</p>
                </div>
                <div v-else-if="error" class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>{{ error }}</p>
                    <button @click="fetchListings" class="btn-retry">Retry</button>
                </div>
                <div v-else-if="listings && listings.results.length > 0" class="listings-grid">
                    <OnlinePackageCard 
                        v-for="pkg in listings.results" 
                        :key="pkg.namespace + '-' + pkg.name" 
                        :pkg="pkg" 
                    />
                </div>
                <div v-else class="empty-state">
                    <i class="fas fa-ghost"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search or filters.</p>
                    <button @click="clearFilters" class="btn-clear">Clear all filters</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import debounce from 'lodash.debounce';

import Collapsible from '../../Collapsible.vue';
import OnlinePackageCard from '../OnlinePackageCard.vue';
import CheckboxList, { CheckboxItem, TriState } from './components/CheckboxList.vue';
import RadioGroup from './components/RadioGroup.vue';
import PackageOrder from './components/PackageOrder.vue';
import Pagination from './components/Pagination.vue';

import GameManager from '../../../model/game/GameManager';
import { fetchCommunityFilters } from '../../../r2mm/api/get/communityFilters';
import { fetchCommunityPackageListings } from '../../../r2mm/api/get/communityPackageListings';
import type { CommunityFiltersResponseData, PackageListingsResponseData } from '../../../r2mm/api/schemas/responseSchemas';
import { PackageListingsOrderingEnum } from '../../../r2mm/api/schemas/queryParamSchemas';

// State
const filters = ref<CommunityFiltersResponseData | null>(null);
const listings = ref<PackageListingsResponseData | null>(null);
const loadingFilters = ref(true);
const loadingListings = ref(false);
const error = ref<string | null>(null);
const filterError = ref<string | null>(null);

// Filter State
const searchQuery = ref('');
const section = ref(''); // uuid
const ordering = ref<PackageListingsOrderingEnum>(PackageListingsOrderingEnum.Updated);
const deprecated = ref(false);
const nsfw = ref(false);
const page = ref(1);
const dateStart = ref('');
const dateEnd = ref('');
const createdStart = ref('');
const createdEnd = ref('');

// Categories State (Local representation for CheckboxList)
// Map<catUuid, 'include' | 'exclude' | 'off'>
const categorySelection = ref<Record<string, TriState>>({});

// Computed Category Items for CheckboxList
const categoryItems = computed<CheckboxItem[]>(() => {
    if (!filters.value) return [];
    
    // Sort by name for display? Or slug?
    // Cyberstorm uses slug sort I think
    const sortedCats = [...filters.value.package_categories].sort((a, b) => a.name.localeCompare(b.name));

    return sortedCats.map(cat => ({
        label: cat.name,
        state: categorySelection.value[cat.id] || 'off',
        setStateFunc: (newState: TriState) => {
            categorySelection.value = {
                ...categorySelection.value,
                [cat.id]: newState
            };
        }
    }));
});

// Setters
const setSection = (uuid: string) => {
    section.value = uuid;
    page.value = 1; // Reset page on filter change
};

const setOrder = (newOrder: PackageListingsOrderingEnum) => {
    ordering.value = newOrder;
    page.value = 1;
};

const setPage = (newPage: number) => {
    page.value = newPage;
    // Scroll to top of grid
    const container = document.querySelector('.package-search__content');
    if (container) container.scrollTop = 0;
};

const clearDates = () => {
    dateStart.value = '';
    dateEnd.value = '';
    createdStart.value = '';
    createdEnd.value = '';
};

const clearFilters = () => {
    searchQuery.value = '';
    ordering.value = PackageListingsOrderingEnum.Updated;
    section.value = filters.value && filters.value.sections.length > 0 ? filters.value.sections[0].uuid : '';
    deprecated.value = false;
    nsfw.value = false;
    dateStart.value = '';
    dateEnd.value = '';
    createdStart.value = '';
    createdEnd.value = '';
    page.value = 1;
    categorySelection.value = {};
    
    // Reset category selection map
    if (filters.value) {
        const resetMap: Record<string, TriState> = {};
        filters.value.package_categories.forEach(c => resetMap[c.id] = 'off');
        categorySelection.value = resetMap;
    }
};


// Fetch Data
const getCommunityId = () => {
    const activeGame = GameManager.activeGame;
    let communityId = activeGame.internalFolderName;
    try {
        const packageIndexUrl = new URL(activeGame.thunderstoreUrl);
        const pathParts = packageIndexUrl.pathname.split('/');
        if (pathParts[1] === 'c' && pathParts[2]) {
            communityId = pathParts[2];
        }
    } catch (e) {
        console.warn("Failed to extract community slug", e);
    }
    return communityId;
};

const fetchFilters = async () => {
    loadingFilters.value = true;
    filterError.value = null;
    try {
        const activeGame = GameManager.activeGame;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;
        const communityId = getCommunityId();

        const data = await fetchCommunityFilters({
            config: () => ({ apiHost }),
            params: { community_id: communityId },
            data: {},
            queryParams: {}
        });
        
        // Sort sections by priority high -> low
        data.sections.sort((a, b) => b.priority - a.priority);
        
        filters.value = data;

        // Init section if not set default to first section if exists
        if (!section.value && data.sections.length > 0) {
            section.value = data.sections[0].uuid;
        }

    } catch (e: any) {
        console.error("Failed to fetch filters", e);
        filterError.value = e.message || "Failed to load filters";
    } finally {
        loadingFilters.value = false;
    }
};

const fetchListings = async () => {
    loadingListings.value = true;
    error.value = null;
    try {
        const activeGame = GameManager.activeGame;
        const apiHost = new URL(activeGame.thunderstoreUrl).origin;
        const communityId = getCommunityId();

        // Prepare Category lists
        const included_categories: string[] = [];
        const excluded_categories: string[] = [];
        Object.entries(categorySelection.value).forEach(([id, state]) => {
            if (state === 'include') included_categories.push(id);
            if (state === 'exclude') excluded_categories.push(id);
        });

        const result = await fetchCommunityPackageListings({
            config: () => ({ apiHost }),
            params: { community_id: communityId },
            data: {},
            queryParams: [
                { key: "ordering", value: ordering.value, impotent: PackageListingsOrderingEnum.Updated },
                { key: "page", value: page.value, impotent: 1 },
                { key: "q", value: searchQuery.value },
                { key: "included_categories", value: included_categories },
                { key: "excluded_categories", value: excluded_categories },
                { key: "section", value: section.value },
                { key: "nsfw", value: nsfw.value, impotent: false },
                { key: "deprecated", value: deprecated.value, impotent: false },
                { key: "date_start", value: dateStart.value },
                { key: "date_end", value: dateEnd.value },
                { key: "created_start", value: createdStart.value },
                { key: "created_end", value: createdEnd.value }
            ]
        });

        listings.value = result;

    } catch (e: any) {
        console.error("Failed to fetch listings", e);
        error.value = e.message || "Failed to load packages";
    } finally {
        loadingListings.value = false;
    }
};

// Debounced Search Call
const debouncedFetch = debounce(fetchListings, 400);

// Watchers
watch(searchQuery, () => {
    page.value = 1;
    debouncedFetch();
});

watch([section, ordering, deprecated, nsfw, page, dateStart, dateEnd, createdStart, createdEnd], () => {
    fetchListings();
});

// Watch categories deeply
watch(categorySelection, () => {
    page.value = 1;
    debouncedFetch();
}, { deep: true });

// Lifecycle
onMounted(async () => {
    await fetchFilters();
    await fetchListings();
});

</script>

<style lang="scss" scoped>
$sidebar-width: 260px;
$surface-bg: #111121; // Darker surface
$card-bg: rgba(57, 57, 106, 0.15);
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$border-color: #29295b;
$accent-green: #23ffab;

.package-search {
    display: flex;
    height: 100%;
    overflow: hidden;
    gap: var(--section-gap);
    max-height: 100%;
}

.package-search__sidebar {
    width: $sidebar-width;
    /* background-color: $surface-bg; */ /* Handled by island-item */
    /* border-right: 1px solid $border-color; */ /* Handled by island-item */
    overflow-y: auto;
    padding: 16px;
    flex-shrink: 0;

    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: $border-color;
        border-radius: 3px;
    }
}

.filters-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-error {
    padding: 12px;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 4px;
    color: #ef4444;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    margin-bottom: 12px;
}

.retry-text-btn {
    background: none;
    border: none;
    color: #ef4444;
    text-decoration: underline;
    cursor: pointer;
    font-size: 12px;
    padding: 2px;
    
    &:hover { color: #f87171; }
}

.skeleton-filter {
    height: 40px;
    background-color: rgba(255,255,255,0.05);
    border-radius: 4px;
    margin-bottom: 8px;
}

.other-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.checkbox-simple {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-secondary;
    cursor: pointer;
    font-size: 14px;
    
    input {
        accent-color: $accent-green;
    }
    
    &:hover { color: $text-primary; }
}

.package-search__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    /* overflow: hidden; */ /* Reverted: Parent scrolls now */
    gap: 8px;
}

.search-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* padding-bottom: 16px; */
    padding: 16px;
    /* border-bottom: 1px solid $border-color; */
}

.search-input-wrapper {
    position: relative;
    width: 100%;
    
    .search-input {
        width: 100%;
        background-color: $surface-bg;
        border: 1px solid $border-color;
        border-radius: 8px;
        padding: 12px 40px;
        color: $text-primary;
        font-size: 16px;
        outline: none;
        
        &:focus {
            border-color: $accent-green;
        }
    }
    
    .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: $text-secondary;
    }
    
    .clear-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: $text-secondary;
        cursor: pointer;
        padding: 4px;
        &:hover { color: $text-primary; }
    }
}

.results-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.results-controls {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap; 
}

.date-range-group {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.date-range-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .label {
        font-size: 14px;
        color: #a7aed2;
        white-space: nowrap;
    }
}

.date-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #111121;
    border: 1px solid #29295b;
    border-radius: 4px;
    padding: 2px 8px; /* Compact padding */
    
    input[type="datetime-local"] {
        background: none;
        border: none;
        color: #f5f5f6;
        font-family: inherit;
        font-size: 13px;
        outline: none;
        padding: 4px 0;
        
        &::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
            opacity: 0.6;
            transform: scale(0.8);
            &:hover { opacity: 1; }
        }
    }
    
    .separator {
        color: #a7aed2;
    }
    
    &:focus-within {
        border-color: #23ffab;
    }
}

.clear-dates-btn {
    background: #111121;
    border: 1px solid #29295b;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a7aed2;
    cursor: pointer;
    
    &:hover { 
        color: #ef4444; 
        border-color: #ef4444; 
    }
}

.count-display {
    color: #a7aed2;
    font-size: 14px;
    .highlight {
        color: $text-primary;
        font-weight: bold;
    }
}

.listings-grid-container {
    /* padding-right: 8px; */
    padding: 16px; 
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    padding-bottom: 24px;
}

.loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: $text-secondary;
    text-align: center;
    gap: 16px;
    
    i { font-size: 48px; opacity: 0.5; margin-bottom: 8px; }
    h3 { font-size: 20px; color: $text-primary; margin: 0; }
    p { margin: 0; }
}

.error-state {
    color: #ef4444;
    i { color: #ef4444; opacity: 1; }
}

.btn-retry, .btn-clear {
    background-color: #29295b;
    color: $text-primary;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 8px;
    
    &:hover { background-color: #3b3b7e; }
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(35, 255, 171, 0.3);
    border-radius: 50%;
    border-top-color: $accent-green;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.date-filters-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.date-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.sub-label {
    font-size: 13px;
    color: $text-secondary;
    font-weight: 600;
}

.date-inputs-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    .to-text {
        font-size: 12px;
        color: #5b6285;
    }
}

.date-input-full {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid $border-color;
    border-radius: 4px;
    color: $text-primary;
    padding: 6px;
    font-size: 12px;
    font-family: inherit;
    outline: none;

    &:focus {
        border-color: $accent-green;
        background-color: rgba(255, 255, 255, 0.05);
    }
    
    &::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0.4;
        transform: scale(0.8);
        &:hover { opacity: 0.8; }
    }
}

.link-btn-clear {
    align-self: flex-start;
    background: none;
    border: none;
    color: #ef4444;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    opacity: 0.8;
    
    &:hover { opacity: 1; }
}

.drawer-content-scroll {
    max-height: 250px;
    overflow-y: auto;
    padding-right: 4px; /* avoid scrollbar overlap */

    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        background-color: $border-color;
        border-radius: 2px;
        
        &:hover {
            background-color: #3b3b7e;
        }
    }
}
</style>