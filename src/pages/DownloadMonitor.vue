<template>
    <div class="cyberstorm-container cyberstorm-container--y cyberstorm-container--full island">
        <!-- Game Header (Reused) -->
        <GameHeader />

        <!-- Main Body Wrapper -->
        <div class="cyberstorm-container cyberstorm-container--y cyberstorm-container--full island monitor-body">
            
            <!-- Network Stats Section -->
            <!-- 'island' provides gap, 'cyberstorm-container--x' makes it a row -->
            <div class="network-stats-container island cyberstorm-container--x">
                
                <!-- Network Graph Card -->
                <div class="network-graph-card island-item cyberstorm-container--full">
                    <div class="graph-bg">
                        <!-- Stripy Background Pattern -->
                        <div class="stripes"></div>
                        <!-- Vector Lines -->
                        <svg class="graph-line" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <path d="M0 40 L0 30 Q10 20 20 30 T 40 10 T 60 25 T 80 5 L 100 20 L 100 40 Z" fill="rgba(35, 255, 171, 0.1)" stroke="#23ffab" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="card-label">Network</div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-row island-item">
                    <div class="stat-item">
                        <span class="stat-label">Down</span>
                        <span class="stat-value">{{ currentTotalSpeed }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">High</span>
                        <span class="stat-value">{{ peakTotalSpeed }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">{{ sessionTotalDownloaded }}</span>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="cyberstorm-container cyberstorm-container--y cyberstorm-container--full island-item monitor-content">

                <!-- Tabs & Tools Container -->
                <div class="tabs-tools-container">
                    <div class="nav-tabs">
                        <button 
                            class="nav-tab" 
                            :class="{ active: activeTab === 'downloads' }"
                            @click="activeTab = 'downloads'"
                        >
                            Downloads
                        </button>
                        <button 
                            class="nav-tab" 
                            :class="{ active: activeTab === 'dependencies' }"
                            @click="activeTab = 'dependencies'"
                        >
                            Dependencies
                        </button>
                    </div>

                    <!-- Tools Row -->
                    <div class="tools-row">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Search..." 
                                v-model="searchQuery"
                            />
                        </div>
                        <button class="btn-secondary" @click="store.commit('download/removeAllInactive')">
                            Clear all
                        </button>
                    </div>
                </div>

                <!-- TAB: DOWNLOADS -->
                <template v-if="activeTab === 'downloads'">
                    <!-- List Header -->
                    <div class="list-header">
                        <div class="col-mod">Mod</div>
                        <div class="col-progress">Progress</div>
                        <div class="col-updated">Status</div>
                        <div class="col-status"></div>
                    </div>

                    <!-- Scrollable List -->
                    <!-- 'island' (vertical) provides gap between items. 'island-item' on children provides bg -->
                    <div class="download-list island cyberstorm-container--y">
                        <div 
                            v-for="download in filteredDownloads" 
                            :key="download.downloadId" 
                            class="download-item island-item"
                            :class="{'item-failed': download.status === DownloadStatusEnum.FAILED}"
                        >
                            <!-- Mod Info -->
                            <div class="col-mod">
                                <div class="mod-icon">
                                    <img :src="download.initialMods[0]?.icon" @error="handleImageError" v-if="download.initialMods[0]?.icon" />
                                    <i class="fas fa-cube" v-else></i>
                                </div>
                                <div class="mod-details">
                                    <span class="mod-name" :title="download.modName || download.initialMods[0]?.getMod().getName()">
                                        {{ download.modName || download.initialMods[0]?.getMod().getName() }}
                                    </span>
                                    <span class="mod-author">
                                        by <span class="highlight">{{ download.initialMods[0]?.getMod().getOwner() }}</span>
                                    </span>
                                </div>
                            </div>

                            <!-- Progress Bar / Retry Button Container -->
                            <div class="col-progress">
                                <div v-if="download.status === DownloadStatusEnum.FAILED" class="retry-container">
                                    <button class="btn-retry" @click="retryDownload(download)">
                                        <i class="fas fa-redo"></i> Retry
                                    </button>
                                </div>
                                
                                <div v-else class="progress-wrapper">
                                    <div class="progress-info">
                                        <span class="speed-text" v-if="isActive(download)">
                                            <i class="fas fa-arrow-down small-icon"></i> {{ getDownloadSpeed(download.downloadId) }}
                                        </span>
                                        <span class="percentage" v-if="isActive(download)">{{ getProgress(download) }}%</span>
                                    </div>
                                    <div class="progress-track">
                                        <div 
                                            class="progress-fill" 
                                            :class="getStatusClass(download.status)"
                                            :style="{ width: getProgress(download) + '%' }"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Status Text -->
                            <div class="col-updated">
                                    <span :class="getStatusClass(download.status)">{{ getStatusText(download) }}</span>
                            </div>

                            <!-- Cancel / Clear Button -->
                            <div class="col-status actions">
                                <button 
                                    class="action-btn cancel"
                                    @click="removeDownload(download)"
                                    title="Clear"
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-if="filteredDownloads.length === 0" class="empty-state">
                            <p>No active downloads.</p>
                        </div>
                    </div>
                </template>

                <!-- TAB: DEPENDENCIES -->
                <template v-else>
                    <!-- List Header -->
                    <div class="list-header">
                        <div class="col-mod">Dependency</div>
                        <div class="col-ver">Version</div>
                        <div class="col-src" style="flex:1">Package Source</div>
                    </div>

                    <!-- Scrollable List -->
                    <div class="download-list island cyberstorm-container--y">
                        <div v-for="download in filteredDownloads" :key="download.downloadId + '-group'" class="dep-group">
                            <!-- Group Header (NOT an island item, implies grouping) -->
                            <div class="group-header">
                                <i class="fas fa-box"></i>
                                <span>{{ download.modName || download.initialMods[0]?.getMod().getName() }}</span>
                                <span class="badge">{{ (download.allMods || []).length }} Files</span>
                            </div>

                            <!-- Dep Items (Island Items) -->
                            <div 
                                v-for="mod in (download.allMods || [])" 
                                :key="mod.getMod().getFullName()" 
                                class="download-item dep-item island-item"
                            >
                                <div class="col-mod">
                                    <div class="mod-icon small">
                                        <img :src="mod.getMod().getVersions()[0].getIcon()" @error="handleImageError" />
                                    </div>
                                    <div class="mod-details">
                                        <span class="mod-name">{{ mod.getMod().getName() }}</span>
                                        <span class="mod-author">by {{ mod.getMod().getOwner() }}</span>
                                    </div>
                                </div>
                                <div class="col-ver">
                                    {{ mod.getVersion().getVersionNumber() }}
                                </div>
                                <div class="col-src" style="flex:1; color: #a7aed2;">
                                    Included in {{ download.initialMods[0]?.getMod().getName() }}
                                </div>
                            </div>
                        </div>

                        <div v-if="filteredDownloads.length === 0" class="empty-state">
                            <p>No active downloads.</p>
                        </div>
                    </div>
                </template>

            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import { DownloadStatusEnum } from '../model/enums/DownloadStatusEnum';
import * as DownloadUtils from '../utils/DownloadUtils';
import FileUtils from '../utils/FileUtils';
import GameHeader from '../components/GameHeader.vue';

const store = getStore<State>();
const searchQuery = ref('');
const activeTab = ref('downloads'); 

// Speed & Stats Logic
const speedMap = ref<Map<string, number>>(new Map()); // downloadId -> bytes/sec
const lastUpdateMap = ref<Map<string, { size: number, time: number }>>(new Map());

const sessionDownloadedBytes = ref(0);
const peakSpeedBytes = ref(0);

const allDownloads = computed(() => store.state.download.allDownloads);

// Watch for changes to calculate speed
watch(allDownloads, (newVal) => {
    const now = Date.now();
    let currentTotalBytesPerSec = 0;

    newVal.forEach(dl => {
        if (DownloadUtils.statusIsDownloadOrExtract(dl.status)) {
            const last = lastUpdateMap.value.get(dl.downloadId);
            const currentSize = dl.downloadedSize;
            
            if (last) {
                const deltaSize = currentSize - last.size;
                const deltaTime = (now - last.time) / 1000; // seconds
                
                // Accumulate total session download
                if (deltaSize > 0) {
                    sessionDownloadedBytes.value += deltaSize;
                }

                if (deltaTime > 0.5) { // Update every 500ms approx
                    const speed = deltaSize / deltaTime;
                    speedMap.value.set(dl.downloadId, speed);
                    lastUpdateMap.value.set(dl.downloadId, { size: currentSize, time: now });
                    currentTotalBytesPerSec += speed;
                } else {
                     // If too fast updates, just use last calculated speed for sum
                     currentTotalBytesPerSec += (speedMap.value.get(dl.downloadId) || 0);
                }
            } else {
                lastUpdateMap.value.set(dl.downloadId, { size: currentSize, time: now });
                speedMap.value.set(dl.downloadId, 0);
            }
        } else {
            speedMap.value.delete(dl.downloadId);
            lastUpdateMap.value.delete(dl.downloadId);
        }
    });

    // Update Peak
    if (currentTotalBytesPerSec > peakSpeedBytes.value) {
        peakSpeedBytes.value = currentTotalBytesPerSec;
    }

}, { deep: true });

const filteredDownloads = computed(() => {
    let list = [...allDownloads.value].reverse(); // Newest first
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        list = list.filter(d => 
            d.modName.toLowerCase().includes(query) || 
            d.initialMods.some(m => m.getMod().getName().toLowerCase().includes(query))
        );
    }
    return list;
});

const currentTotalSpeed = computed(() => {
    let total = 0;
    speedMap.value.forEach(v => total += v);
    return FileUtils.humanReadableSize(total) + '/s';
});

const peakTotalSpeed = computed(() => {
    return FileUtils.humanReadableSize(peakSpeedBytes.value) + '/s';
});

const sessionTotalDownloaded = computed(() => {
    return FileUtils.humanReadableSize(sessionDownloadedBytes.value);
});

function getDownloadSpeed(id: string) {
    const speed = speedMap.value.get(id) || 0;
    return FileUtils.humanReadableSize(speed) + '/s';
}

function getProgress(download: any) {
    if (download.status === DownloadStatusEnum.INSTALLING) return Math.min(Math.floor(download.installProgress), 100);
    return Math.floor(download.downloadProgress);
}

function isActive(download: any) {
    return DownloadUtils.statusIsDownloadOrExtract(download.status) || download.status === DownloadStatusEnum.INSTALLING;
}

function getStatusClass(status: DownloadStatusEnum) {
    if (status === DownloadStatusEnum.FAILED) return 'text-danger';
    if (status === DownloadStatusEnum.INSTALLED) return 'text-success';
    if (status === DownloadStatusEnum.INSTALLING) return 'text-info';
    return 'text-primary';
}

function getStatusText(download: any) {
    switch (download.status) {
        case DownloadStatusEnum.DOWNLOADING: return 'Downloading...';
        case DownloadStatusEnum.EXTRACTING: return 'Extracting...';
        case DownloadStatusEnum.EXTRACTED: return 'Extracted';
        case DownloadStatusEnum.INSTALLING: return 'Installing...';
        case DownloadStatusEnum.INSTALLED: return 'Done!';
        case DownloadStatusEnum.FAILED: return 'Error';
        default: return 'Pending';
    }
}

function retryDownload(download: any) {
    store.dispatch('download/retryDownload', { download, hideModal: true });
}

function removeDownload(download: any) {
    store.commit('download/removeDownload', download);
}

function handleImageError(e: Event) {
    (e.target as HTMLImageElement).src = require('../assets/sad.svg');
}
</script>

<style lang="scss" scoped>
$bg-island: #101028;
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$accent-green: #23ffab;
$accent-purple: #623bce;
$accent-red: #f1385a;

.monitor-body {
    // display: flex;
    // flex-direction: column;
    // gap: 16px;
    // flex: 1;
    // min-width: 0;
    // overflow: hidden;
}

/* Network Section */
.network-stats-container {
    height: 104px;
    /* Island handles flex and gap */
}

.network-graph-card {
    /* island-item handles border-radius and bg (if vars are set right) */
    /* Check if we need to force bg */
    background: $bg-island; // Keeping this to ensure correct color match with existing islands
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 12px;
}

.graph-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.stripes {
    width: 100%;
    height: 100%;
    opacity: 0.1;
    background: repeating-linear-gradient(
        -45deg,
        #3c3c86,
        #3c3c86 2px,
        transparent 2px,
        transparent 10px
    );
}

.graph-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    z-index: 1;
}

