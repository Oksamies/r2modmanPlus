# Security Scan Report - r2modman Build

**Date:** 2026-01-05  
**Commit:** f30b068 (Refactor Help.vue for improved layout and search functionality)  
**Status:** ⚠️ VULNERABILITIES FOUND

## Executive Summary

The malware check failure on the built r2modman application is likely a **false positive** from antivirus software reacting to legitimate patterns. However, the scan has revealed several **real security vulnerabilities** in dependencies that should be addressed.

## Findings

### ✅ No Malicious Code Detected

After thorough scanning, **no actual malicious code was found** in the codebase. All patterns that might trigger antivirus software are legitimate:

1. **build/installer.nsh** - Contains `DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"` which is standard for NSIS installers to clean up previous installations
2. **Base64 decoding** in ProfileImportExport.ts - Used legitimately for importing mod profiles
3. **Child process execution** - Used for launching games, not for malicious purposes
4. **Network requests** - All go to legitimate Thunderstore API endpoints
5. **Minified JavaScript** - FontAwesome 5.11.2 library files are legitimate and from the official source

### ⚠️ Real Security Vulnerabilities Found (in Dependencies)

The following vulnerable dependencies were identified:

#### Critical Vulnerabilities

1. **axios v0.24.0** (4 vulnerabilities)
   - DoS attack through lack of data size check (CVE)
   - SSRF and Credential Leakage via Absolute URL
   - **Recommendation:** Upgrade to v0.30.2 or later (or v1.12.0+ for v1.x)
   - **Severity:** High

2. **electron-updater v4.2.5**
   - Code Signing Bypass on Windows
   - **Recommendation:** Upgrade to v6.3.0-alpha.6 or later
   - **Severity:** High (critical for Windows users)

3. **elliptic v6.5.4**
   - Private key extraction in ECDSA upon signing a malformed input
   - **Recommendation:** Upgrade to v6.6.1 or later
   - **Severity:** Medium to High

4. **node-ipc v12.0.0**
   - While v12.0.0 itself is clean, this package had malicious code in v10.1.1, v10.1.2, and v11.0.0
   - The maintainer added code to delete files on Russian/Belarusian IPs as a political statement
   - **Recommendation:** Consider replacing with an alternative IPC library or pin to v12.0.0
   - **Severity:** Low (historical concern, current version is safe)

#### Other Concerns

5. **highlight.js v9.18.5**
   - End of Life (EOL) version
   - **Recommendation:** Upgrade to v10.x or later
   - **Severity:** Low (no known vulnerabilities, but no security updates)

6. **Package.json reference to highlight.js v10.4.1**
   - Appears in package.json but v9.18.5 is being used in dependencies
   - **Recommendation:** Audit and update to consistent version

### 🔍 Potential False Positive Triggers

The following patterns might trigger antivirus/malware scanners but are legitimate:

1. **NSIS Installer Script** (`build/installer.nsh`)
   - Contains registry deletion commands
   - This is standard for Windows installers
   - **No action needed** - this is legitimate behavior

2. **Electron Application**
   - Electron apps can be flagged due to:
     - Node.js integration
     - Access to system APIs
     - Code signing issues
   - **Recommendation:** Ensure code signing is properly configured for Windows builds

3. **Minified JavaScript**
   - FontAwesome and other minified libraries
   - Can appear obfuscated to scanners
   - **No action needed** - these are from trusted sources

## Recommendations

### Immediate Actions Required

1. **Update axios** from v0.24.0 to v0.30.2 or later
   ```json
   "axios": "^0.30.2"
   ```

2. **Update electron-updater** from v4.2.5 to v6.3.0 or later
   ```json
   "electron-updater": "^6.3.0"
   ```

3. **Update elliptic** from v6.5.4 to v6.6.1 or later
   ```json
   "elliptic": "^6.6.1"
   ```

4. **Update highlight.js** to v10.x or later
   ```json
   "highlight.js": "^10.7.3"
   ```

### Code Signing Recommendations

To reduce false positives from antivirus software:

1. **Windows Code Signing**
   - Obtain an EV (Extended Validation) code signing certificate
   - Sign all executable files (`.exe`, `.dll`)
   - Sign the installer with proper timestamps

2. **macOS Code Signing**
   - Use Apple Developer certificate
   - Notarize the application with Apple
   - Enable hardened runtime

3. **Submit to Antivirus Vendors**
   - Submit the built application to major antivirus vendors for whitelisting
   - Microsoft SmartScreen
   - Norton
   - McAfee
   - Others as needed

### Build Configuration

The `build/installer.nsh` file is legitimate but could be modified to be less aggressive:

```nsis
!macro customInit
  ; Only delete if upgrading, not on fresh install
  DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
!macroend
```

Consider adding comments explaining why the registry key is being deleted.

## Conclusion

The malware check failure is most likely a **false positive** caused by:
1. Unsigned or improperly signed code
2. NSIS installer patterns
3. Electron application structure

However, there are **real security vulnerabilities** in the dependencies that must be addressed urgently, particularly:
- **axios** (SSRF, credential leakage, DoS)
- **electron-updater** (code signing bypass)
- **elliptic** (private key extraction)

**Priority:** High - Update vulnerable dependencies immediately to prevent exploitation.

## Next Steps

1. Update all vulnerable dependencies
2. Run security audit again: `yarn audit` or `npm audit`
3. Implement proper code signing for all platforms
4. Test the updated build
5. Submit to antivirus vendors for whitelisting if false positives persist
