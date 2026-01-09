<template>
    <div class="tab-content">
        <div v-if="modDetails && modDetails.dependencies && modDetails.dependencies.length > 0" class="dependency-list">
            <div v-for="dep in modDetails.dependencies" :key="dep.name" class="dependency-item">
                <div class="dep-icon-container">
                    <img :src="dep.icon_url || 'https://thunderstore.io/static/img/defaults/icon-128.png'" class="dep-icon" />
                </div>
                <div class="dep-info">
                    <div class="dep-name">{{ dep.name }}</div>
                    <div class="dep-desc">{{ dep.description }}</div>
                </div>
                <div class="dep-ver">v{{ dep.version_number }}</div>
            </div>
        </div>
        <div v-else class="empty-placeholder">No dependencies.</div>
    </div>
</template>

<script lang="ts" setup>
import { inject, Ref } from 'vue';
import { PackageListingDetailsResponseData } from '../../../r2mm/api/schemas/responseSchemas';

const modDetails = inject<Ref<PackageListingDetailsResponseData | null>>('modDetails');

</script>

<style lang="scss" scoped>
$surface-bg: #101028;
$text-secondary: #a7aed2;
$text-primary: #f5f5f6;
$accent-green: #23ffab;

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

.dependency-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.dependency-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: $surface-bg;
    padding: 12px;
    border-radius: 4px;
}

.dep-icon-container {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #2d2d3a;
}
.dep-icon { width: 100%; height: 100%; object-fit: cover; }

.dep-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dep-name {
    font-weight: 700;
    color: $text-primary;
    font-size: 14px;
}

.dep-desc {
    font-size: 12px;
    color: $text-secondary;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.dep-ver {
    font-size: 12px;
    color: $accent-green;
    font-weight: 700;
}
</style>