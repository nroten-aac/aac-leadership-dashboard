---
name: shepherding-pipeline
description: 5-stage discipleship pipeline tracker on the Shepherding page (formerly Members). Stages, data model, scope.
type: feature
---
The Shepherding page (route `/members`, sidebar label "Shepherding", tab id remains `members`) is a discipleship pipeline tracker, not a directory.

**5 stages** (Chip's framework):
1. Connecting — in orbit, not yet committed (slate/gray)
2. Belonging — came to faith, baptized, joined (sky blue)
3. Maturing — growing through Scripture/group/prayer (emerald)
4. Ministering — using gifts in ministry (orange)
5. Multiplying — discipling others, on mission (gold/amber)

**Data model:**
- `members.discipleship_stage` (text, default 'connecting', CHECK constrained)
- `members.stage_updated_at` auto-bumped by trigger
- `discipleship_stage_history` table (previous_stage, new_stage, notes, changed_by, changed_at). Trigger `trg_log_discipleship_stage_change` BEFORE UPDATE on members inserts history rows on stage change; UI patches notes onto the most recent row.

**Scope:** Only people in `Member Adults` or `Member Children` PCO lists. No add form — people come from PCO sync only.

**UI:** horizontal pipeline funnel (click stage to filter), person grid cards, side sheet with quick "Move to next stage" button, 5-button reassign grid, pastoral note field, and full history timeline. 30-day movement count shown in funnel header.
