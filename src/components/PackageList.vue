<template>
  <div class="package-list">
    <div class="package-list__controls">
      <div class="package-list__search">
        <i class="q-icon material-icons">search</i>
        <input type="text" placeholder="Search for a mod..." />
      </div>
      <div class="package-list__filters">
        <button 
          v-for="filter in filters" 
          :key="filter"
          class="package-list__filter-btn"
          :class="{ 'package-list__filter-btn--active': activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
      <div class="package-list__sort" v-if="mode === 'online'">
        <span class="package-list__sort-label">Sort by:</span>
        <div class="package-list__select-wrapper">
            <select>
            <option>Best Match</option>
            <option>Downloads</option>
            <option>Rating</option>
            </select>
            <i class="q-icon material-icons">expand_more</i>
        </div>
      </div>
    </div>

    <div class="package-list__content">
      <div class="package-list__item" v-for="pkg in packages" :key="pkg.id">
        <img :src="pkg.image" class="package-list__item-image" />
        <div class="package-list__item-info">
          <div class="package-list__item-header">
            <h3 class="package-list__item-name">{{ pkg.name }}</h3>
            <span class="package-list__item-author">by {{ pkg.author }}</span>
          </div>
          <p class="package-list__item-desc">{{ pkg.description }}</p>
          <div class="package-list__item-tags">
            <span v-for="tag in pkg.tags" :key="tag" class="package-list__tag">{{ tag }}</span>
          </div>
        </div>
        
        <div class="package-list__item-actions">
          <template v-if="mode === 'installed'">
            <div class="package-list__switch-wrapper">
                <label class="package-list__switch">
                <input type="checkbox" :checked="pkg.enabled" />
                <span class="slider round"></span>
                </label>
            </div>
            <span class="package-list__version">v{{ pkg.version }}</span>
          </template>
          <template v-else>
            <div class="package-list__stat">
              <i class="q-icon material-icons">download</i>
              <span>{{ pkg.downloads }}</span>
            </div>
            <div class="package-list__stat">
              <i class="q-icon material-icons">thumb_up</i>
              <span>{{ pkg.likes }}</span>
            </div>
            <button class="package-list__download-btn">
              <i class="q-icon material-icons">download</i>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  mode: 'installed' | 'online';
}>();

const activeFilter = ref('All');

const filters = computed(() => {
  if (props.mode === 'installed') {
    return ['All', 'Updates', 'Disabled', 'Deprecated'];
  } else {
    return ['Categories', 'NSFW', 'Deprecated'];
  }
});

// Dummy data
const packages = ref([
  {
    id: 1,
    name: 'BepInExPack',
    author: 'bbepis',
    description: 'Unified BepInEx pack for Risk of Rain 2',
    image: 'https://thunderstore.io/package/icon/bbepis-BepInExPack-5.4.2117.png',
    tags: ['Dependency', 'Tool'],
    version: '5.4.2117',
    enabled: true,
    downloads: '12M',
    likes: '45k'
  },
  {
    id: 2,
    name: 'R2API',
    author: 'tristanmcpherson',
    description: 'A modding API for Risk of Rain 2',
    image: 'https://thunderstore.io/package/icon/tristanmcpherson-R2API-5.0.5.png',
    tags: ['API', 'Dependency'],
    version: '5.0.5',
    enabled: true,
    downloads: '10M',
    likes: '32k'
  },
  {
    id: 3,
    name: 'BetterUI',
    author: 'XoXFaby',
    description: 'Improvements to the UI',
    image: 'https://thunderstore.io/package/icon/XoXFaby-BetterUI-2.5.10.png',
    tags: ['Client-side', 'UI'],
    version: '2.5.10',
    enabled: false,
    downloads: '5M',
    likes: '15k'
  }
]);
</script>

<style lang="scss" scoped>
.package-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* background-color: #050510;  Removed to use island-item bg */
  color: #fff;
  overflow: hidden; /* Ensure rounded corners clip content */

  &__controls {
    display: flex;
    align-items: center;
    padding: 1rem 2rem;
    gap: 1rem;
    border-bottom: 1px solid #262639;
  }

  &__search {
    display: flex;
    align-items: center;
    background-color: #111121;
    border: 1px solid #262639;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    flex: 1;
    max-width: 400px;

    .q-icon {
      color: #9ca3af;
      margin-right: 0.5rem;
    }

    input {
      background: none;
      border: none;
      color: #fff;
      width: 100%;
      outline: none;

      &::placeholder {
        color: #6b7280;
      }
    }
  }

  &__filters {
    display: flex;
    gap: 0.5rem;
  }

  &__filter-btn {
    background: none;
    border: 1px solid transparent;
    color: #9ca3af;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: #fff;
      background-color: #1f2937;
    }

    &--active {
      background-color: #1f2937;
      color: #fff;
      border-color: #374151;
    }
  }

  &__sort {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__sort-label {
      color: #9ca3af;
      font-size: 0.9rem;
  }

  &__select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background-color: #111121;
      border: 1px solid #262639;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;

      select {
          background: none;
          border: none;
          color: #fff;
          outline: none;
          appearance: none;
          padding-right: 1.5rem;
          cursor: pointer;
      }

      .q-icon {
          position: absolute;
          right: 0.5rem;
          pointer-events: none;
          font-size: 16px;
      }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__item {
    display: flex;
    align-items: center;
    background-color: #111121;
    padding: 1rem;
    border-radius: 4px;
    gap: 1rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: #1a1a2e;
    }

    &-image {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      object-fit: cover;
    }

    &-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    &-header {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    &-name {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    &-author {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    &-desc {
      font-size: 0.85rem;
      color: #d1d5db;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &-tags {
      display: flex;
      gap: 0.5rem;
    }

    &-tag {
      font-size: 0.7rem;
      background-color: #1f2937;
      color: #9ca3af;
      padding: 0.1rem 0.4rem;
      border-radius: 2px;
    }

    &-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
  }

  &__switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;

    input {
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .slider {
        background-color: #3b82f6;
      }

      &:checked + .slider:before {
        transform: translateX(20px);
      }
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #374151;
      transition: .4s;
      border-radius: 20px;

      &:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
    }
  }

  &__version {
      color: #9ca3af;
      font-size: 0.9rem;
      min-width: 60px;
      text-align: right;
  }

  &__stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #9ca3af;
      font-size: 0.9rem;

      .q-icon {
          font-size: 16px;
      }
  }

  &__download-btn {
      background-color: #1f2937;
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
          background-color: #374151;
      }
  }
}
</style>
