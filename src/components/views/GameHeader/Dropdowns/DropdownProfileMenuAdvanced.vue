<template>
  <div class="dropdown-container">
    <div class="dropdown-item" @click="$emit('set-launch-parameters')">
      <div class="icon-wrapper">
        <i class="fas fa-terminal icon"></i>
      </div>
      <span class="label">Set launch parameters</span>
    </div>
    <div class="dropdown-item" @click="$emit('show-dependency-strings')">
      <div class="icon-wrapper">
        <i class="fas fa-stream icon"></i>
      </div>
      <span class="label">Show dependency strings</span>
    </div>
    <div class="dropdown-item" @click="$emit('browse-profile-directory')">
      <div class="icon-wrapper">
        <i class="fas fa-folder-open icon"></i>
      </div>
      <span class="label">Browse profile directory</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
// DropdownProfileMenuAdvanced
defineEmits(['set-launch-parameters', 'show-dependency-strings', 'browse-profile-directory']);
</script>

<style lang="scss" scoped>
$bg-color: #191b38;
$border-color: rgba(61, 61, 127, 0.44);
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$hover-bg: rgba(255, 255, 255, 0.1);

.dropdown-container {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  z-index: 100;
  background-color: $bg-color;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0px 12px 24px 5px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 240px; /* Slightly wider from design observation */
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 36px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;

  &:hover {
    background-color: $hover-bg;
  }
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 14px;
  height: 14px;
}

.icon {
  font-size: 14px;
  color: $text-secondary;
}

.label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: $text-primary;
  font-weight: 400;
  line-height: normal;
}
</style>