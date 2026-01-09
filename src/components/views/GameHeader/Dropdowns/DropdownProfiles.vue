<template>
  <div class="dropdown-profiles">
    <div class="dropdown-container">
      <div class="search-input">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          placeholder="Search profiles..." 
          class="search-field"
          v-model="searchQuery"
          @click.stop
        />
      </div>
    </div>
    
    <div class="divider"></div>

    <div class="scrollable-content">
      <!-- Local Section -->
      <div class="section-container">
        <div class="section-header">
          <span class="section-title text-cyber-green">LOCAL</span>
        </div>
        
        <div v-if="filteredProfiles.length === 0" class="dropdown-item">
             <span class="item-text">No profiles found</span>
        </div>

        <button 
            v-for="profile in filteredProfiles" 
            :key="profile"
            class="dropdown-item"
            :class="{ 'is-hover': isActive(profile) }"
            @click="selectProfile(profile)"
        >
          <div class="profile-row">
            <!-- <div class="version-text">1.0.0</div> -->
            <div class="profile-name-text">{{ profile }}</div>
            <!-- <div class="tag is-dark is-xs">
              <span class="tag-label">?</span>
            </div> -->
          </div>
          <i v-if="isActive(profile)" class="fas fa-check item-icon text-cyber-green"></i>
        </button>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineComponent, ref, computed } from 'vue';
import { getStore } from '../../../../providers/generic/store/StoreProvider';
import { State } from '../../../../store';
import { useRouter } from 'vue-router';
import R2Error from '../../../../model/errors/R2Error';
import GameRunnerProvider from '../../../../providers/generic/game/GameRunnerProvider';

const store = getStore<State>();
const router = useRouter();
const searchQuery = ref('');

const profileList = computed(() => store.state.profiles.profileList);
const activeProfileName = computed(() => store.getters['profile/activeProfileName']);

const filteredProfiles = computed(() => {
    if (!searchQuery.value) return profileList.value;
    return profileList.value.filter(p => p.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const isActive = (profileName: string) => profileName === activeProfileName.value;

const selectProfile = async (profileName: string) => {
    if (profileName === activeProfileName.value) return;

    try {
        await store.dispatch('profiles/setSelectedProfile', { profileName: profileName, prewarmCache: true });
        // Optional: Trigger game reload or just view update?
        // Usually switching profile implies looking at different mods.
        // If we are in the manager view, it should update automatically via reactivity.
    } catch (e) {
        const err = R2Error.fromThrownValue(e, 'Error while selecting profile');
        store.commit('error/handleError', err);
    }
};

</script>

<style lang="scss" scoped>
// Variables based on Figma design tokens
$bg-color: #191b38;
$border-color: rgba(61, 61, 127, 0.44);
$input-bg: rgba(59, 63, 125, 0.24);
$input-border: rgba(70, 70, 149, 0.66);
$input-placeholder: #a7aed2;
$divider-color: rgba(61, 61, 127, 0.44);
$text-primary: #f5f5f6;
$text-secondary: #a7aed2; // tertiary in figma
$cyber-green: #23ffab;
$hover-bg: rgba(63, 63, 136, 0.55);
$shared-pink: #df56d1;
$subscribed-blue: #1ca3f5;
$tag-bg-dark: rgba(70, 70, 149, 0.66);

.dropdown-profiles {
  background-color: $bg-color;
  border: 1px solid $border-color;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0px 12px 24px 5px rgba(0, 0, 0, 0.75);
  width: 100%;
  height: 100%; // "size-full" in tailwind
  align-items: flex-start;
}

.dropdown-container {
  padding: 12px 16px;
  width: 100%;
  box-sizing: border-box;
}

.search-input {
  background-color: $input-bg;
  border: 1px solid $input-border;
  border-radius: 8px;
  height: 36px;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 10px 16px;
  width: 100%;
  box-sizing: border-box;
}

.search-icon {
  color: $text-secondary;
  font-size: 14px; // implied
}

.search-field {
  background: transparent;
  border: none;
  color: $text-primary; // Guessing input text color
  flex: 1;
  min-width: 0;
  outline: none;
  font-family: 'Inter', sans-serif; // var(--font/family/body)
  font-weight: 400;
  font-size: 14px;
  color: $input-placeholder; // Using placeholder color for now based on design text
  
  &::placeholder {
    color: $input-placeholder;
  }
}

.divider {
  height: 1px;
  width: 100%;
  background-color: $divider-color;
  margin: 0; 
  // In figma, dividers are buttons or wrappers with padding, 
  // simplified here to a div
}

.scrollable-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.section-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  box-sizing: border-box;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  min-height: 36px;
  padding: 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  text-decoration: none; // in case of router-link

  &.is-hover {
    background-color: $hover-bg;
  }
}

.profile-row {
   display: flex;
   align-items: center;
   gap: 8px;
   flex: 1;
}

.version-text {
  color: $text-secondary;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  width: 31px; // from figma
  text-align: left;
}

.profile-name-text {
  color: $text-primary;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  flex: 1;
}

.item-text {
  color: $text-primary;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  flex: 1;

  &.is-hover-text {
    color: $text-primary; // var(--dropdown-item/text-color--hover)
  }
}

.tag {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    padding: 4px 8px;
    border-radius: 100px; // full pill
    gap: 6px;
    
    &.is-dark {
        background-color: $tag-bg-dark;
    }
    
    &.is-xs {
        // specific sizes if needed
    }
}

.tag-label {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 10px; // var(--tag/xs/font-size)
    color: $text-primary;
    line-height: normal;
}

.item-icon {
  font-size: 14px;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 14px;
  height: 14px;
}

/* Helpers */
.text-cyber-green { color: $cyber-green; }
.text-shared-pink { color: $shared-pink; }
.text-subscribed-blue { color: $subscribed-blue; }

/* Custom Scrollbar to match "overflow-clip" / "overflow-y-auto" look if needed
   (Usually handled globally or by OS, but adding basic styling) */
.scrollable-content::-webkit-scrollbar {
  width: 6px;
}
.scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}
.scrollable-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>