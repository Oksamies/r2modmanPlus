# React + Vite Migration Guide

## Table of Contents
- [Executive Summary](#executive-summary)
- [Migration Overview](#migration-overview)
- [Technology Stack Comparison](#technology-stack-comparison)
- [Architecture Conversion](#architecture-conversion)
- [State Management Migration](#state-management-migration)
- [Component Conversion Strategy](#component-conversion-strategy)
- [Data Ingress/Egress Patterns](#data-ingressegress-patterns)
- [Build Pipeline Transformation](#build-pipeline-transformation)
- [Routing Migration](#routing-migration)
- [Styling Migration](#styling-migration)
- [Testing Strategy](#testing-strategy)
- [Migration Roadmap](#migration-roadmap)
- [Risk Assessment](#risk-assessment)
- [Appendix: Code Examples](#appendix-code-examples)

---

## Executive Summary

This document provides a comprehensive guide for migrating r2modman from **Vue 3 + Quasar + Vite** to **React + Vite + Electron**, while maintaining full feature parity and improving performance.

### Current Stack
- **Frontend**: Vue 3.5.16 (Composition API)
- **UI Framework**: Quasar 2.18.1
- **State Management**: Vuex 4.1.0
- **Build Tool**: Vite (via Quasar CLI)
- **Desktop**: Electron 38.1.2
- **Styling**: SCSS + Bulma + Quasar components

### Target Stack
- **Frontend**: React 18.3+
- **UI Framework**: Material-UI (MUI) or shadcn/ui
- **State Management**: Redux Toolkit + RTK Query
- **Build Tool**: Vite 5.0+
- **Desktop**: Electron 38.1.2 (unchanged)
- **Styling**: Tailwind CSS + CSS Modules

### Migration Scope

| Component | Files | Effort | Risk |
|-----------|-------|--------|------|
| Vue Components | 62 files | 8 weeks | 🟡 Medium |
| TypeScript Logic | 219 files | 4 weeks | 🟢 Low |
| Vuex Stores | 9 modules | 3 weeks | 🟡 Medium |
| Build Configuration | 5 files | 2 weeks | 🔴 High |
| Routing | 1 file | 1 week | 🟢 Low |
| Styling | SCSS + Bulma | 4 weeks | 🟡 Medium |
| Testing | Minimal | 2 weeks | 🟢 Low |
| **Total** | **281 files** | **24 weeks** | - |

### Key Benefits of Migration

1. **Performance**: React's reconciliation algorithm may be faster for large lists
2. **Ecosystem**: Larger React ecosystem with more third-party libraries
3. **Developer Pool**: Easier to find React developers
4. **Type Safety**: Better TypeScript integration with React
5. **Modern Tooling**: Direct Vite integration without Quasar CLI layer

### Key Challenges

1. **Large Codebase**: 62 Vue components to convert
2. **State Management**: Vuex → Redux Toolkit requires careful planning
3. **UI Components**: Quasar → MUI/shadcn requires redesign
4. **Testing**: Need to establish React testing patterns
5. **Feature Parity**: Must maintain all 28 documented pain points (not introduce new ones)

---

## Migration Overview

### Phase-Based Approach

**Phase 1: Setup & Foundation** (Weeks 1-2)
- Create parallel React build pipeline
- Set up Redux Toolkit
- Configure Vite for Electron
- Establish component patterns

**Phase 2: Core Infrastructure** (Weeks 3-6)
- Migrate state management
- Convert core models (no UI dependencies)
- Set up routing
- Establish styling system

**Phase 3: Component Migration** (Weeks 7-18)
- Convert components incrementally
- Feature-by-feature migration
- Parallel testing with Vue version

**Phase 4: Integration & Polish** (Weeks 19-22)
- Remove Vue dependencies
- Performance optimization
- Full QA pass
- Documentation updates

**Phase 5: Deployment** (Weeks 23-24)
- Beta testing
- Bug fixes
- Production rollout

---

## Technology Stack Comparison

### Frontend Framework

| Aspect | Vue 3 (Current) | React (Target) |
|--------|-----------------|----------------|
| **Component Model** | SFC (Single File Components) | JSX/TSX |
| **Reactivity** | Proxies (reactive, ref, computed) | Hooks (useState, useMemo, useCallback) |
| **Template Syntax** | HTML-based templates | JSX syntax |
| **Props** | defineProps() | function parameters |
| **Events** | defineEmits() | callback props |
| **Lifecycle** | onMounted, onUnmounted | useEffect |
| **Code Organization** | `<script setup>` | Function components |
| **Type Safety** | Good with script setup | Excellent with TypeScript |

### State Management

| Aspect | Vuex (Current) | Redux Toolkit (Target) |
|--------|----------------|------------------------|
| **Store Structure** | Modules with state/actions/mutations/getters | Slices with reducers & actions |
| **Mutations** | Explicit mutations | Immer-based reducers |
| **Actions** | Async actions via actions | Thunks or RTK Query |
| **Getters** | Computed getters | Selectors (Reselect) |
| **DevTools** | Vue DevTools | Redux DevTools |
| **Typing** | Manual typing | Excellent TS inference |

### UI Framework

| Aspect | Quasar (Current) | MUI (Option 1) | shadcn/ui (Option 2) |
|--------|------------------|----------------|----------------------|
| **Components** | 100+ built-in | 50+ components | Copy-paste primitives |
| **Theming** | SCSS variables | Theme provider | Tailwind + CSS vars |
| **Bundle Size** | ~200KB | ~300KB | Minimal (tree-shakeable) |
| **Customization** | Good | Good | Excellent |
| **Learning Curve** | Low | Medium | Low |
| **Desktop Feel** | Good | Excellent | Customizable |

**Recommendation**: **Material-UI (MUI)** for faster migration with comprehensive components

### Build Tool

| Aspect | Quasar CLI + Vite | Vite (Direct) |
|--------|-------------------|---------------|
| **Configuration** | quasar.config.ts | vite.config.ts |
| **Electron Integration** | Built-in | Via vite-plugin-electron |
| **Hot Reload** | Full | Full |
| **Build Speed** | Fast | Faster (less abstraction) |
| **Customization** | Limited | Full control |

---

## Architecture Conversion

### Project Structure Transformation

#### Current Structure (Vue)
```
r2modmanPlus/
├── src/
│   ├── App.vue                 # Root component
│   ├── pages/                  # Route pages (9 Vue files)
│   ├── components/             # Reusable components
│   │   ├── modals/
│   │   ├── views/
│   │   └── settings-components/
│   ├── store/                  # Vuex store
│   │   ├── index.ts
│   │   └── modules/            # 9 modules
│   ├── boot/                   # Quasar boot files
│   ├── router/                 # Vue Router
│   └── css/                    # SCSS styles
├── quasar.config.ts            # Quasar + Vite config
└── src-electron/               # Electron main process
```

#### Target Structure (React)
```
r2modmanPlus/
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Root component
│   ├── pages/                  # Route pages
│   ├── components/             # Reusable components
│   │   ├── modals/
│   │   ├── views/
│   │   └── settings/
│   ├── store/                  # Redux store
│   │   ├── index.ts
│   │   ├── slices/             # Redux slices
│   │   └── selectors/          # Reselect selectors
│   ├── hooks/                  # Custom React hooks
│   ├── router/                 # React Router
│   └── styles/                 # CSS/Tailwind
├── vite.config.ts              # Vite config
├── electron/                   # Electron main process
│   ├── main.ts
│   └── preload.ts
└── tailwind.config.js          # Tailwind config
```

### File Mapping

| Vue File | React Equivalent | Notes |
|----------|------------------|-------|
| `*.vue` | `*.tsx` | Component conversion |
| `store/modules/*.ts` | `store/slices/*.ts` | State management |
| `boot/*.ts` | `main.tsx` setup | App initialization |
| `quasar.config.ts` | `vite.config.ts` | Build configuration |
| `App.vue` | `App.tsx` | Root component |
| `*.scss` | `*.module.css` or Tailwind | Styling |

---

## State Management Migration

### Vuex to Redux Toolkit Conversion

#### Vuex Module Structure (Current)
```typescript
// src/store/modules/ProfileModule.ts
export default {
    namespaced: true,
    state: (): State => ({
        activeProfile: null,
        modList: [],
        searchQuery: ''
    }),
    getters: {
        activeProfile(state) {
            return state.activeProfile;
        },
        visibleModList(state): ManifestV2[] {
            let mods = [...state.modList];
            if (state.searchQuery) {
                mods = mods.filter(/*...*/);
            }
            return mods;
        }
    },
    mutations: {
        setActiveProfile(state, profileName) {
            state.activeProfile = new Profile(profileName);
        },
        setSearchQuery(state, query) {
            state.searchQuery = query;
        }
    },
    actions: {
        async tryLoadModListFromDisk({commit, state}) {
            const mods = await ProfileModList.getModList(state.activeProfile);
            commit('setModList', mods);
        }
    }
}
```

#### Redux Toolkit Slice (Target)
```typescript
// src/store/slices/profileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '@/model/Profile';
import { ManifestV2 } from '@/model/ManifestV2';
import ProfileModList from '@/r2mm/mods/ProfileModList';

interface ProfileState {
    activeProfile: Profile | null;
    modList: ManifestV2[];
    searchQuery: string;
    loading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    activeProfile: null,
    modList: [],
    searchQuery: '',
    loading: false,
    error: null
};

// Async thunk (replaces Vuex action)
export const loadModListFromDisk = createAsyncThunk(
    'profile/loadModListFromDisk',
    async (_, { getState }) => {
        const state = getState() as RootState;
        if (!state.profile.activeProfile) {
            throw new Error('No active profile');
        }
        const mods = await ProfileModList.getModList(state.profile.activeProfile);
        return mods;
    }
);

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        // Synchronous reducers (replace mutations)
        setActiveProfile: (state, action: PayloadAction<string>) => {
            state.activeProfile = new Profile(action.payload);
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        reset: (state) => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        // Handle async thunk
        builder
            .addCase(loadModListFromDisk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadModListFromDisk.fulfilled, (state, action) => {
                state.loading = false;
                state.modList = action.payload;
            })
            .addCase(loadModListFromDisk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to load mods';
            });
    }
});

export const { setActiveProfile, setSearchQuery, reset } = profileSlice.actions;
export default profileSlice.reducer;
```

#### Selectors (Replace Vuex Getters)
```typescript
// src/store/selectors/profileSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import SearchUtils from '@/utils/SearchUtils';

export const selectActiveProfile = (state: RootState) => state.profile.activeProfile;
export const selectModList = (state: RootState) => state.profile.modList;
export const selectSearchQuery = (state: RootState) => state.profile.searchQuery;

// Memoized selector (replaces Vuex getter)
export const selectVisibleModList = createSelector(
    [selectModList, selectSearchQuery],
    (modList, searchQuery) => {
        if (!searchQuery) return modList;
        
        const searchKeys = SearchUtils.makeKeys(searchQuery);
        return modList.filter(mod =>
            SearchUtils.isSearched(searchKeys, mod.getName(), mod.getDescription())
        );
    }
);
```

### Store Configuration

#### Redux Store Setup
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import profilesReducer from './slices/profilesSlice';
import tsModsReducer from './slices/tsModsSlice';
import downloadReducer from './slices/downloadSlice';
import modFilterReducer from './slices/modFilterSlice';
import modalsReducer from './slices/modalsSlice';
import errorReducer from './slices/errorSlice';

export const store = configureStore({
    reducer: {
        profile: profileReducer,
        profiles: profilesReducer,
        tsMods: tsModsReducer,
        download: downloadReducer,
        modFilter: modFilterReducer,
        modals: modalsReducer,
        error: errorReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore certain action types that have non-serializable data
                ignoredActions: ['profile/setActiveProfile'],
                ignoredPaths: ['profile.activeProfile']
            }
        }),
    devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Typed Hooks
```typescript
// src/hooks/reduxHooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Use throughout app instead of plain useDispatch and useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Component Conversion Strategy

### Vue to React Patterns

#### 1. Basic Component Structure

**Vue (Current)**:
```vue
<template>
    <div class="mod-card">
        <h3>{{ mod.name }}</h3>
        <p>{{ mod.description }}</p>
        <button @click="handleDownload">Download</button>
    </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Props {
    mod: ThunderstoreMod;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    download: [mod: ThunderstoreMod]
}>();

function handleDownload() {
    emit('download', props.mod);
}
</script>

<style scoped>
.mod-card {
    padding: 1rem;
    border: 1px solid #ccc;
}
</style>
```

**React (Target)**:
```tsx
// src/components/ModCard.tsx
import React from 'react';
import { ThunderstoreMod } from '@/model/ThunderstoreMod';
import styles from './ModCard.module.css';

interface ModCardProps {
    mod: ThunderstoreMod;
    onDownload: (mod: ThunderstoreMod) => void;
}

export const ModCard: React.FC<ModCardProps> = ({ mod, onDownload }) => {
    const handleDownload = () => {
        onDownload(mod);
    };

    return (
        <div className={styles.modCard}>
            <h3>{mod.name}</h3>
            <p>{mod.description}</p>
            <button onClick={handleDownload}>Download</button>
        </div>
    );
};
```

#### 2. State Management

**Vue (Composition API)**:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const searchQuery = ref('');

const filteredMods = computed(() => {
    return store.getters['profile/visibleModList'];
});

function updateSearch(value: string) {
    store.commit('profile/setSearchQuery', value);
}
</script>
```

**React (Hooks)**:
```tsx
import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setSearchQuery } from '@/store/slices/profileSlice';
import { selectVisibleModList } from '@/store/selectors/profileSelectors';

function ModListComponent() {
    const dispatch = useAppDispatch();
    const filteredMods = useAppSelector(selectVisibleModList);
    const [searchQuery, setLocalSearchQuery] = useState('');

    const updateSearch = (value: string) => {
        setLocalSearchQuery(value);
        dispatch(setSearchQuery(value));
    };

    return (
        <div>
            <input 
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
            />
            {/* ... */}
        </div>
    );
}
```

#### 3. Lifecycle Hooks

**Vue**:
```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

onMounted(async () => {
    await loadData();
});

onUnmounted(() => {
    cleanup();
});
</script>
```

**React**:
```tsx
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        loadData();

        return () => {
            cleanup();
        };
    }, []); // Empty deps = mount/unmount only

    return <div>...</div>;
}
```

#### 4. Computed Values

**Vue**:
```vue
<script setup lang="ts">
import { computed } from 'vue';

const count = ref(0);
const doubleCount = computed(() => count.value * 2);
</script>
```

**React**:
```tsx
import { useMemo } from 'react';

function Component() {
    const [count, setCount] = useState(0);
    const doubleCount = useMemo(() => count * 2, [count]);

    return <div>{doubleCount}</div>;
}
```

#### 5. Watchers

**Vue**:
```vue
<script setup lang="ts">
import { watch } from 'vue';

watch(searchQuery, (newValue, oldValue) => {
    console.log('Search changed:', newValue);
});
</script>
```

**React**:
```tsx
import { useEffect } from 'react';

function Component() {
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        console.log('Search changed:', searchQuery);
    }, [searchQuery]); // Runs when searchQuery changes

    return <div>...</div>;
}
```

### Component Migration Priority

**High Priority** (Core functionality):
1. App.tsx - Root component
2. GameSelectionScreen.tsx - Entry point
3. Manager.tsx - Main view
4. InstalledModView.tsx - Mod management
5. OnlineModView.tsx - Mod discovery

**Medium Priority** (Secondary features):
6. Profiles.tsx - Profile management
7. ConfigEditor.tsx - Config editing
8. Settings.tsx - Settings panel
9. Help.tsx - Help documentation

**Low Priority** (Utilities & modals):
10-62. Remaining components (modals, utilities, etc.)

---

## Data Ingress/Egress Patterns

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                      │
│                    (React Components)                         │
└─────────────────────┬────────────────┬──────────────────────┘
                      │                │
                      ▼                ▼
         ┌────────────────────┐  ┌────────────────────┐
         │  Redux Store       │  │  Custom Hooks      │
         │  (State)           │  │  (Logic)           │
         └──────────┬─────────┘  └──────────┬─────────┘
                    │                       │
                    ▼                       ▼
         ┌─────────────────────────────────────────┐
         │         Business Logic Layer             │
         │  (Model classes, Utilities, Providers)   │
         └──────────┬──────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────────────────────────┐
         │          Data Access Layer               │
         │  (Dexie, FileSystem, Thunderstore API)   │
         └──────────────────────────────────────────┘
```

### Pattern 1: API Data Ingress (Thunderstore)

**Current (Vue + Vuex)**:
```typescript
// In Vuex action
async fetchThunderstoreModList({commit}) {
    commit('setUpdateStatus', 'Fetching...');
    try {
        const mods = await ThunderstoreAPI.fetchMods();
        commit('setMods', mods);
        await PackageDexieStore.saveMods(mods);
    } catch (error) {
        commit('error/handleError', error);
    }
}
```

**Target (React + RTK Query)**:
```typescript
// src/store/api/thunderstoreApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const thunderstoreApi = createApi({
    reducerPath: 'thunderstoreApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://thunderstore.io/' }),
    endpoints: (builder) => ({
        fetchModList: builder.query<ThunderstoreMod[], string>({
            query: (game) => `/c/${game}/api/v1/package-listing/`,
            // Automatically caches and dedupes requests
            keepUnusedDataFor: 3600, // 1 hour cache
        }),
        fetchModMetadata: builder.query<ModMetadata, string>({
            query: (fullName) => `/api/experimental/package/${fullName}/`,
        })
    })
});

export const { useFetchModListQuery, useFetchModMetadataQuery } = thunderstoreApi;
```

**Component Usage**:
```tsx
function OnlineModView() {
    const { data: mods, isLoading, error } = useFetchModListQuery('risk-of-rain-2');

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;

    return (
        <div>
            {mods?.map(mod => <ModCard key={mod.name} mod={mod} />)}
        </div>
    );
}
```

### Pattern 2: FileSystem Data Ingress

**Current (Vue + Vuex)**:
```typescript
async tryLoadModListFromDisk({commit, state}) {
    const mods = await ProfileModList.getModList(state.activeProfile);
    commit('setModList', mods);
}
```

**Target (React + Thunk)**:
```typescript
// src/store/slices/profileSlice.ts
export const loadModListFromDisk = createAsyncThunk(
    'profile/loadModListFromDisk',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            if (!state.profile.activeProfile) {
                throw new Error('No active profile');
            }
            const mods = await ProfileModList.getModList(state.profile.activeProfile);
            return mods;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Component usage
function InstalledModView() {
    const dispatch = useAppDispatch();
    const { modList, loading } = useAppSelector(state => state.profile);

    useEffect(() => {
        dispatch(loadModListFromDisk());
    }, [dispatch]);

    if (loading) return <LoadingSpinner />;
    return <ModList mods={modList} />;
}
```

### Pattern 3: IndexedDB (Dexie) Integration

**Both Vue and React use same Dexie API** (no changes needed):

```typescript
// src/r2mm/manager/PackageDexieStore.ts
// This layer remains unchanged - same API for both frameworks

import Dexie from 'dexie';

class PackageDexieStore extends Dexie {
    packages: Dexie.Table<PackageMetadata, string>;

    constructor() {
        super('PackageDatabase');
        this.version(1).stores({
            packages: 'full_name, name, owner, last_updated'
        });
    }

    async saveMods(mods: ThunderstoreMod[]) {
        await this.packages.bulkPut(mods.map(m => m.toJSON()));
    }

    async getModByName(fullName: string) {
        return await this.packages.get(fullName);
    }
}

export default new PackageDexieStore();
```

**Access Pattern** (React):
```tsx
function useModMetadata(fullName: string) {
    const [metadata, setMetadata] = useState<PackageMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        PackageDexieStore.getModByName(fullName)
            .then(setMetadata)
            .finally(() => setLoading(false));
    }, [fullName]);

    return { metadata, loading };
}
```

### Pattern 4: Electron IPC Communication

**Current (Vue)**:
```typescript
// Renderer process
import { ipcRenderer } from 'electron';

async function selectDirectory() {
    const result = await ipcRenderer.invoke('dialog:openDirectory');
    return result;
}
```

**Target (React with Typed IPC)**:
```typescript
// src/electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

const api = {
    selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    // ... other IPC methods
};

contextBridge.exposeInMainWorld('electronAPI', api);

// src/types/electron.d.ts
export interface ElectronAPI {
    selectDirectory: () => Promise<string | null>;
    openExternal: (url: string) => Promise<void>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

// Component usage
function SettingsComponent() {
    const handleSelectDirectory = async () => {
        const path = await window.electronAPI.selectDirectory();
        if (path) {
            // Update settings
        }
    };

    return <button onClick={handleSelectDirectory}>Select Directory</button>;
}
```

### Data Egress Patterns

#### 1. Download Progress Updates

**Current (Vuex)**:
```typescript
// In download action
for (const mod of mods) {
    await downloadMod(mod, (progress) => {
        commit('updateDownloadProgress', { modName: mod.name, progress });
    });
}
```

**Target (Redux)**:
```typescript
// src/store/slices/downloadSlice.ts
export const downloadMods = createAsyncThunk(
    'download/downloadMods',
    async (mods: ThunderstoreMod[], { dispatch }) => {
        for (const mod of mods) {
            await downloadMod(mod, (progress) => {
                dispatch(updateDownloadProgress({ 
                    modName: mod.name, 
                    progress 
                }));
            });
        }
    }
);
```

#### 2. File Write Operations

**Same API for both frameworks**:
```typescript
// src/r2mm/mods/ProfileModList.ts
export async function saveModList(profile: Profile, mods: ManifestV2[]) {
    const yaml = stringifyYaml(mods.map(m => m.toJSON()));
    await FsProvider.instance.writeFile(
        profile.joinToProfilePath('mods.yml'),
        yaml
    );
}
```

---

## Build Pipeline Transformation

### Current Build Pipeline (Quasar)

```yaml
# Current: quasar.config.ts
export default defineConfig((ctx) => {
    return {
        boot: ['i18n', 'floating-vue'],
        css: ['app.scss'],
        extras: ['roboto-font', 'material-icons'],
        build: {
            vueRouterMode: 'hash',
            target: { browser: ['esnext'], node: 'esnext' }
        },
        electron: {
            bundler: 'builder',
            builder: {
                appId: 'com.ebkr.r2modman',
                win: { target: 'nsis' },
                linux: { target: ['AppImage', 'deb', 'rpm'] },
                mac: { target: 'dmg' }
            }
        }
    };
});
```

### Target Build Pipeline (Vite)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                // Main process entry
                entry: 'electron/main.ts',
                onstart(args) {
                    args.startup();
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            {
                // Preload script
                entry: 'electron/preload.ts',
                onstart(args) {
                    args.reload();
                },
                vite: {
                    build: {
                        outDir: 'dist-electron'
                    }
                }
            }
        ]),
        renderer()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            external: ['electron']
        }
    },
    server: {
        port: 3000
    }
});
```

### Electron Builder Configuration

```json
// electron-builder.json (NEW FILE)
{
  "appId": "com.ebkr.r2modman",
  "productName": "r2modman",
  "directories": {
    "output": "release/${version}"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm", "tar.gz"],
    "category": "Game"
  },
  "mac": {
    "target": ["dmg"],
    "category": "public.app-category.games"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "build:win": "tsc && vite build && electron-builder --win",
    "build:linux": "tsc && vite build && electron-builder --linux",
    "build:mac": "tsc && vite build && electron-builder --mac",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}
```

### Dependencies Migration

#### Remove (Quasar/Vue specific)
```json
{
  "dependencies": {
    "@quasar/extras": "^1.17.0",  // REMOVE
    "quasar": "^2.18.1",          // REMOVE
    "vue": "^3.5.16",             // REMOVE
    "vue-router": "^4.5.1",       // REMOVE
    "vuex": "^4.1.0",             // REMOVE
    "floating-vue": "5.2.2",      // REMOVE
    "vue-i18n": "^11.1.6",        // REMOVE
    "bulma": "^0.9.4",            // REMOVE (optional - if switching to Tailwind)
    "bulma-*": "*"                // REMOVE all Bulma extensions
  },
  "devDependencies": {
    "@quasar/app-vite": "^2.2.1", // REMOVE
    "@vue/*": "*"                  // REMOVE all Vue devDependencies
  }
}
```

#### Add (React/Redux specific)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "@reduxjs/toolkit": "^2.2.1",
    "react-redux": "^9.1.0",
    "reselect": "^5.1.0",
    "@mui/material": "^5.15.10",
    "@mui/icons-material": "^5.15.10",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite-plugin-electron": "^0.28.3",
    "vite-plugin-electron-renderer": "^0.14.5",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.4.2",
    "electron": "^38.1.2",
    "electron-builder": "^24.13.3"
  }
}
```

#### Keep (Framework-agnostic)
```json
{
  "dependencies": {
    "@node-steam/vdf": "^2.1.0",
    "adm-zip": "^0.5.5",
    "ajv": "^8.17.1",
    "async-lock": "^1.2.6",
    "axios": "^0.24.0",
    "dexie": "^3.2.7",
    "electron-updater": "4.2.5",
    "fs-extra": "^8.1.0",
    "js-yaml": "^4.1.1",
    "moment": "^2.29.1",
    // ... all business logic dependencies
  }
}
```

---

## Routing Migration

### Vue Router → React Router

**Current (Vue Router)**:
```typescript
// src/router/routes.ts
import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        name: 'index',
        path: '/',
        component: () => import("pages/GameSelectionScreen.vue")
    },
    {
        name: 'profiles',
        path: '/profiles/',
        component: () => import('pages/Profiles.vue')
    },
    {
        path: '/manager/',
        component: () => import('pages/Manager.vue'),
        children: [
            {
                name: 'manager.installed',
                path: 'installed/',
                components: {
                    subview: () => import('components/views/InstalledModView.vue')
                }
            },
            {
                name: 'manager.online',
                path: 'online/',
                components: {
                    subview: () => import('components/views/OnlineModView.vue')
                }
            }
        ]
    }
];
```

**Target (React Router v6)**:
```tsx
// src/router/routes.tsx
import { createHashRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load components
const GameSelectionScreen = lazy(() => import('@/pages/GameSelectionScreen'));
const Profiles = lazy(() => import('@/pages/Profiles'));
const Manager = lazy(() => import('@/pages/Manager'));
const InstalledModView = lazy(() => import('@/components/views/InstalledModView'));
const OnlineModView = lazy(() => import('@/components/views/OnlineModView'));
const SettingsView = lazy(() => import('@/components/settings/SettingsView'));

// Loading fallback
const LoadingFallback = () => <div>Loading...</div>;

export const router = createHashRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <GameSelectionScreen />
            </Suspense>
        )
    },
    {
        path: '/profiles',
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <Profiles />
            </Suspense>
        )
    },
    {
        path: '/manager',
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <Manager />
            </Suspense>
        ),
        children: [
            {
                path: 'installed',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <InstalledModView />
                    </Suspense>
                )
            },
            {
                path: 'online',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <OnlineModView />
                    </Suspense>
                )
            },
            {
                path: 'settings',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <SettingsView />
                    </Suspense>
                )
            }
        ]
    }
]);
```

**App Integration**:
```tsx
// src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { router } from './router/routes';
import { store } from './store';

