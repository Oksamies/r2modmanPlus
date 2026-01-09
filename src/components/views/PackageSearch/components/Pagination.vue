<template>
    <div class="package-search__pagination" v-if="totalPages > 1">
        <button 
            class="page-btn nav-btn" 
            :disabled="currentPage === 1"
            @click="onPageChange(currentPage - 1)"
        >
            <i class="fas fa-chevron-left"></i>
        </button>

        <div class="page-input-wrapper">
            <span class="text-prefix">Page</span>
            <input 
                type="number" 
                v-model.number="pageInput"
                @keydown.enter="submitPage"
                @blur="submitPage"
                class="page-input"
                min="1"
                :max="totalPages"
            />
            <span class="text-suffix">of {{ totalPages }}</span>
        </div>

        <button 
            class="page-btn nav-btn" 
            :disabled="currentPage === totalPages"
            @click="onPageChange(currentPage + 1)"
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}>();

const totalPages = computed(() => Math.ceil(props.totalCount / props.pageSize));
const pageInput = ref(props.currentPage);

watch(() => props.currentPage, (newVal) => {
    pageInput.value = newVal;
});

function submitPage() {
    let p = pageInput.value;
    if (!p || p < 1) p = 1;
    if (p > totalPages.value) p = totalPages.value;
    
    pageInput.value = p;
    
    if (p !== props.currentPage) {
        props.onPageChange(p);
    }
}
</script>

<style lang="scss" scoped>
.package-search__pagination {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #111121;
    border: 1px solid #29295b;
    border-radius: 4px;
    color: #f5f5f6;
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        border-color: #29295b;
    }

    &:not(:disabled):hover {
        border-color: #23ffab;
        color: #fff;
    }
    
    &:not(:disabled):active {
        background-color: #29295b;
    }
}

.page-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a7aed2;
    font-size: 14px;
}

.page-input {
    width: 48px;
    height: 28px;
    background-color: #111121;
    border: 1px solid #29295b;
    border-radius: 4px;
    color: #f5f5f6;
    text-align: center;
    font-size: 13px;
    font-family: inherit;
    
    &:focus {
        border-color: #23ffab;
        outline: none;
    }
    
    /* Hide number spinners */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    -moz-appearance: textfield;
}

.text-prefix, .text-suffix {
    white-space: nowrap;
}
</style>
