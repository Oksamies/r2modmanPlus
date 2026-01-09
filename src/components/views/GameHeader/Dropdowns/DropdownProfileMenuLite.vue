<template>
  <div class="dropdown-container">
    <template v-if="!showAdvanced">
      <div class="dropdown-item" @click="$emit('rename')">
        <div class="icon-wrapper">
          <i class="fas fa-pen icon"></i>
        </div>
        <span class="label">Rename</span>
      </div>
      <div class="dropdown-item" @click="$emit('share')">
        <div class="icon-wrapper">
          <i class="fas fa-users icon"></i>
        </div>
        <span class="label">Share</span>
      </div>
      <div class="dropdown-item" @click="$emit('backup')">
        <div class="icon-wrapper">
          <i class="fas fa-download icon"></i>
        </div>
        <span class="label">Backup</span>
      </div>
      <div class="dropdown-item" @click="$emit('clone')">
        <div class="icon-wrapper">
          <i class="fas fa-clone icon"></i>
        </div>
        <span class="label">Clone</span>
      </div>
      <div class="dropdown-item" @click="$emit('sync')">
        <div class="icon-wrapper">
          <i class="fas fa-sync icon"></i>
        </div>
        <span class="label">Sync</span>
      </div>
      <div class="dropdown-item" @click.stop="showAdvanced = true">
        <div class="icon-wrapper">
          <i class="fas fa-wrench icon"></i>
        </div>
        <span class="label flex-1">Advanced</span>
        <i class="fas fa-chevron-right chevron"></i>
      </div>
      <div class="divider"></div>
      <div class="dropdown-item is-danger" @click="$emit('delete')">
        <div class="icon-wrapper">
          <i class="fas fa-trash-alt icon"></i>
        </div>
        <span class="label">Delete</span>
      </div>
    </template>
    <template v-else>
      <div class="dropdown-item" @click.stop="showAdvanced = false">
        <div class="icon-wrapper">
          <i class="fas fa-chevron-left icon"></i>
        </div>
        <span class="label">Back</span>
      </div>
      <div class="divider"></div>
      <div class="dropdown-item" @click="$emit('export-file')">
        <div class="icon-wrapper">
          <i class="fas fa-file-alt icon"></i>
        </div>
        <span class="label">Export as a file</span>
      </div>
      <div class="dropdown-item" @click="$emit('export-code')">
        <div class="icon-wrapper">
          <i class="fas fa-cloud-upload-alt icon"></i>
        </div>
        <span class="label">Export as a code</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// DropdownProfileMenuLite
defineEmits(['rename', 'share', 'backup', 'clone', 'sync', 'advanced', 'delete', 'export-file', 'export-code']);

const showAdvanced = ref(false);
</script>

<style lang="scss" scoped>
$bg-color: #191b38;
$border-color: rgba(61, 61, 127, 0.44);
$text-primary: #f5f5f6;
$text-secondary: #a7aed2;
$danger-color: #f1385a;
$hover-bg: rgba(255, 255, 255, 0.1);

.dropdown-container {
  position: absolute;
  top: 100%;
  left: 0;
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
  min-width: 200px;
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

  &.is-danger {
    .label {
      color: $danger-color;
    }
    .icon {
      color: $danger-color;
    }
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
  
  &.flex-1 {
    flex: 1;
  }
}

.chevron {
  font-size: 14px;
  color: $text-secondary;
}

.divider {
  height: 1px;
  width: 100%;
  background-color: $border-color;
  margin: 4px 0;
}
</style>