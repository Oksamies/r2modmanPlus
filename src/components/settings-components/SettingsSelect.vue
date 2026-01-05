<template>
    <div class="settings-option">
        <div class="option-content">
            <div class="option-title">{{ title }}</div>
            <div class="option-description">{{ description }}</div>
        </div>
        <div class="option-control">
            <div class="select-wrapper">
                <select :value="modelValue" @change="updateValue">
                    <option v-for="option in options" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
                <i class="fas fa-caret-down select-icon"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    title: string;
    description: string;
    modelValue: string | number | null;
    options: { label: string; value: string | number | null }[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | null): void;
}>();

function updateValue(event: Event) {
    const target = event.target as HTMLSelectElement;
    emit('update:modelValue', target.value);
}
</script>

<style lang="scss" scoped>
.settings-option {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    width: 100%;
    padding: 8px 0;
}

.option-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.option-title {
    font-weight: bold;
    font-size: 16px;
    color: #f5f5f6;
}

.option-description {
    font-size: 14px;
    color: #a7aed2;
    line-height: 1.5;
}

.option-control {
    width: 200px; /* Adjust as needed */
}

.select-wrapper {
    position: relative;
    width: 100%;
}

select {
    width: 100%;
    appearance: none;
    background-color: rgba(70, 70, 149, 0.66);
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    color: #f5f5f6;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    outline: none;
}

.select-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #f5f5f6;
    pointer-events: none;
    font-size: 14px;
}
</style>