.card-label {
    position: absolute;
    top: 12px;
    left: 16px;
    font-size: 12px;
    font-weight: 700;
    color: $text-secondary;
    z-index: 2;
}

.stats-row {
     /* island-item handles border-radius */
    background: $bg-island;
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 0 56px;
    justify-content: center;
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 12px;
    font-weight: 700;
    color: $text-secondary;
    margin-bottom: 2px;
}

.stat-value {
    font-size: 14px;
    font-weight: 700;
    color: $text-primary;
}


.monitor-content {
    /* Container for tabs and list */
    // gap: 16px;
    /* Background is transparent (default for container) */
    padding: 16px;
}

/* Tabs & Tools */
.tabs-tools-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-end; 
    margin-bottom: 8px;
    border-bottom: 2px solid rgba(59, 63, 125, 0.24);
    padding-bottom: 0;
}

.nav-tabs {
    display: flex;
    gap: 24px;
}

.nav-tab {
    background: transparent;
    border: none;
    padding: 8px 4px;
    font-size: 14px;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    position: relative;
    
    &.active {
        color: $text-primary;
        &::after {
            content: '';
            position: absolute;
            bottom: -2px; /* Overlap border */
            left: 0;
            width: 100%;
            height: 2px;
            background: $accent-green;
            box-shadow: 0 -2px 8px rgba(35, 255, 171, 0.4);
        }
    }

    &:hover:not(.active) {
        color: #c6c3ff;
    }
}

