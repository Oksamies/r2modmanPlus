<script lang="ts" setup>
import { computed } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import * as DownloadUtils from '../../utils/DownloadUtils';
import FileUtils from '../../utils/FileUtils';
import { DownloadStatusEnum } from '../../model/enums/DownloadStatusEnum';

const store = getStore<State>();

const currentDownload = computed(() => store.getters['download/currentDownload']);
const isOpen = computed(() => store.state.modals.isDownloadProgressModalOpen);

function closeModal() {
    store.commit("closeDownloadProgressModal");
}

function getStatusText(download: any) {
    if (download.status === DownloadStatusEnum.DOWNLOADING) return "Downloading";
    if (download.status === DownloadStatusEnum.EXTRACTING || download.status === DownloadStatusEnum.EXTRACTED) return "Extracting";
    return "Download Complete";
}

</script>

<template>
    <div class="modal-overlay" v-if="isOpen && currentDownload !== null">
        <div class="modal-backdrop" @click="closeModal()"></div>
        <div class="cyber-modal">
            <!-- Header -->
            <div class="cyber-modal-header">
                <h2 class="modal-title">
                    <template v-if="DownloadUtils.statusIsDownloadOrExtract(currentDownload.status)">
                        Downloading <span class="highlight">{{currentDownload.modName}}</span>
                    </template>
                    <template v-else-if="currentDownload.status === DownloadStatusEnum.INSTALLING">
                        Installing <span class="highlight">{{currentDownload.modName}}</span>
                    </template>
                    <template v-else>
                        Operation Complete
                    </template>
                </h2>
                <button class="close-btn" @click="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="cyber-modal-body">
                <!-- Download Phase -->
                <div class="progress-section" :class="{ 'is-active': DownloadUtils.statusIsDownloadOrExtract(currentDownload.status) }">
                    <div class="progress-header">
                        <div class="label-group">
                            <div class="icon-box">
                                <i class="fas fa-download" v-if="currentDownload.status === DownloadStatusEnum.DOWNLOADING"></i>
                                <i class="fas fa-box-open" v-else-if="currentDownload.status === DownloadStatusEnum.EXTRACTING || currentDownload.status === DownloadStatusEnum.EXTRACTED"></i>
                                <i class="fas fa-check" v-else></i>
                            </div>
                            <div class="text-info">
                                <div class="stage-title">{{ getStatusText(currentDownload) }}</div>
                                <div class="stage-meta" v-if="currentDownload.totalDownloadSize">
                                    {{ FileUtils.humanReadableSize(currentDownload.totalDownloadSize) }}
                                </div>
                            </div>
                        </div>
                        <div class="percentage">{{ currentDownload.downloadProgress }}%</div>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" :style="{ width: currentDownload.downloadProgress + '%' }"></div>
                    </div>
                </div>

                <!-- Install Phase -->
                <div class="progress-section" :class="{ 'is-active': currentDownload.status === DownloadStatusEnum.INSTALLING }">
                    <div class="progress-header">
                        <div class="label-group">
                            <div class="icon-box">
                                <i class="fas fa-cog" :class="{'fa-spin': currentDownload.installProgress > 0 && currentDownload.installProgress < 100}"></i>
                            </div>
                            <div class="text-info">
                                <div class="stage-title">Installation</div>
                                <div class="stage-meta">{{ currentDownload.installProgress ? 'Installing files...' : 'Pending...' }}</div>
                            </div>
                        </div>
                        <div class="percentage" v-if="currentDownload.installProgress">{{ currentDownload.installProgress }}%</div>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" :style="{ width: (currentDownload.installProgress || 0) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* Modal Structure (Shared styles - could be abstracted) */
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
    max-width: 480px;
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
    font-size: 16px;
    font-weight: 700; // Inter Bold
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

/* Progress Section */
.progress-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.5;
    transition: opacity 0.3s;
    
    &.is-active {
        opacity: 1;
        .icon-box { color: #23ffab; background: rgba(35, 255, 171, 0.1); }
        .progress-fill { background: #23ffab; box-shadow: 0 0 8px rgba(35, 255, 171, 0.4); }
    }
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.icon-box {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a7aed2;
    font-size: 14px;
    transition: all 0.3s;
}

.text-info {
    display: flex;
    flex-direction: column;
}

.stage-title {
    font-size: 14px;
    font-weight: 700;
    color: #f5f5f6;
}

.stage-meta {
    font-size: 12px;
    color: #a7aed2;
}

.percentage {
    font-family: monospace;
    font-weight: 700;
    color: #f5f5f6;
}

.progress-track {
    height: 6px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #623bce;
    border-radius: 3px;
    width: 0%;
    transition: width 0.2s ease;
}

</style>
