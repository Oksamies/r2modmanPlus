<template>
    <div class="collapsible" :class="{ 'is-open': isOpen }">
        <div class="collapsible-header" @click="toggle">
            <div class="collapsible-title">
                <slot name="title"></slot>
            </div>
            <div class="collapsible-icon">
                <i class="fas" :class="isOpen ? 'fa-minus' : 'fa-plus'"></i>
            </div>
        </div>
        <div class="collapsible-body" v-show="isOpen">
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const isOpen = ref(false);

function toggle() {
    isOpen.value = !isOpen.value;
}
</script>

<style lang="scss" scoped>
.collapsible {
    border-bottom: 1px solid #29295b;
    width: 100%;

    &.is-open {
        .collapsible-icon {
            color: #23ffab;
        }
    }
}

.collapsible-header {
    display: flex;
    align-items: center;
    padding: 16px 0;
    cursor: pointer;
    gap: 16px;
}

.collapsible-title {
    flex: 1;
    font-weight: bold;
    color: #f5f5f6;
    font-size: 16px;
}

.collapsible-icon {
    color: #23ffab;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
}

.collapsible-body {
    padding-bottom: 24px;
    color: #a7aed2;
    font-size: 14px;
    line-height: 1.5;
}
</style>