.tools-row {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 8px; /* Lift up slightly */
}

.search-input-wrapper {
    flex: 1;
    background: rgba(59, 63, 125, 0.24);
    border: 1px solid rgba(70, 70, 149, 0.66);
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 36px;
    width: 240px;
    
    &:focus-within {
        border-color: $accent-purple;
    }
}

.search-icon {
    color: $text-secondary;
    margin-right: 8px;
    font-size: 14px;
}

.search-input {
    background: transparent;
    border: none;
    color: $text-primary;
    width: 100%;
    outline: none;
    &::placeholder { color: $text-secondary; }
}

.btn-secondary {
    background: rgba(70, 70, 149, 0.66);
    color: $text-primary;
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    height: 36px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: rgba(70, 70, 149, 0.8); }
}

/* List Header */
.list-header {
    display: flex;
    height: 36px;
    gap: 2px;
    flex-shrink: 0;
    margin-bottom: 2px;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
}

.list-header > div {
    background: rgba(59, 63, 125, 0.24);
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 700;
    color: $text-secondary;
}

.col-mod { flex: 1; }
.col-progress { flex: 1; max-width: 560px; min-width: 300px; color: $text-primary; }
.col-updated { width: 120px; text-align: left; }
.col-status { width: 80px; justify-content: flex-end;}
/* Dependencies Cols */
.col-ver { width: 120px; color: $text-primary; justify-content: center; }
.col-src { flex: 1; color: $text-secondary; }

