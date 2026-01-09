<template>
    <div class="app-root">
        <NavigationHeader />
        <div class="app-body island">
            <aside class="app-sidebar non-selectable">
                <NavigationMenu />
            </aside>
            <main class="app-content island">
                <router-view />
            </main>
        </div>
        <NavigationFooter />
    </div>
</template>

<script lang="ts" setup>
import NavigationHeader from './NavigationHeader.vue';
import NavigationMenu from './NavigationMenu.vue';
import NavigationFooter from './NavigationFooter.vue';
</script>

<style lang="scss">
.app-root {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: #050510;
    display: flex;
    flex-direction: column;
}

.app-body {
    overflow: hidden;
    padding: 4px 0;
    flex: 1;}

.app-sidebar {
    width: auto;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.app-content {
    // overflow-y: auto;
    position: relative;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
}
</style>

