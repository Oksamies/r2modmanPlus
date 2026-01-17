; Custom initialization macro for r2modman installer
; This deletes any existing uninstaller registry key to ensure clean reinstallation
; This is a standard practice for NSIS installers to avoid conflicts with previous installations
!macro customInit
  DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
!macroend