/* Download List */
.download-list {
    flex: 1;
    overflow-y: auto;
    /* Island handles flex col and gap */
    padding-bottom: 24px;
    gap: 2px !important;
}

.download-item {
    display: flex;
    align-items: center;
    /* background: island-item handles bg color */
    background: rgba(57, 57, 106, 0.15); /* Override default island-item bg transparent/solid? */
    /* island-item usually is solid. If we want semi-transparent, we override. */
    /* keeping existing override */
    
    padding: 8px 16px; 
    height: 64px; 
    gap: 16px;
    transition: background 0.2s;
    border-radius: 0 !important;

    &:hover {
        background: rgba(57, 57, 106, 0.25);
    }
    
    &:last-child {
        border-radius: 0 0 8px 8px !important;
    }
}

.dep-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.dep-item {
    height: 48px; 
    margin-left: 16px; /* Indent */
    background: rgba(57, 57, 106, 0.05); /* Lighter than main item */
    border-left: 2px solid $accent-purple;
}

.group-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 8px;
    color: $text-primary;
    font-weight: 700;
    font-size: 14px;
    background: rgba(59, 63, 125, 0.1);
    border-radius: 8px;
    margin-top: 8px;
    
    .badge {
        font-size: 12px;
        color: $text-secondary;
        font-weight: 400;
    }
    i { color: $accent-purple; }
}