function App() {
    return (
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    );
}

export default App;
```

**Navigation**:
```tsx
// Vue: this.$router.push({ name: 'manager.installed' })
// React:
import { useNavigate } from 'react-router-dom';

function Component() {
    const navigate = useNavigate();
    
    const goToInstalled = () => {
        navigate('/manager/installed');
    };

    return <button onClick={goToInstalled}>Go to Installed</button>;
}
```

---

## Styling Migration

### Option 1: Keep Bulma + CSS Modules

**Advantage**: Minimal migration effort, familiar CSS

```tsx
// Component with CSS Modules
import styles from './ModCard.module.scss';

function ModCard() {
    return (
        <div className={`${styles.card} ${styles.modCard}`}>
            <h3 className={styles.title}>Mod Name</h3>
        </div>
    );
}
```

### Option 2: Migrate to Tailwind CSS (Recommended)

**Advantage**: Utility-first, smaller bundle, better DX

**Setup**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**:
```javascript
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'r2mm-primary': '#1976d2',
                'r2mm-secondary': '#dc004e',
            }
        },
    },
    plugins: [],
}
```

**Component with Tailwind**:
```tsx
function ModCard({ mod }) {
    return (
        <div className="p-4 border border-gray-300 rounded-lg hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-r2mm-primary">{mod.name}</h3>
            <p className="text-gray-600 mt-2">{mod.description}</p>
            <button className="mt-4 px-4 py-2 bg-r2mm-primary text-white rounded hover:bg-blue-600">
                Download
            </button>
        </div>
    );
}
```

### Style Migration Table

| Bulma Class | Tailwind Equivalent | MUI Component |
|-------------|---------------------|---------------|
| `.button` | `className="px-4 py-2 rounded bg-blue-500"` | `<Button>` |
| `.card` | `className="border rounded-lg p-4"` | `<Card>` |
| `.modal` | `className="fixed inset-0 bg-black/50"` | `<Dialog>` |
| `.notification` | `className="p-4 rounded bg-yellow-100"` | `<Alert>` |
| `.input` | `className="border rounded px-3 py-2"` | `<TextField>` |
| `.table` | `className="w-full border-collapse"` | `<Table>` |

---

## Testing Strategy

### Current Testing (Minimal)

```typescript
// test/vitest/tests/test-setup.ts
// Very minimal test setup exists
```

### Target Testing Setup

**Install Testing Dependencies**:
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

**Vitest Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './test/setup.ts',
        css: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
```

