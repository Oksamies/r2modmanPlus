<template>
    <div class="settings-option">
        <div class="option-content">
            <div class="option-title">{{ title }}</div>
            <div class="option-description">{{ description }}</div>
        </div>
        <div class="option-control">
            <label class="switch">
                <input type="checkbox" :checked="modelValue" @change="updateValue">
                <span class="slider round"></span>
            </label>
        </div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    title: string;
    description: string;
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

function updateValue(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.checked);
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
    display: flex;
    align-items: center;
}

/* Switch styles */
.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 28px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #29295b; /* Inactive bg */
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: #a7aed2; /* Inactive knob */
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #23ffab; /* Active bg */
}

input:checked + .slider:before {
    transform: translateX(16px);
    background-color: #f5f5f6; /* Active knob */
}
</style>
