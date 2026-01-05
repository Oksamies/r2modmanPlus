<template>
  <div class="game-header">
    <div class="game-header__left">
      <button class="game-header__back-btn" @click="$router.push({name: 'index'})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <h1 class="game-header__title">{{ activeGame.displayName }}</h1>
    </div>
    <div class="game-header__right">
      <div class="game-header__actions">
        <button class="game-header__btn game-header__btn--primary" @click="launchModded">
          <i class="fas fa-play"></i>
          Play modded
        </button>
        <button class="game-header__btn game-header__btn--secondary" @click="launchVanilla">
          <i class="fas fa-play"></i>
          Play vanilla
        </button>
      </div>
      <div class="game-header__profile" @click="$router.push({name: 'profiles'})">
        <div class="game-header__profile-info">
          <span class="game-header__profile-label">PROFILE</span>
          <span class="game-header__profile-name">{{ activeProfile ? activeProfile.getProfileName() : 'Default' }}</span>
        </div>
        <i class="fas fa-chevron-down game-header__profile-icon"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import GameRunnerProvider from '../providers/generic/game/GameRunnerProvider';

const store = getStore<State>();
const activeGame = computed(() => store.state.activeGame);
const activeProfile = computed(() => store.getters['profile/activeProfile']);

const launchModded = () => {
    if (activeProfile.value) {
        GameRunnerProvider.instance.startModded(activeGame.value, activeProfile.value);
    }
}

const launchVanilla = () => {
    if (activeProfile.value) {
        GameRunnerProvider.instance.startVanilla(activeGame.value, activeProfile.value);
    }
}
</script>

<style lang="scss" scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: transparent;
  height: 80px;
  flex-shrink: 0;
  gap: 24px;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__back-btn {
    background: rgba(59, 63, 125, 0.24); /* Surface/a4 */
    border: none;
    color: #a7aed2; /* Text/Tertiary */
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(59, 63, 125, 0.4);
    }

    i {
      font-size: 16px;
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: #f5f5f6; /* Text/Primary */
    margin: 0;
    line-height: 1.2;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 24px;
    height: 48px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    i {
      font-size: 14px;
    }

    &--primary {
      background: #23ffab;
      color: #111121;
      box-shadow: inset 0px 0px 16px 0px #40ae7f, 0px 0px 12px 0px rgba(35, 255, 171, 0.4);

      &:hover {
        filter: brightness(1.1);
      }
      
      &:active {
        filter: brightness(0.95);
      }
    }

    &--secondary {
      background: rgba(70, 70, 149, 0.66);
      color: #f5f5f6;

      &:hover {
        background: rgba(70, 70, 149, 0.8);
      }
    }
  }

  &__profile {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(59, 63, 125, 0.24);
    border: 1px solid rgba(70, 70, 149, 0.66);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 180px;
    height: 48px;
    justify-content: space-between;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(59, 63, 125, 0.4);
    }

    &-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      line-height: 1.2;
    }

    &-label {
      font-size: 10px;
      font-weight: 700;
      color: #cbd0ec; /* Text/Secondary */
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &-name {
      font-weight: 700;
      font-size: 14px;
      color: #f5f5f6;
    }

    &-icon {
      color: #a7aed2;
      font-size: 12px;
    }
  }
}
</style>