**Test Setup**:
```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});
```

**Example Component Test**:
```typescript
// src/components/__tests__/ModCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModCard } from '../ModCard';

describe('ModCard', () => {
    const mockMod = {
        name: 'Test Mod',
        description: 'Test Description',
        author: 'Test Author'
    };

    it('renders mod information', () => {
        render(<ModCard mod={mockMod} onDownload={vi.fn()} />);
        
        expect(screen.getByText('Test Mod')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('calls onDownload when button clicked', () => {
        const handleDownload = vi.fn();
        render(<ModCard mod={mockMod} onDownload={handleDownload} />);
        
        fireEvent.click(screen.getByText('Download'));
        expect(handleDownload).toHaveBeenCalledWith(mockMod);
    });
});
```

**Example Redux Test**:
```typescript
// src/store/slices/__tests__/profileSlice.test.ts
import { describe, it, expect } from 'vitest';
import reducer, { setSearchQuery, reset } from '../profileSlice';

describe('profileSlice', () => {
    it('should handle setSearchQuery', () => {
        const previousState = { searchQuery: '', modList: [] };
        const newState = reducer(previousState, setSearchQuery('test'));
        expect(newState.searchQuery).toBe('test');
    });

    it('should handle reset', () => {
        const previousState = { searchQuery: 'test', modList: [{...}] };
        const newState = reducer(previousState, reset());
        expect(newState.searchQuery).toBe('');
        expect(newState.modList).toEqual([]);
    });
});
```

