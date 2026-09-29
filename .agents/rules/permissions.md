# Permission Enforcement Rules

## 1. Strict Permission Authority
- Feature actions and UI elements must rely solely on `hasPermission(permission)`.
- Never add fallback checks for roles (`admin`, `superadmin`, `devAdmin`, etc.) when evaluating specific feature permissions.
- Disabling a permission in `disabled_permissions` must always result in the action/button being hidden or disabled, even for superadmins.
