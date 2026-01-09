<template>
  <div class="cyberstorm-container cyberstorm-container--y cyberstorm-container--full island" style="display: flex; width: 100%; max-height: 100%;">
    <GameHeader />
    <PackageList mode="installed" class="island-item cyberstorm-container cyberstorm-container--full" />
  </div>
</template>

<script lang="ts" setup>
import GameHeader from '../GameHeader.vue';
import PackageList from '../PackageList.vue';
</script>

<style lang="scss" scoped>
/* .view-container styles replaced by utility classes */
</style>