---

## Migration Roadmap

### Week-by-Week Plan

#### Weeks 1-2: Setup & Foundation
- [ ] Create new React project structure alongside Vue
- [ ] Configure Vite for Electron
- [ ] Set up Redux Toolkit
- [ ] Configure Material-UI or shadcn/ui
- [ ] Set up Tailwind CSS
- [ ] Configure ESLint and Prettier for React
- [ ] Create basic App shell
- [ ] Set up React Router

**Deliverable**: Working React app skeleton with routing

#### Weeks 3-4: Core Models Migration
- [ ] Verify all TypeScript models work with React (should be 100% compatible)
- [ ] Test Dexie integration
- [ ] Test file system providers
- [ ] Test Thunderstore API integration
- [ ] Create custom hooks for common patterns

**Deliverable**: All business logic working in React context

#### Weeks 5-6: State Management
- [ ] Convert ProfileModule → profileSlice
- [ ] Convert ProfilesModule → profilesSlice
- [ ] Convert TsModsModule → tsModsSlice
- [ ] Convert DownloadModule → downloadSlice
- [ ] Convert ModFilterModule → modFilterSlice
- [ ] Create selectors for all getters
- [ ] Test state management with temporary UI

**Deliverable**: Complete Redux store with all slices

#### Weeks 7-8: Core Pages
- [ ] Convert GameSelectionScreen.vue → GameSelectionScreen.tsx
- [ ] Convert Profiles.vue → Profiles.tsx
- [ ] Convert Manager.vue → Manager.tsx (shell only)
- [ ] Test navigation flow

