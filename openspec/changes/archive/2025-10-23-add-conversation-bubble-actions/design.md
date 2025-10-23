# Design Notes

## Provider Enhancements
- Add reducer actions:
  - `updateMessage(rowId, content)` for either side, updating timestamps.
  - `removeFeedRow(rowId)` removing entire pair.
- Ensure mirror null allowed; UI should handle missing mirror.
- Persist changes through existing storage slot.

## UI Interaction
- Introduce `ConversationBubbleActions` component with edit/delete buttons.
- Hover reveal actions (using absolute positioned toolbar).
- Editing uses modal dialog (`Dialog` or `Sheet`) with textarea; reuse ColumnComposer styling.
- Deleting triggers existing destructive alert dialog.

## Rendering Rules
- When `row.mirror` absent, render empty column (no placeholder).
- After edits/deletes, trigger toast feedback and keep scroll at bottom using existing hook.
