<template>
    <div class="checkbox-list">
        <div 
            v-for="item in items" 
            :key="item.label" 
            class="checkbox-item"
            @click.prevent="cycleState(item)"
        >
            <div 
                class="checkbox-box" 
                :class="{ 
                    'is-include': item.state === 'include' || item.state === true,
                    'is-exclude': item.state === 'exclude'
                }"
            >
                <i v-if="item.state === 'include' || item.state === true" class="fas fa-check"></i>
                <i v-else-if="item.state === 'exclude'" class="fas fa-times"></i>
            </div>
            <span class="checkbox-label">{{ item.label }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';

export type TriState = 'include' | 'exclude' | 'off' | boolean;

export interface CheckboxItem {
    label: string;
    state: TriState;
    setStateFunc: (v: TriState) => void;
}

const props = defineProps({
    items: {
        type: Array as PropType<CheckboxItem[]>,
        required: true
    }
});

const cycleState = (item: CheckboxItem) => {
    // If it's boolean, toggle. If it's tristate, cycle.
    if (typeof item.state === 'boolean') {
        item.setStateFunc(!item.state);
        return;
    }

    // Cycle: off -> include -> exclude -> off
    let next: TriState = 'off';
    if (item.state === 'off') next = 'include';
    else if (item.state === 'include') next = 'exclude';
    else if (item.state === 'exclude') next = 'off';
    
    item.setStateFunc(next);
};
</script>

<style lang="scss" scoped>
.checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.checkbox-item {
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

.checkbox-box {
    width: 18px;
    height: 18px;
    border: 1px solid #484b6b;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.2s;
    background-color: #1a1a2e;

    &.is-include {
        background-color: #23ffab;
        border-color: #23ffab;
        color: #031912;
    }

    &.is-exclude {
        background-color: #ef4444;
        border-color: #ef4444;
        color: #fff;
    }
}

.checkbox-label {
    color: #a7aed2;
    font-size: 14px;
}
</style>
