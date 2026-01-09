# r2modman Features Documentation

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Game Support](#game-support)
- [Mod Management](#mod-management)
- [Profile System](#profile-system)
- [Configuration Management](#configuration-management)
- [Launch Options](#launch-options)
- [Settings & Customization](#settings--customization)
- [Platform Support](#platform-support)
- [UX Implications](#ux-implications)
- [Known Pain Points & Limitations](#known-pain-points--limitations)
- [Technical Architecture](#technical-architecture)

---

## Overview

r2modman is a cross-platform mod manager built with Electron, Vue 3, and Quasar. It provides a user-friendly interface for managing mods across 221+ games that use Thunderstore as their mod distribution platform.

**Technology Stack:**
- Framework: Electron + Vue 3 + Quasar
- State Management: Vuex
- Database: Dexie (IndexedDB wrapper)
- Language: TypeScript
- Build Tool: Vite

---

## Core Features

### 1. **Mod Discovery & Installation**
- **Browse Online Mods**: Access to Thunderstore's entire mod catalog for each supported game
- **Direct Downloads**: Download and install mods with a single click
- **Automatic Dependency Resolution**: Automatically downloads and installs all required dependencies
- **Version Selection**: Choose specific mod versions (with warnings for outdated versions)
- **Mod Search**: Full-text search across mod names, authors, and descriptions
- **Category Filtering**: Filter mods by categories (e.g., Items, Weapons, UI, etc.)
- **Sorting Options**: Sort by name, last updated, downloads, rating, date created
- **Deprecated Mod Filtering**: Option to show/hide deprecated mods

**UX Implications:**
- **Positive**: Simplifies modding for non-technical users by automating dependency management
- **Positive**: Search and filter reduce cognitive load when browsing large mod catalogs
- **Challenge**: Users may accidentally install incompatible mod versions if they ignore warnings

### 2. **Mod Updates**
- **Update Detection**: Automatically detects when installed mods have newer versions available
- **Bulk Updates**: "Update all" functionality to update multiple mods at once
- **Version Pinning**: Users can choose to stay on specific versions
- **Update Preview**: Shows what will be updated before committing

**UX Implications:**
- **Positive**: Keeps mods current with minimal user effort
- **Challenge**: Bulk updates may introduce breaking changes or incompatibilities
- **Pain Point**: No rollback mechanism if an update breaks the mod setup

### 3. **Local Mod Import**
- **Manual Installation**: Import locally developed or downloaded mods
- **Drag & Drop Support**: (Implementation varies by platform)
- **Validation**: Checks mod package structure for validity

**UX Implications:**
- **Positive**: Supports mod development workflow
- **Challenge**: Manual imports bypass dependency checking, potentially causing issues

---

## Game Support

### Supported Games
- **221+ Games** across multiple platforms including:
  - Risk of Rain 2
  - Valheim
  - Lethal Company
  - GTFO
  - Dyson Sphere Program
  - Boneworks
  - Content Warning
  - And many more...

### Platform Support Per Game
Games can be supported on multiple store platforms:
- **Steam**: Primary platform, best support
- **Epic Games Store (EGS)**: Secondary support
- **Xbox Game Pass**: Limited support on Windows
- **Direct/Standalone**: Games without store platform dependency

### Mod Loader Support
Different games use different mod loading frameworks:
- **BepInEx**: Most common (Unity games)
- **MelonLoader**: Alternative Unity loader
- **Northstar**: Titanfall 2 specific
- **GDWeave**: Godot engine games
- **Lovely**: Specific games (e.g., Balatro)
- **Shimloader**: Specific games
- **Rivet**: Specific games
- **GodotML**: Godot Mod Loader
- **UMM**: Unity Mod Manager
- **Return of Modding**: Game-specific
- **Direct Copy**: Simple file replacement

**UX Implications:**
- **Positive**: Broad game support means users can manage multiple games in one tool
- **Challenge**: Each game/loader combination has unique quirks and installation rules
- **Pain Point**: Support quality varies significantly between games

---

## Mod Management

### Installed Mods View
- **Visual Cards**: Each mod displayed as a card with icon, name, version, and actions
- **Enable/Disable Toggle**: Quickly enable or disable mods without uninstalling
- **Dependency Visualization**: Shows which mods depend on others
- **Dependency String Export**: Generate dependency lists for sharing
- **Mod Details Panel**: 
  - Description
  - Changelog
  - Dependencies
  - Statistics (downloads, ratings)
  - Author information
  - Links to mod page

### Mod Actions
- **Uninstall**: Remove mod completely
- **Enable/Disable**: Toggle mod without removing files
- **Update**: Install newer version
- **View Config**: Quick access to configuration files
- **View on Thunderstore**: Open mod page in browser

### Conflict Management
- **File Conflict Detection**: Identifies when mods try to modify the same files
- **Conflict Resolution**: Tracks which mod "owns" each file
- **Overwrite Behavior**: Last installed mod wins in file conflicts

**UX Implications:**
- **Positive**: Visual cards make it easy to scan installed mods
- **Positive**: Enable/disable is faster than uninstall/reinstall for testing
- **Challenge**: Dependency chains can be complex and hard to visualize
- **Pain Point**: No built-in conflict resolution UI - users must manually resolve
- **Pain Point**: Disabling a mod doesn't disable its dependencies (by design for shared dependencies)

---

## Profile System

### Profile Management
- **Multiple Profiles**: Create unlimited mod profiles per game
- **Quick Switching**: Switch between profiles without restarting the manager
- **Profile Operations**:
  - Create new profile
  - Rename profile (except Default)
  - Delete profile (except Default)
  - Duplicate profile
  - Import profile
  - Export profile

### Profile Export/Import
- **Code-based Export**: Generate a shareable code for the entire profile
- **File-based Export**: Export as `.r2x` or `.r2z` file
- **Import Sources**:
  - Import from code
  - Import from file
  - Import from URL (Thunderstore profile links)
- **Export Contents**:
  - Mod list with versions
  - Configuration files (optional)
  - Enabled/disabled state

### Profile Isolation
- Each profile maintains its own:
  - Mod installations
  - Configurations
  - Enable/disable states
  - Settings (game directory, launch parameters)

**UX Implications:**
- **Positive**: Profiles enable easy experimentation without risk
- **Positive**: Sharing profiles via codes is frictionless
- **Positive**: Great for content creators and mod pack distributors
- **Challenge**: Profile switching doesn't warn about incompatible mod combinations
- **Pain Point**: Profiles can grow large, making switching slower
- **Pain Point**: No profile comparison tool to see differences
- **Pain Point**: Exported profiles may fail to import if mods are removed from Thunderstore

---

## Configuration Management

### Config Editor
- **Integrated Editor**: Edit mod configuration files directly in the manager
- **File Browser**: Navigate through all config files by mod
- **Syntax Support**:
  - YAML parsing and validation
  - INI-style configs
  - JSON configs
  - Plain text
- **Field Types**:
  - Text inputs
  - Numeric inputs with validation
  - Checkboxes for booleans
  - Dropdowns for enums
  - Multi-select for arrays
  - Sliders for ranges

### Config Features
- **Search Configs**: Find specific settings across all config files
- **Reset to Default**: Restore original configuration
- **Syntax Highlighting**: Code editor with syntax highlighting
- **Validation**: Real-time validation for structured formats
- **"Show More" Expansion**: Collapse long config sections to reduce clutter

**UX Implications:**
- **Positive**: No need to hunt for config files in file system
- **Positive**: Validation prevents syntax errors
- **Positive**: Structured UI for common config types is more accessible than raw text
- **Challenge**: Complex configs can be overwhelming even with UI
- **Pain Point**: Large configs (100+ entries) can cause UI lag when loading
- **Pain Point**: No config diffing to see what changed from defaults
- **Pain Point**: Config changes require game/mod restart to take effect (not manager's fault)

---

## Launch Options

### Launch Modes
- **Start Modded**: Launch game with all enabled mods
- **Start Vanilla**: Launch game without mods (Steam/platform default)
- **Custom Parameters**: Add custom launch arguments

### Launch Configuration
- **Platform-Specific Handling**:
  - Windows: Direct Steam protocol or executable
  - Linux: Proton detection and configuration
  - macOS: Steam protocol with compatibility layers
- **Launch Type Selection**:
  - Steam (default for Steam games)
  - Epic Games Store
  - Xbox Game Pass
  - Direct executable

### Linux-Specific Features
- **Proton vs Native Detection**: Automatically detects or allows manual selection
- **Force Proton**: `.forceproton` file support for troubleshooting
- **Wrapper Script Generation**: Creates launch wrapper scripts for compatibility
- **Launch Type Modal**: Guided setup for first-time Linux users

**UX Implications:**
- **Positive**: "Start Modded" is prominent and obvious
- **Positive**: Vanilla launch ensures users can always play unmodded
- **Challenge**: Linux users face additional complexity with Proton/Native choice
- **Pain Point**: Launch failures often require platform-specific troubleshooting
- **Pain Point**: Custom parameters are advanced and poorly documented in-app

---

## Settings & Customization

### Visual Settings
- **Theme Options**:
  - Light theme
  - Dark theme (default)
  - "Funky Mode" (novelty theme)
- **Card Display**:
  - Expanded cards (always show description)
  - Collapsed cards (show on hover)
- **Panel Resizing**: Adjustable preview panel width

### Functional Settings
- **Data Folder Location**: Change where profiles and mods are stored
- **Game Directory**: Set custom game installation path
- **CDN Selection**: Switch between Thunderstore CDNs for download issues
- **Cache Management**:
  - Clear download cache
  - Clear mod list cache
  - Reset game installation (reinstall mod loader)
- **Update Settings**:
  - Auto-update manager (default)
  - Portable version (no auto-update)

### Advanced Settings
- **Launch Parameters**: Custom game launch arguments
- **Steam Directory**: Manual Steam location selection
- **Dependency String Export**: Developer tools
- **Debug Information**: Export logs and settings for troubleshooting

**UX Implications:**
- **Positive**: Settings are well-organized by category
- **Positive**: Data folder relocation helps users with limited C: drive space
- **Positive**: CDN switching provides workaround for download issues
- **Challenge**: Advanced settings can be intimidating for new users
- **Pain Point**: Some settings require app restart to take effect (not always clear which)
- **Pain Point**: "Reset game installation" is destructive and warning could be clearer

---

## Platform Support

### Operating Systems
- **Windows**: Full support, primary platform
- **Linux**: 
  - AppImage (universal)
  - .deb (Debian/Ubuntu)
  - .rpm (Fedora/RHEL)
  - pacman (Arch)
  - .tar.gz (manual)
- **macOS**: Limited support, Electron app

### Store Platforms
- **Steam**: Best support, automatic game detection
- **Epic Games Store**: Good support, may require manual game selection
- **Xbox Game Pass (Windows)**: Basic support, requires manual setup
- **Direct/GOG**: Varies by game

### Auto-Update
- **Installer Version**: Auto-updates via electron-updater
- **Portable Version**: Manual update, notifies of new versions
- **Update Behavior**: Downloads in background, installs on close

**UX Implications:**
- **Positive**: Cross-platform means users can keep same tool across OS
- **Challenge**: Linux support varies by distribution and Proton/Native setup
- **Challenge**: macOS support is less mature than Windows
- **Pain Point**: EGS/Xbox Game Pass users face more manual configuration
- **Pain Point**: Auto-update can feel intrusive (old_uninstaller.exe prompt)

---

## UX Implications

### Strengths (User-Friendly Aspects)

1. **Low Barrier to Entry**
   - Simple game selection screen
   - One-click mod installation
   - Automatic dependency handling
   - Visual mod cards are intuitive

2. **Safe Experimentation**
   - Profiles allow risk-free testing
   - Enable/disable is non-destructive
   - Vanilla launch preserves unmodded experience
   - Export/import makes sharing easy

3. **Information Accessibility**
   - Inline mod descriptions and previews
   - Built-in config editor
   - Help page covers common issues
   - Visual feedback for updates and errors

4. **Power User Features**
   - Advanced search and filtering
   - Bulk operations
   - Custom launch parameters
   - Direct file system access

### Challenges (UX Friction Points)

1. **Complexity Scaling**
   - Simple for basic use, but complex features are hard to discover
   - Advanced features lack in-app documentation
   - No guided tutorials or onboarding

2. **Error Handling**
   - Error messages can be technical
   - Limited guidance on resolution steps
   - Stacktraces sometimes shown to end users

3. **State Management**
   - Not always clear when changes take effect
   - Some operations require restart (game, manager, or system)
   - Async operations (downloads, installs) can be confusing

4. **Cognitive Load**
   - Large mod lists are overwhelming
   - Dependency trees are hard to visualize
   - No clear indicators of mod compatibility

5. **Platform Inconsistency**
   - Windows experience is most polished
   - Linux requires more technical knowledge
   - EGS/Xbox users get second-class experience

---

## Known Pain Points & Limitations

### Mod Management

1. **No Automatic Mod Compatibility Checking**
   - Manager doesn't know if two mods conflict
   - Users must rely on mod descriptions or trial-and-error
   - Known incompatibilities list is minimal (only 1 entry in knownIncompatibilities.md)

2. **No Rollback/Undo System**
   - Can't undo bulk operations
   - No version history for profiles
   - Uninstalling removes files permanently

3. **Dependency Management Complexity**
   - Shared dependencies mean disabling one mod doesn't disable its deps
   - No visualization of "why is this mod installed"
   - Orphaned dependencies after uninstalling parent mods

4. **Mod Update Risks**
   - Bulk update can break working setups
   - No staging or testing updates
   - No automatic backup before updates

### Profile System

5. **Profile Import Failures**
   - Imported profiles fail if mods are no longer available
   - No partial import or fallback options
   - Error messages don't indicate which mods failed

6. **No Profile Comparison**
   - Can't diff two profiles to see differences
   - No merge functionality
   - Hard to maintain variants of a base setup

7. **Profile Size & Performance**
   - Large profiles (100+ mods) slow down switching
   - No lazy loading or pagination
   - Memory usage scales with profile size

### Configuration

8. **Config Editor Performance**
   - Large config files (hundreds of entries) cause lag
   - No virtualization for long lists
   - Load time can be several seconds

9. **No Config Templates or Presets**
   - Users must configure each mod individually
   - No sharing of just config (only full profiles)
   - No "recommended settings" from mod authors

10. **Config Change Application**
    - Must restart game for most config changes
    - Not clear which configs are hot-reloadable
    - No in-manager indication of pending changes

### Launch & Platform

11. **Linux Proton/Native Confusion**
    - Users often don't know which to choose
    - `.forceproton` workaround is poorly documented
    - Launch failures are hard to diagnose

12. **EGS/Xbox Game Pass Manual Setup**
    - Requires finding game directory manually
    - No auto-detection for these platforms
    - Limited testing compared to Steam

13. **Launch Parameter Documentation**
    - Custom parameters are powerful but undocumented in-app
    - Examples are rare
    - Mistakes can prevent game launch

### Performance & Scalability

14. **Large Mod List Performance**
    - Scrolling 100+ mods can be sluggish
    - No virtualization in mod lists
    - Search can be slow on large catalogs

15. **Download Progress Accuracy**
    - Progress bars sometimes jump or freeze
    - No detailed speed/ETA information
    - Failed downloads don't always show clear error

16. **Cache & Storage Management**
    - Cache can grow large over time
    - No automatic cleanup
    - Users must manually clear cache

### Data & Persistence

17. **Path Length Issues (Windows)**
    - Windows 260-character path limit causes failures
    - Error message suggests changing data folder, but doesn't automate it
    - Affects deeply nested mod files

18. **No Cloud Sync**
    - Profiles are machine-local
    - Users must manually export/import between machines
    - No account system for cross-device sync

19. **Corrupted State Recovery**
    - If IndexedDB corrupts, profiles can be lost
    - No automatic backup system
    - Recovery requires manual file system access

### User Guidance

20. **Limited Onboarding**
    - No tutorial or first-run guide
    - Help page is reactive (problem-solution format)
    - Users must discover features organically

21. **Mod Incompatibility Warnings**
    - No proactive warnings before installation
    - Users only learn of conflicts after issues occur
    - Community knowledge not surfaced in-app

22. **Platform-Specific Issues**
    - Help is generic, not tailored to user's platform
    - Linux-specific issues are under-documented
    - macOS users have few resources

### Architectural Limitations

23. **Single Game Context**
    - Must switch between games via selection screen
    - No cross-game operations
    - Can't view multiple games simultaneously

24. **No Mod Development Tools**
    - No scaffolding or templates for mod creation
    - Local import is manual and basic
    - No integration with dev tools

25. **Limited Offline Functionality**
    - Recent fix allows loading offline, but limited
    - Can't download mods offline (obviously)
    - Cached data helps but not comprehensive

### Known Bugs & TODOs (from codebase)

26. **File System Edge Cases**
    - Some operations require admin/root unnecessarily
    - Symlink handling is incomplete
    - Case-sensitive filesystem issues (Linux/Mac)

27. **Memory Leaks**
    - Long-running sessions may accumulate memory
    - Some Vue components don't clean up properly
    - Dexie queries may not release connections

28. **UI Rendering Issues**
    - Modal stacking can cause z-index issues
    - Some tooltips overflow viewport
    - Resizing panels can break layout

---

## Technical Architecture

### Key Components

**Frontend:**
- Vue 3 (Composition API)
- Quasar Framework (UI components)
- Vuex (State management)
- Vue Router (Navigation)
- Floating Vue (Tooltips)

**Backend (Electron Main):**
- Node.js
- Electron IPC for main/renderer communication
- Native modules for platform-specific operations

**Storage:**
- Dexie (IndexedDB) for:
  - Package cache
  - Settings
  - Profile metadata
- File system for:
  - Mod files
  - Configs
  - Profiles

**Installation System:**
- Multiple installer types per mod loader
- Rule-based file placement
- Conflict tracking state machine
- Symlink and hardlink support (platform-dependent)

**Update System:**
- electron-updater for app updates
- Thunderstore API for mod updates
- Differential updates (only changed files)

### Data Flow

1. **Mod Installation:**
   ```
   User selects mod → Download from CDN → Extract ZIP → 
   Apply install rules → Update conflict state → 
   Save to profile → Update UI
   ```

2. **Profile Switching:**
   ```
   User selects profile → Load from DB → 
   Resolve mod files → Populate cache → 
   Render UI
   ```

3. **Game Launch:**
   ```
   User clicks Start → Resolve platform → 
   Generate launch command → Create wrapper (Linux) → 
   Execute via shell/protocol → Monitor process
   ```

### Extension Points

- **Game Support**: Add entries to `ecosystem.json`
- **Mod Loaders**: Implement `GameInstructions` interface
- **Installers**: Implement `PackageInstaller` interface
- **Platforms**: Implement `GameRunner` interface
- **Themes**: CSS variables in Quasar config

---

## Future Considerations

### Potential Improvements (not roadmap, just analysis)

1. **Enhanced Compatibility Checking**
   - Crowdsourced incompatibility database
   - Automated conflict detection
   - Pre-install warnings

2. **Better Backup/Restore**
   - Automatic profile backups
   - Version history
   - Rollback system

3. **Performance Optimizations**
   - Virtual scrolling for large lists
   - Lazy loading for profiles
   - Web workers for heavy operations

4. **Improved Onboarding**
   - First-run tutorial
   - Interactive tooltips
   - In-app feature discovery

5. **Collaborative Features**
   - Cloud sync (requires backend)
   - Social features (requires auth)
   - Mod collections/curatedlists

6. **Developer Tools**
   - Mod scaffolding
   - Testing framework integration
   - Hot reload support

---

## Appendix: Feature Matrix

| Feature | Windows | Linux | macOS | Steam | EGS | Xbox GP |
|---------|---------|-------|-------|-------|-----|---------|
| Auto-game detection | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| One-click install | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Config editor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile export/import | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-update manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Native launcher | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Proton support | N/A | ✅ | N/A | N/A | N/A | N/A |

**Legend:** ✅ Full support | ⚠️ Partial/Manual | ❌ Not supported | N/A Not applicable

---

## Summary

r2modman is a mature, feature-rich mod manager that excels at making modding accessible to non-technical users while providing power features for advanced users. Its greatest strengths are:

- **Broad game support** (221+ games)
- **Automatic dependency management**
- **Safe experimentation via profiles**
- **Cross-platform availability**
- **Active development and community**

The main pain points revolve around:

- **Complexity scaling** (advanced features are hard to discover/use)
- **Performance with large mod counts**
- **Limited guidance for troubleshooting**
- **Platform-specific quirks** (especially Linux/EGS/Xbox)
- **Lack of compatibility checking**

Overall, r2modman successfully achieves its core goal: making modding accessible. The pain points are primarily edge cases or advanced scenarios, though they can be showstoppers for affected users. The project would benefit from improved documentation, better error handling, and performance optimization for power users.
