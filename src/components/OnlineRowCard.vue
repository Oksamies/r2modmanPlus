<template>
    <keep-alive>
        <div class='row-card nimbus-card' :class="[{'row-card--expanded': isSelected}]">
            <div class='cursor-pointer'>
                <header class='nimbus-card__header' :id='id'>
                    <div class='nimbus-card__header-icon mod-logo' v-if="image !== ''">
                        <figure class='image is-48x48 image-parent'>
                            <img :src='image' alt='Mod Logo' class='image-overlap'/>
                            <img v-if="store.state.profile.funkyMode" src='../assets/funky_mode.png' alt='Mod Logo' class='image-overlap'/>
                        </figure>
                    </div>
                    <span ref="title" class='nimbus-card__title'><slot name='title'></slot></span>
                    <slot name='other-icons'></slot>
                </header>
            </div>
        </div>
    </keep-alive>
</template>

<script lang='ts' setup>
import { onMounted } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';

const store = getStore<State>();

type OnlineRowCardProps = {
    isSelected: boolean;
    image: string;
    id: string;
}

const props = defineProps<OnlineRowCardProps>();

onMounted(async () => {
    await store.dispatch('profile/loadModCardSettings');
});
</script>


<style lang="scss" scoped>
.nimbus-card__title {
    word-break: break-all;
}
</style>
