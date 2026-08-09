# CHANGELOG — CRM Pro

## v2.3 (Phase 38) — Final Cleanup & Sync

### Fixes
- Removed legacy bundle.js (316 KB redundant file)
- Fixed cache headers: JS/CSS cached for 1 hour, HTML no-cache
- Synced all local improvements to GitHub

---

## v2.2 (Phase 37) — Performance Optimization

### Performance Improvements
- **Split bundle**: Separated bundle.js into bundle-core.js (~45 KB) and bundle-modules.js (~272 KB)
- **Gzip compression**: Server now compresses all JS/CSS/HTML responses (60-70% reduction)
- **Cache headers**: JS/CSS cached for 1 hour, HTML always fresh
- **Preload hints**: Critical resources (bundle-core.js, app.css) preloaded
- **Console.log cleanup**: Removed 53 console.log statements from production

### Performance Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial blocking JS | 316 KB | ~12 KB (gzip) | -96% |
| Total transfer size | ~500 KB | ~90 KB | -82% |
| Cache strategy | No cache | 1 hour for JS/CSS | Faster repeat visits |
| First Contentful Paint | ~2-3s | ~0.5-1s | -70% |

### Testing
- Added `test-performance.ps1` for automated performance testing
- Run `.\test-performance.ps1` after every major change

---

## v2.1 (Phase 32.1) — Refactor & Harden
- Added central Event Bus (`bus.js`) + central tick scheduler
- Global search now indexes deals, companies, notes, ideas, projects
- Added `install.ps1` (seed data) and `start.ps1` (one-command start)

---

## v2.0 (Phases 28–31) — Full CRM
- Sales Pipeline (deals, 5-stage kanban, weighted forecast)
- Companies + person↔company link + tags & smart segments
- Project detail panel + subtasks checklist
- Automation rules engine + OKR objectives

---

## v1.x (Phases 1–27) — Foundation & GOD MODE UI
- Local JSON storage + PowerShell REST server + PWA
- Jalali calendar + week view + holidays + drag&drop + time blocking
- Inbox GOD MODE (Zen, undo, snooze, smart capture)
- Dashboard GOD MODE (focus, pomodoro, vitals, AI insights, bento)
- Knowledge graph, gamification, vault, wrapped, reports
- Mobile bottom nav + swipe

---

## v0.1 — Initial prototype
