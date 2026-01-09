<template>
    <div class="radio-group">
        <div 
            v-for="section in sections" 
            :key="section.uuid" 
            class="radio-item"
            :class="{ 'is-selected': selected === section.uuid }"
            @click="setSelected(section.uuid)"
        >
            <div class="radio-circle">
                <div class="radio-dot" v-if="selected === section.uuid"></div>
            </div>
            <span class="radio-label">{{ section.name }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import type { Section } from '../../../../r2mm/api/schemas/objectSchemas';

export type SectionOption = Section | { uuid: string; name: string; slug: string; priority: number };

defineProps({
    sections: {
        type: Array as PropType<SectionOption[]>,
        required: true
    },
    selected: {
        type: String,
        required: true
    },
    setSelected: {
        type: Function as PropType<(uuid: string) => void>,
        required: true
    }
});
</script>

<style lang="scss" scoped>
.radio-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.radio-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    user-select: none;

    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

.radio-circle {
    width: 18px;
    height: 18px;
    border: 1px solid #484b6b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a1a2e;
}

.radio-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #23ffab;
}

.radio-label {
    color: #a7aed2;
    font-size: 14px;
    
    .is-selected & {
        color: #f5f5f6;
        font-weight: bold;
    }
}
</style>
