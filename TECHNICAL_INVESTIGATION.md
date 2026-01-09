# r2modman Technical Investigation & User Stories

## Table of Contents
- [Executive Summary](#executive-summary)
- [Technical Architecture Deep Dive](#technical-architecture-deep-dive)
- [User Stories](#user-stories)
- [Data Flow Analysis](#data-flow-analysis)
- [State Management Investigation](#state-management-investigation)
- [API Integration Analysis](#api-integration-analysis)
- [Installation System Investigation](#installation-system-investigation)
- [Performance Characteristics](#performance-characteristics)
- [Security Analysis](#security-analysis)
- [Testing & Quality Assurance](#testing--quality-assurance)

---

## Executive Summary

This document provides a comprehensive technical investigation of r2modman, covering:
- **Architecture**: Electron + Vue 3 + Quasar with Vuex state management
- **Scale**: 281 TypeScript/Vue files, 221+ supported games, 10+ mod loaders
- **User Base**: Non-technical to power users across Windows/Linux/macOS
- **Core Competency**: Automated mod dependency resolution and safe profile management

### Key Technical Findings

1. **State Management**: 9 Vuex modules managing distinct concerns (Profile, Download, Mods, etc.)
2. **Storage Strategy**: Hybrid approach using IndexedDB (Dexie) for metadata and filesystem for mod files
3. **Installation System**: Rule-based with conflict tracking using state machine pattern
4. **API Integration**: Thunderstore API with local caching and CDN fallback
5. **Cross-Platform**: Platform-specific implementations for Steam/EGS/Xbox across OS types

---

## Technical Architecture Deep Dive

### Application Structure

```
r2modmanPlus/
├── src/
│   ├── pages/           # 9 Vue pages (Splash, GameSelection, Manager, etc.)
│   ├── components/      # Reusable Vue components
│   │   ├── modals/      # Modal dialogs (Profile, Sort, Category, etc.)
│   │   ├── views/       # Major views (InstalledMods, OnlineMods, Config)
│   │   └── settings-components/
│   ├── store/           # Vuex state management
│   │   └── modules/     # 9 modules (Profile, Download, TsMods, etc.)
│   ├── model/           # Data models and business logic
│   │   ├── game/        # Game & platform metadata
│   │   ├── errors/      # Custom error types
│   │   └── schema/      # Thunderstore schema validation
│   ├── r2mm/            # Core application logic
│   │   ├── installing/  # Installation system
│   │   ├── launching/   # Game launch logic
│   │   ├── manager/     # Settings & configuration
│   │   └── mods/        # Mod list management
│   ├── providers/       # Platform abstraction layer
│   │   ├── generic/     # Cross-platform providers
│   │   ├── node/        # Node.js API wrappers
│   │   └── ror2/        # Legacy Risk of Rain 2 specific
│   ├── installers/      # 15 mod loader installers
│   ├── depots/          # Game-specific configuration
│   └── assets/          # Static assets & ecosystem data
└── src-electron/        # Electron main process
```

### Technology Stack Analysis

#### Frontend Layer
- **Vue 3.5.16** (Composition API):
  - Reactive state management
  - Component composition
  - Lifecycle hooks for resource management
- **Quasar 2.18.1**:
  - UI component library
  - Cross-platform theming
  - Responsive layout system
- **Vue Router 4.5.1**:
  - Client-side routing
  - Nested routes for manager subviews
  - Route guards for profile validation

#### State Management Layer
- **Vuex 4.1.0**:
  - 9 specialized modules
  - Actions for async operations
  - Mutations for synchronous state changes
  - Getters for computed state
  
**Module Breakdown**:
1. `ProfileModule` (19KB): Active profile state, mod list, sorting
2. `ProfilesModule` (4.7KB): All profiles management
3. `TsModsModule` (19KB): Thunderstore mod catalog
4. `DownloadModule` (14KB): Download queue and progress
5. `ModFilterModule` (3.3KB): Filtering and search state
6. `ModalsModule` (6.4KB): Modal dialog state
7. `ProfileExportModule` (2.2KB): Export/import state
8. `ErrorModule` (1.1KB): Global error handling
9. `SplashModule` (7.1KB): Initial loading state

#### Data Persistence Layer
- **Dexie 3.2.7** (IndexedDB wrapper):
  - `PackageDexieStore`: Cached mod metadata
  - `SettingsDexieStore`: User preferences and settings
  - Versioned schema with migrations
- **File System**:
  - Profile directories: `<DATA_ROOT>/<GAME>/profiles/<PROFILE_NAME>/`
  - Mod files: `BepInEx/`, `MelonLoader/`, etc.
  - Config files: Per-mod configuration

#### Backend Layer
- **Electron 38.1.2**:
  - Main process handles file operations
  - IPC for renderer ↔ main communication
  - Native module integration
- **Node.js 20.19.0**:
  - File system operations (fs-extra)
  - Archive handling (adm-zip, unzipper, tar)
  - HTTP requests (axios)

### Navigation Flow

```
Splash → Game Selection → Profiles → Manager
                                       ├── Installed Mods
                                       ├── Online Mods
                                       └── Settings
                          
                          Config Editor (parallel view)
                          Help (parallel view)
                          Downloads (parallel view)
```

**Route Structure**:
- `/` - Game Selection
- `/splash/` - Loading screen
- `/profiles/` - Profile selection
- `/manager/` - Main application
  - `/manager/installed/` - Installed mods view
  - `/manager/online/` - Browse online mods
  - `/manager/settings/` - Settings panel
- `/config-editor/` - Configuration editor
- `/help/` - Help documentation
- `/downloads/` - Download monitor

---

## User Stories

### Epic 1: First-Time User Onboarding

#### US-001: Discover and Install r2modman
**As a** gamer who wants to mod my game  
**I want to** download and install r2modman  
**So that** I can easily manage mods without technical knowledge

**Acceptance Criteria**:
- User can find r2modman on Thunderstore or GitHub
- Installer works on Windows without admin rights (optional)
- Linux users can choose between AppImage, deb, rpm, pacman, tar.gz
- macOS users can download and run the app
- First launch doesn't require configuration

**Technical Implementation**:
- electron-builder creates installers for all platforms
- Auto-update configured via electron-updater
- No dependencies required beyond OS basics

---

#### US-002: Select My Game
**As a** first-time user  
**I want to** see a list of all supported games  
**So that** I can quickly find and select my game

**Acceptance Criteria**:
- Game selection screen shows all 221+ supported games
- Games display with icons and names
- Search functionality to filter games
- Selected game is remembered for next launch
- Clear indication if game is not installed

**Technical Implementation**:
- `GameSelectionScreen.vue` component
- Game list loaded from `ecosystem.json` (221 games)
- `GameManager.activate()` sets active game
- Steam library auto-detection for installed games
- Settings stored in `ManagerSettings`

**State Flow**:
```typescript
// GameSelectionScreen.vue
GameManager.gameList → filter by search → display cards
User clicks game → GameManager.activate(game, platform)
→ PathResolver.MOD_ROOT set
→ Navigate to /profiles/
```

---

#### US-003: Create My First Profile
**As a** first-time user  
**I want to** create or use the default profile  
**So that** I can start installing mods safely

**Acceptance Criteria**:
- Default profile exists automatically
- Profile creation is simple (name input)
- Profile names are validated (no special chars)
- Cannot delete Default profile
- Profile selection remembered

**Technical Implementation**:
- `ProfilesModule` Vuex state
- Default profile created on first run
- `Profile.create(name)` validates and creates directory
- Profile metadata stored in IndexedDB
- File structure: `<MOD_ROOT>/profiles/<NAME>/`

**State Flow**:
```typescript
// Splash.vue → ProfilesModule
loadLastSelectedProfile() → Default if none
User creates new → ProfilesModule.createProfile(name)
→ Profile directory created
→ Navigate to /manager/installed/
```

---

### Epic 2: Mod Discovery & Installation

#### US-004: Browse Available Mods
**As a** user  
**I want to** browse all available mods for my game  
**So that** I can discover new content

**Acceptance Criteria**:
- Online tab shows all mods from Thunderstore
- Mods display with icon, name, author, rating, downloads
- Can view mod description, changelog, dependencies
- Categories shown for filtering
- Download count and rating visible

**Technical Implementation**:
- `OnlineModView.vue` component
- `TsModsModule` fetches from Thunderstore API
- Package listing index: `<THUNDERSTORE_URL>/api/v1/package-listing-index/`
- Chunked loading for performance
- Cached in IndexedDB via `PackageDexieStore`

**API Flow**:
```typescript
// TsModsModule.ts
fetchThunderstoreModList()
→ GET package-listing-index (list of full_names)
→ For each chunk: GET package metadata
→ Parse to ThunderstoreMod objects
→ Store in IndexedDB
→ Update state.mods
→ Components reactively update
```

---

#### US-005: Search and Filter Mods
**As a** user  
**I want to** search and filter mods by name, author, or category  
**So that** I can find specific mods quickly

**Acceptance Criteria**:
- Search box filters mods in real-time
- Can filter by multiple categories
- Can sort by: name, date, downloads, rating
- Filters persist during session
- Can toggle deprecated mods

**Technical Implementation**:
- `SearchUtils.ts` for fuzzy matching
- `ModFilterModule` stores filter state
- `SortModal.vue` for sort options
- `CategoryFilterModal.vue` for category selection

**State Flow**:
```typescript
// ModFilterModule
state.searchQuery → filters mods array
state.selectedCategories → AND filter
state.sortBy → ModListSort.sortThunderstoreModList()
→ Computed visibleModList in ProfileModule
```

---

#### US-006: Install a Mod with One Click
**As a** user  
**I want to** install a mod by clicking a download button  
**So that** I don't have to manually handle files

**Acceptance Criteria**:
- Single click starts download and installation
- Dependencies are automatically resolved and installed
- Progress bar shows download status
- Installation happens in background
- Conflicts are automatically handled
- User is notified on completion or error

**Technical Implementation**:
- `DownloadModule.downloadAndInstallCombos()`
- Dependency resolution via `DependencyUtils`
- Download from CDN with progress callbacks
- Installation via `ProfileInstallerProvider`
- Conflict resolution via `ConflictManagementProvider`

**Detailed Flow**:
```typescript
// User clicks download on mod
1. DownloadModule._addDownload()
   → Resolve dependencies (recursive)
   → Create download object with UUID
   → Add to download queue

2. DownloadModule._download()
   → For each mod:
     → GET mod ZIP from CDN
     → Save to temp directory
     → Update progress (downloadedSize)
     → Extract ZIP

3. DownloadModule._installModsAndResolveConflicts()
   → For each mod:
     → Determine installer (BepInEx, MelonLoader, etc.)
     → Apply installation rules
     → Track file ownership (conflict state)
     → Copy files to profile directory
   → Update profile mod list
   → Refresh UI

4. Completion
   → Remove from download queue
   → Notify user
   → Reload mod list from disk
```

**Installation Rules Example** (BepInEx):
```json
{
  "route": "BepInEx/plugins",
  "defaultFileExtensions": [".dll"],
  "trackingMethod": "subdir",
  "isDefaultLocation": true
}
```

---

### Epic 3: Profile Management

#### US-012: Create Multiple Profiles
**As a** power user  
**I want to** create multiple profiles  
**So that** I can have different mod setups

**Acceptance Criteria**:
- Can create unlimited profiles
- Each profile has unique name
- Profiles are isolated (separate mod lists)
- Can rename profiles (except Default)
- Profile creation is instant
- No mod limit per profile

**Technical Implementation**:
- `CreateProfileModal.vue` for UI
- `ProfilesModule.createProfile(name)`
- Creates directory: `<MOD_ROOT>/profiles/<NAME>/`
- Profile metadata in IndexedDB
- Each profile has own `mods.yml`

---

#### US-013: Switch Between Profiles
**As a** user  
**I want to** switch between profiles easily  
**So that** I can use different mod setups for different playstyles

**Acceptance Criteria**:
- Profile dropdown in navigation
- One-click profile switching
- Current profile clearly indicated
- Mod list updates immediately
- Settings are profile-specific (game directory, launch params)
- Switching doesn't require app restart

**Technical Implementation**:
- `ProfilesModule.setSelectedProfile(name)`
- Clears current mod list cache
- Loads new profile from disk
- Updates active profile in state
- Re-renders all components

**State Flow**:
```typescript
// User selects profile
ProfilesModule.setSelectedProfile(profileName)
→ ProfileModule.setActiveProfile(newProfile)
→ ProfileModule.tryLoadModListFromDisk()
→ Load settings for new profile
→ Update UI (mods, configs, etc.)
```

---

#### US-014: Export Profile
**As a** user  
**I want to** export my profile to share with friends  
**So that** they can use the same mod setup

**Acceptance Criteria**:
- Can export as code (short string) or file (.r2x)
- Export includes mod list with versions
- Can optionally include config files
- Code is copied to clipboard
- File can be saved anywhere
- Export works even with 100+ mods

**Technical Implementation**:
- `ProfileImportExport.exportProfile(profile, includeConfig)`
- Two formats:
  - **Code**: Base64-encoded JSON uploaded to API
  - **File**: ZIP containing mod list + configs
- `ProfileCodeExportModal.vue` displays code

**Export Flow**:
```typescript
// Code Export
1. Collect mod list (name, version, enabled state)
2. Optionally collect config files
3. JSON.stringify() data
4. POST to Thunderstore profile API
5. Receive short code (e.g., "018e-f25a")
6. Copy to clipboard
7. Show success modal

// File Export
1. Same as above but don't POST
2. Create .r2x file (renamed .zip)
3. Add mods.yml + configs
4. Save file dialog
```

---

#### US-015: Import Profile
**As a** user  
**I want to** import profiles from code, file, or URL  
**So that** I can use community mod packs

**Acceptance Criteria**:
- Accepts code, file (.r2x/.r2z), or URL
- Shows preview of mods before importing
- Downloads missing mods automatically
- Handles unavailable mods gracefully
- Can merge with existing profile or create new
- Shows progress during import

**Technical Implementation**:
- `ImportProfileModal.vue` with 3 tabs
- `ProfileImportExport.importProfile()`
- Fetches profile data from source
- Resolves mods from Thunderstore
- Downloads and installs each mod
- Handles errors (mod removed, version unavailable)

**Import Flow**:
```typescript
// Code Import
1. User enters code (e.g., "018e-f25a")
2. GET https://thunderstore.io/api/experimental/legacyprofile/get/<code>
3. Parse JSON (mod list)
4. Resolve each mod from Thunderstore
5. Download and install (same as US-006)
6. Apply configs if included
7. Reload profile
```

---

### Epic 4: Game Launch

#### US-019: Launch Game with Mods
**As a** user  
**I want to** launch my game with mods enabled  
**So that** I can play with my mod setup

**Acceptance Criteria**:
- "Start modded" button prominent in UI
- Game launches with all enabled mods
- Mod loader is injected automatically
- Works across Steam/EGS/Xbox Game Pass
- Shows launch parameters used
- Detects if game is already running

**Technical Implementation**:
- Platform-specific runners:
  - `SteamGameRunner_Windows.ts`
  - `SteamGameRunner_Linux.ts`
  - `SteamGameRunner_Darwin.ts`
  - `EgsGameRunner.ts`
  - `XboxGamePassGameRunner.ts`
  - `DirectGameRunner.ts`
- Game-specific instructions:
  - `BepInExGameInstructions.ts`
  - `MelonLoaderGameInstructions.ts`
  - `NorthstarGameInstructions.ts`

**Launch Flow (BepInEx + Steam + Windows)**:
```typescript
// GameRunnerProvider.getGameRunner()
1. Detect platform (Steam, EGS, etc.)
2. Get game-specific instructions
3. Build launch command:
   - Steam: steam://rungameid/<APPID>//<ARGS>
   - Doorstop args for BepInEx
4. Execute command via shell
5. Monitor process
6. Show "game running" modal
7. Detect when game closes
```

**BepInEx Launch Args**:
```
--doorstop-enabled true 
--doorstop-target "BepInEx\core\BepInEx.Preloader.dll"
```

---

## Data Flow Analysis

### Mod Installation Data Flow

```
User Action → Vuex Action → Provider → Installer → Filesystem → State Update
```

**Detailed Flow**:
```typescript
1. User clicks "Download" in OnlineModView
   ↓
2. DownloadModule.downloadAndInstallCombos({combos, installMode})
   ↓
3. Resolve Dependencies
   - DependencyUtils.buildDependencySet(initialMod)
   - Recursive traversal of dependencies
   - Returns Set<ThunderstoreCombo>
   ↓
4. Create Download Object
   - DownloadModule._addDownload()
   - UUID generated
   - Status: "Pending"
   ↓
5. Download Phase
   - DownloadModule._download()
   - For each combo:
     - GET <CDN_URL>/api/experimental/package/<full_name>/<version>/
     - Save to temp: <DATA_ROOT>/cache/<filename>.zip
     - Progress callback updates state
   ↓
6. Installation Phase
   - DownloadModule._installModsAndResolveConflicts()
   - For each combo:
     - Extract ZIP to temp directory
     - Read manifest.json
     - Determine installer (based on packageLoader)
     - Apply installation rules
     - Copy files to profile directory
     - Update conflict state
   ↓
7. State Update
   - ProfileModule.tryLoadModListFromDisk()
   - Scan profile directory
   - Parse each mod's manifest
   - Update state.modList
   ↓
8. UI Update
   - InstalledModView reactively re-renders
   - New mod appears in list
```

### Profile Switching Data Flow

```
User Selects Profile → Clear Current State → Load New Profile → Render UI
```

**Detailed Flow**:
```typescript
1. User selects profile in Profiles.vue
   ↓
2. ProfilesModule.setSelectedProfile({profileName, prewarmCache})
   ↓
3. ProfileModule.setActiveProfile(profile)
   - state.activeProfile = new Profile(name)
   - state.modList = []
   ↓
4. ProfileModule.tryLoadModListFromDisk()
   - ProfileModList.getModList(profile)
   - Scan <PROFILE_DIR>/BepInEx/plugins/, etc.
   - Read manifest.json for each mod
   - Parse to ManifestV2 objects
   ↓
5. Load Settings
   - ManagerSettings.load(profile)
   - Game directory, launch params, etc.
   ↓
6. Cache Warming (if prewarmCache)
   - TsModsModule.loadThunderstoreModList()
   - Fetch from IndexedDB
   - Populate state.mods
   ↓
7. UI Updates
   - InstalledModView re-renders with new mod list
   - Settings update with new values
   - Navigation shows active profile name
```

---

## State Management Investigation

### Vuex Store Structure

```typescript
// src/store/index.ts
const store = createStore({
  modules: {
    profile: ProfileModule,       // Active profile & mod list
    profiles: ProfilesModule,      // All profiles
    tsMods: TsModsModule,         // Thunderstore catalog
    download: DownloadModule,      // Download queue
    modFilter: ModFilterModule,    // Search & filter state
    modals: ModalsModule,          // Modal visibility state
    profileExport: ProfileExportModule, // Export state
    error: ErrorModule,            // Global error handling
    splash: SplashModule,          // Loading state
  },
  state: {
    activeGame: Game,
    settings: ManagerSettings,
    // ... global state
  }
});
```

### State Persistence Strategy

| Data Type | Storage | Persistence | Access Pattern |
|-----------|---------|-------------|----------------|
| Mod metadata | IndexedDB (Dexie) | Long-term cache | Bulk read on load |
| Settings | IndexedDB (Dexie) | Permanent | Read on init, write on change |
| Active profile state | Vuex (memory) | Session only | Reactive, frequent access |
| Installed mod files | Filesystem | Permanent | Direct file operations |
| Config files | Filesystem | Permanent | On-demand read/write |
| Download queue | Vuex (memory) | Session only | Real-time updates |

---

## API Integration Analysis

### Thunderstore API

**Base URL**: `https://thunderstore.io/`

**Endpoints Used**:
1. **Package Listing Index**: `/c/<game>/api/v1/package-listing-index/`
   - Returns: `{content: string[]}` - Array of `full_name` strings
   - Chunked for performance (first 5000, then 1000 at a time)
   
2. **Package Listing**: `/c/<game>/api/v1/package-listing/`
   - Returns: Array of package metadata objects
   - Includes: versions, dependencies, categories, ratings, downloads
   
3. **Package Download**: `/api/experimental/package/<full_name>/<version>/`
   - Returns: ZIP file (binary)
   - CDN-backed for performance

4. **Legacy Profile**: `/api/experimental/legacyprofile/get/<code>/`
   - Returns: Profile data (mod list)
   - Used for profile import by code

**Caching Strategy**:
- Index fetched and stored in IndexedDB
- Hash comparison to detect updates
- Metadata chunked and stored per package
- TTL: No expiration (manual refresh only)

---

## Installation System Investigation

### Installer Registry

**15 Installer Types**:

| Installer | Games | Method | Complexity |
|-----------|-------|--------|------------|
| BepInExInstaller | Unity games | Plugin system | Medium |
| MelonLoaderInstaller | Unity games | IL2CPP injection | High |
| NorthstarInstaller | Titanfall 2 | Native DLL | High |
| GDWeaveInstaller | Godot games | Script injection | Medium |
| LovelyInstaller | Balatro, etc. | Lua injection | Low |
| ShimloaderInstaller | Various | Shimming | Medium |
| RivetInstaller | Ratchet & Clank | Custom | Medium |
| GodotMLInstaller | Godot games | Mod loader | Medium |
| UMMInstaller | Unity games | Unity Mod Manager | Medium |
| DirectCopyInstaller | Simple games | File copy | Low |
| BepisLoaderInstaller | Older Unity | Plugin | Low |
| ReturnOfModdingInstaller | Specific games | Custom | High |
| RecursiveMelonLoaderInstaller | Complex setups | Recursive | High |
| InstallRuleInstaller | Most games | Rule-based | Medium |
| PackageInstaller | Base class | Abstract | N/A |

---

## Performance Characteristics

### Bottlenecks Identified

1. **Mod List Loading** (large profiles):
   - 100+ mods: ~2-3 seconds
   - Filesystem scan is synchronous
   - Parsing manifest.json for each mod
   - **Mitigation**: Cache in Vuex, lazy load

2. **Thunderstore Refresh** (initial):
   - Full fetch: ~30-60 seconds for 221 games
   - Chunked requests (5000, then 1000)
   - IndexedDB writes are async
   - **Mitigation**: Background fetch, progress indicator

3. **Config Editor** (large configs):
   - 100+ entries: UI lag on render
   - No virtualization
   - Every input is reactive
   - **Mitigation**: "Show more" to limit visible entries

4. **Search** (large catalogs):
   - 1000+ mods: ~500ms search time
   - Fuzzy matching is expensive
   - No debouncing
   - **Mitigation**: SearchUtils optimization needed

---

## Security Analysis

### Input Validation

**User Inputs Validated**:
- Profile names: No special chars, max length
- Config values: Type checking, min/max bounds
- File paths: Sanitized with `sanitize-filename`
- ZIP contents: Validated structure before extraction

**Not Validated**:
- Launch parameters: Passed directly to shell
- Custom CDN URLs: No HTTPS enforcement
- Imported profile data: Trusts Thunderstore API

---

## Testing & Quality Assurance

### Test Coverage

**Unit Tests**: Minimal (vitest setup exists, few tests)

**Integration Tests**: None

**E2E Tests**: None

**Manual Testing**: Primary QA method

### Known Test Gaps

1. Installation system not covered
2. Profile switching edge cases
3. Config parsing for all formats
4. Cross-platform compatibility
5. Error recovery scenarios

---

## Conclusion

r2modman is a **mature, feature-rich application** with a solid technical foundation. Key strengths include:

- **Robust state management** via Vuex with clear separation of concerns
- **Flexible installation system** supporting 10+ mod loaders with rule-based routing
- **Comprehensive profile system** enabling safe experimentation and easy sharing
- **Cross-platform support** with platform-specific implementations where needed

Key areas for improvement:

- **Performance optimization** for large mod counts (virtualization, lazy loading)
- **Test coverage** to prevent regressions and improve confidence
- **Error handling** to provide clearer guidance to users
- **Security hardening** around file validation and network requests

This investigation provides a complete technical understanding for developers, contributors, and power users to navigate and extend the r2modman codebase.