**Deliverable**: Basic navigation working

#### Weeks 9-12: Main Views
- [ ] Convert InstalledModView.vue → InstalledModView.tsx
- [ ] Convert OnlineModView.vue → OnlineModView.tsx
- [ ] Convert ModCard components
- [ ] Convert SearchAndSort components
- [ ] Implement virtual scrolling (react-window or react-virtuoso)

**Deliverable**: Core mod management features working

#### Weeks 13-14: Config Editor
- [ ] Convert ConfigEditor.vue → ConfigEditor.tsx
- [ ] Convert ConfigSelectionLayout
- [ ] Convert ConfigEditLayout
- [ ] Test config parsing and saving

**Deliverable**: Config editor functional

#### Weeks 15-16: Settings & Help
- [ ] Convert SettingsView.vue → SettingsView.tsx
- [ ] Convert Help.vue → Help.tsx
- [ ] Test all settings functionality

**Deliverable**: Settings and help pages working

#### Weeks 17-18: Modals & Utilities
- [ ] Convert all modal components (20+ files)
- [ ] Convert utility components
- [ ] Convert profile management modals
- [ ] Convert download progress modals

**Deliverable**: All modals functional

#### Weeks 19-20: Integration Testing
- [ ] Full feature testing
- [ ] Cross-platform testing (Windows, Linux, macOS)
- [ ] Performance testing
- [ ] Memory leak testing
- [ ] Fix critical bugs

