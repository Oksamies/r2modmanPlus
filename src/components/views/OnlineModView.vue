<template>
  <div class="cyberstorm-container--y cyberstorm-container--full island" style="display: flex; flex-direction: column; width: 100%; max-height: 100%;">
    <GameHeader />
    <PackageSearch />
  </div>
</template>

<script lang="ts" setup>
import GameHeader from '../GameHeader.vue';
import PackageSearch from './PackageSearch/PackageSearch.vue';
</script>

<style lang="scss" scoped>
/* .view-container styles replaced by utility classes */
</style>
