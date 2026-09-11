# ETİBOL POS — Design System & UI Policy

## 1. Visual language
* Warm hospitality POS: espresso canvas (`#0B0A08`), elevated clay panels (`#171410`, `#1E1A16`), stone borders (`#322C26`).
* Brand accent is kiln clay (`#9A5F48`) — not blue, not purple, not gold neon.
* Functional status colors stay distinct: emerald empty tables, amber occupied, stone reserved, rose/red check requested.
* Typography: Segoe UI / Tahoma (Windows 7). High-legibility prices use tabular nums and mono for digits only.

## 2. Token & refactoring rules
* Make targeted edits only. Do NOT rewrite entire codebases unnecessarily.
* Keep state logic (Zustand) and IPC handlers untouched; focus strictly on UI layout, CSS, accessibility, and micro-interactions using Framer Motion.