**Deliverable**: Feature-complete React version

#### Weeks 21-22: Polish & Optimization
- [ ] Implement performance optimizations (memoization, lazy loading)
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add analytics/telemetry
- [ ] Update documentation

**Deliverable**: Production-ready React version

#### Weeks 23-24: Beta & Deployment
- [ ] Beta release to community
- [ ] Gather feedback
- [ ] Fix reported issues
- [ ] Create migration guide for users
- [ ] Final production deployment

**Deliverable**: Released React version

---

## Risk Assessment

### High-Risk Areas

#### 1. State Management Complexity
**Risk**: Redux state might not perfectly mirror Vuex behavior
**Mitigation**:
- Create comprehensive test suite for state management
- Maintain feature parity checklist
- Use Redux DevTools for debugging
- Consider using Redux-persist for persistence

#### 2. Build Pipeline Issues
**Risk**: Electron + Vite configuration might have edge cases
**Mitigation**:
- Use proven vite-plugin-electron
- Test builds frequently
- Maintain rollback to Quasar build
- Document build issues as they arise

#### 3. Performance Regression
**Risk**: React version might be slower than Vue version
**Mitigation**:
- Implement React.memo for expensive components
- Use virtual scrolling from the start
- Profile performance at each milestone
- Add performance budgets

