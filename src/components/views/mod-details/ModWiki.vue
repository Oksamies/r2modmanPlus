<template>
    <div class="tab-content">
         <div class="empty-placeholder">
            <p>Wiki not available in this view.</p>
            <a v-if="modDetails && modDetails.website_url" :href="modDetails.website_url" target="_blank" class="link-btn">
                Visit Website <i class="fas fa-external-link-alt"></i>
            </a>
         </div>
    </div>
</template>

<script lang="ts" setup>
import { inject, Ref } from 'vue';
import { PackageListingDetailsResponseData } from '../../../r2mm/api/schemas/responseSchemas';

const modDetails = inject<Ref<PackageListingDetailsResponseData | null>>('modDetails');

</script>

<style lang="scss" scoped>
$text-secondary: #a7aed2;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.link-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: $accent-green;
    text-decoration: none; 
    font-weight: 700;
    &:hover { text-decoration: underline; }
}
</style>