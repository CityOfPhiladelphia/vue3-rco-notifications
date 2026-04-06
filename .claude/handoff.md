# Handoff Note
*Created: 2026-04-06*
*Project: vue3-rco-notifications*

## Current Task

Fix CSV export bug where the third RCO is silently dropped when exporting at addresses like 106 Jamestown Ave (which returns 3 RCOs).

## Status

**Fix applied, not yet tested or committed.**

The root cause: `encodeURI()` does not encode `#` characters. When any RCO field contains a `#`, the browser treats it as a URL fragment identifier, truncating the data URI and dropping all subsequent rows. The `exportProperties` function already stripped `#` but `exportRcos` did not.

**Change made:** Added `.replaceAll('#', '')` to all six field values in the `exportRcos` function in `src/components/LeftPanel.vue` (lines 166-176), matching the existing pattern for comma stripping.

## Next Step

1. Andy needs to test the export at 106 Jamestown Ave to confirm all 3 RCOs appear in the CSV
2. Once confirmed, commit the fix

## Notes

- The uncommitted change is only in `src/components/LeftPanel.vue`
- `.claude/` and `CLAUDE.md` are also untracked (created in a previous session for project setup)
- The `exportProperties` function (line 193) already had `#` stripping — this was a known pattern that was just missed in `exportRcos`
