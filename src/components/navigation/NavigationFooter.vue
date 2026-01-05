<template>
    <div class="navigation-footer island-item">
        <div class="footer-content">
            <!-- Status Text (Placeholder for now) -->
            <div class="footer-status">
                <i class="fas fa-sync fa-spin status-icon" v-if="isBusy"></i>
                <span class="status-text">{{ statusText }}</span>
            </div>

            <!-- Actions -->
            <div class="footer-actions">
                <button class="action-button text-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                </button>
                <button class="action-button">
                    <i class="fas fa-bell"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const isBusy = ref(false);
const statusText = ref("Ready");

// TODO: Connect to global status store
</script>

<style lang="scss" scoped>
.navigation-footer {
    padding: 0 1rem;
    /* background-color: var(--island-bg-color, #101028); */ /* Handled by island-item */
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-end; /* Align content to right as per Figma */
    color: #a7aed2;
    font-size: 11px;
    flex-shrink: 0;
    border-radius: 0;
}

.footer-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    justify-content: flex-end;
}

.footer-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-icon {
    font-size: 12px;
}

.footer-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: 0.5rem;
}

.action-button {
    background: none;
    border: none;
    color: #a7aed2;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        color: #fff;
    }
    
    &.text-warning {
        color: #f3cf4f;
    }
}
</style>