#### 4. Styling Inconsistencies
**Risk**: New UI framework might look different
**Mitigation**:
- Take screenshots of all views before migration
- Maintain design system documentation
- Get user feedback early
- Consider keeping Bulma initially

#### 5. Breaking Changes for Users
**Risk**: User workflows might break
**Mitigation**:
- Maintain backward compatibility for data files
- Test profile import/export thoroughly
- Provide migration tool if needed
- Clear communication with community

### Medium-Risk Areas

- Component conversion errors (mitigated by TypeScript)
- Dependency updates breaking changes (pin versions)
- Cross-platform issues (test on all platforms early)
- Memory leaks (profile with React DevTools)

### Low-Risk Areas

- TypeScript business logic (framework-agnostic)
- Dexie database layer (no changes needed)
- Electron main process (minimal changes)
- File system operations (no changes)

---

## Appendix: Code Examples

### Complete Component Example

**Vue Component (Before)**:
```vue
<template>
    <div class="installed-mod-view">
        <div class="search-bar">
            <input 
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Search mods..."
            />
        </div>
        
        <div class="mod-list">
            <ModCard
                v-for="mod in visibleMods"
                :key="mod.name"
                :mod="mod"
                @download="handleDownload"
                @uninstall="handleUninstall"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import ModCard from './ModCard.vue';

const store = useStore();
const searchQuery = ref('');

const visibleMods = computed(() => {
    return store.getters['profile/visibleModList'];
});

function handleSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    store.commit('profile/setSearchQuery', value);
}

async function handleDownload(mod: ThunderstoreMod) {
    await store.dispatch('download/downloadAndInstallCombos', {
        combos: [mod],
        installMode: 'install'
    });
}

async function handleUninstall(mod: ManifestV2) {
    await store.dispatch('profile/uninstallMod', mod);
}
</script>

<style scoped>
.installed-mod-view {
    padding: 1rem;
}

.search-bar {
    margin-bottom: 1rem;
}

.mod-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}
</style>
```