/* Columns in Item */
.col-mod {
    display: flex;
    align-items: center;
    gap: 16px;
    overflow: hidden;
}

.col-progress {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.col-updated {
    font-size: 12px;
    display: flex;
    align-items: center;
}

.col-status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

/* Mod Info */
.mod-icon {
    width: 48px;
    height: 48px;
    background: #070721;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    img { width: 100%; height: 100%; object-fit: cover; }
    i { color: $text-secondary; font-size: 20px; }
    
    &.small {
        width: 32px;
        height: 32px;
        i { font-size: 14px; }
    }
}

.mod-details {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 3px;
}

.mod-name {
    font-weight: 700;
    font-size: 14px;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mod-author {
    font-size: 12px;
    color: $text-secondary;
    .highlight { color: #c6c3ff; }
}

/* Progress bar area */
.progress-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: $text-primary;
    align-items: center;
}

.speed-text {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-primary; 
}

.small-icon {
    font-size: 12px;
    color: $text-secondary;
}

.progress-track {
    height: 8px;
    background: #3c3c86;
    border-radius: 100px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: $accent-green;
    width: 0;
    transition: width 0.2s linear;
    border-radius: 100px;
    
    &.text-danger { background: $accent-red; }
    &.text-success { background: $accent-green; }
    &.text-info { background: $accent-purple; }
}

/* Retry Button styling */
.retry-container {
    display: flex;
    justify-content: flex-start;
}

.btn-retry {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(70, 70, 149, 0.66);
    color: $text-primary;
    border: none;
    border-radius: 8px;
    height: 36px;
    padding: 0 16px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    
    i { font-size: 12px; }
    &:hover { background: rgba(70, 70, 149, 0.8); }
}

/* Status Text Colors */
.text-danger { color: $accent-red; }
.text-success { color: #50d99f; } 
.text-info { color: $accent-purple; }
.text-primary { color: $text-secondary; }

/* Cancel Action */
.action-btn {
    background: transparent;
    border: none;
    color: #a7aed2; 
    cursor: pointer;
    font-size: 16px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover { background: rgba(255,255,255,0.05); color: #c6c3ff; }
}

/* Empty State */
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: $text-secondary;
}

/* Overrides required since island-item sets its own background */
.download-item.island-item {
    background: rgba(57, 57, 106, 0.15);
}
.download-item.island-item:hover {
    background: rgba(57, 57, 106, 0.25);
}
.network-graph-card.island-item {
     background: $bg-island;
}
.stats-row.island-item {
    background: $bg-island;
}
</style>
