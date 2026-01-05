<script lang="ts" setup>
import Timeout = NodeJS.Timeout;
import { onMounted, ref, onUnmounted } from 'vue';

type SettingsItemProps = {
    action?: string;
    description?: string;
    value?: () => Promise<any>;
    icon?: string;
}

const reactiveValue = ref<any | null>(null);
const timeout = ref<Timeout | null>(null);

const props = withDefaults(defineProps<SettingsItemProps>(), {
    action: '',
    description: '',
    icon: '',
    value: () => Promise.resolve(null)
});

const emits = defineEmits<{
    (e: 'click'): void;
}>();

onMounted(async () => {
    if (timeout.value !== null) {
        clearInterval(timeout.value);
    }
    props.value().then(value => reactiveValue.value = value);
    timeout.value = setInterval(() => {
        props.value().then(value => reactiveValue.value = value);
    }, 1000);
});

onUnmounted(() => {
    if (timeout.value !== null) {
        clearInterval(timeout.value);
        timeout.value = null;
    }
})

function emitClick() {
    emits('click');
    setTimeout(() => {
        props.value().then(value => reactiveValue.value = value);
    }, 20);
}

</script>

<template>
    <div class="settings-item" @click="emitClick()">
        <div class="settings-item__content">
            <div class="settings-item__header">
                <span class="settings-item__title">{{ action }}</span>
            </div>
            <p class="settings-item__description">{{ description }}</p>
            <p class="settings-item__value" v-if="reactiveValue !== null">{{ reactiveValue }}</p>
        </div>
        <div class="settings-item__action">
            <i :class="['fas', icon || 'fa-chevron-right']" aria-hidden="true"></i>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #111120;
    border: 1px solid #252535;
    border-radius: 4px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    margin-bottom: 8px;

    &:hover {
        background: #18182a;
        border-color: #353545;
    }

    &__content {
        flex: 1;
        margin-right: 16px;
        overflow: hidden;
    }

    &__header {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
    }

    &__title {
        color: #e2e2e2;
        font-weight: 600;
        font-size: 14px;
    }

    &__description {
        color: #9e9e9e;
        font-size: 12px;
        line-height: 1.4;
        margin: 0 0 4px 0;
    }

    &__value {
        color: #3273dc;
        font-size: 12px;
        font-family: monospace;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__action {
        color: #5e5e5e;
        font-size: 14px;
        flex-shrink: 0;
    }
}
</style>