**React Component (After)**:
```tsx
// src/pages/InstalledModView.tsx
import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setSearchQuery } from '@/store/slices/profileSlice';
import { selectVisibleModList } from '@/store/selectors/profileSelectors';
import { downloadAndInstallCombos } from '@/store/slices/downloadSlice';
import { uninstallMod } from '@/store/slices/profileSlice';
import { ModCard } from '@/components/ModCard';
import { TextField } from '@mui/material';
import { ThunderstoreMod } from '@/model/ThunderstoreMod';
import { ManifestV2 } from '@/model/ManifestV2';
import styles from './InstalledModView.module.css';

export const InstalledModView: React.FC = () => {
    const dispatch = useAppDispatch();
    const visibleMods = useAppSelector(selectVisibleModList);
    const [searchQuery, setLocalSearchQuery] = useState('');

    const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalSearchQuery(value);
        dispatch(setSearchQuery(value));
    }, [dispatch]);

    const handleDownload = useCallback(async (mod: ThunderstoreMod) => {
        await dispatch(downloadAndInstallCombos({
            combos: [mod],
            installMode: 'install'
        }));
    }, [dispatch]);

    const handleUninstall = useCallback(async (mod: ManifestV2) => {
        await dispatch(uninstallMod(mod));
    }, [dispatch]);

    return (
        <div className={styles.installedModView}>
            <div className={styles.searchBar}>
                <TextField
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search mods..."
                    fullWidth
                    variant="outlined"
                />
            </div>
            
            <div className={styles.modList}>
                {visibleMods.map(mod => (
                    <ModCard
                        key={mod.name}
                        mod={mod}
                        onDownload={handleDownload}
                        onUninstall={handleUninstall}
                    />
                ))}
            </div>
        </div>
    );
};

export default InstalledModView;
```

```css
/* src/pages/InstalledModView.module.css */
.installedModView {
    padding: 1rem;
}

.searchBar {
    margin-bottom: 1rem;
}

.modList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}
```

---

## Conclusion

This migration from Vue 3 + Quasar to React + Vite + Electron is a **significant undertaking** requiring approximately **24 weeks** of focused development effort. The migration maintains all existing functionality while providing benefits in terms of ecosystem, developer availability, and potentially performance.

### Critical Success Factors

1. ✅ **Maintain Feature Parity**: No features lost
2. ✅ **Data Compatibility**: Profiles and settings remain compatible
3. ✅ **Performance**: Equal or better performance
4. ✅ **User Experience**: Familiar interface
5. ✅ **Code Quality**: Better TypeScript integration

### Recommended Approach

1. **Phase migration** over feature migration
2. **Parallel development** (Vue version continues)
3. **Extensive testing** at each milestone
4. **Community feedback** via beta releases
5. **Clear communication** about migration timeline

### Go/No-Go Decision Factors

**Proceed if:**
- Team has React expertise
- 6-month timeline is acceptable
- Budget allows for complete rewrite
- Long-term maintainability is priority

**Reconsider if:**
- Current Vue version works well
- Team lacks React experience
- Timeline is tight
- Risk tolerance is low

This guide provides a complete blueprint for the migration, but the decision to proceed should be based on organizational priorities, resources, and long-term vision for the project.
