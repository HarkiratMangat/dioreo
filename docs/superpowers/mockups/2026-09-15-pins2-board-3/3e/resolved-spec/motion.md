---
kind: reference
status: live
---

# Board 3-E resolved values · @keyframes the board uses

*Part of the generated spec; read `README.md` in this folder first.*

## @keyframes the board uses

**`portal-spin`** · app.css

```css
@keyframes portal-spin { 100% { transform: rotate(360deg); } }
```

**`spin`** · app.css

```css
@keyframes spin { 100% { transform: rotate(360deg); } }
```

**`pulse`** · app.css

```css
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.55); opacity: 0.55; } }
```

**`conflictIn`** · app.css

```css
@keyframes conflictIn { 0% { box-shadow: rgba(255, 122, 69, 0.55) 0px 0px 0px 0px; } 100% { box-shadow: rgba(255, 122, 69, 0) 0px 0px 0px 14px; } }
```

**`skel`** · app.css

```css
@keyframes skel { 100% { background-position: -220% 0px; } }
```

**`refl`** · app.css

```css
@keyframes refl { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
```

**`rb`** · app.css

```css
@keyframes rb { 0% { background: color-mix(in srgb,var(--danger-ink) 26%,transparent); } 35% { background: color-mix(in srgb,var(--danger-ink) 26%,transparent); } 100% { background: transparent; } }
```

**`viewIn`** · app.css

```css
@keyframes viewIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: none; } }
```

**`stagePulse`** · app.css

```css
@keyframes stagePulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb,var(--staged) 55%,transparent); } 100% { box-shadow: 0 0 0 14px color-mix(in srgb,var(--staged) 0%,transparent); } }
```

**`countBump`** · app.css

```css
@keyframes countBump { 0% { transform: scale(1); } 40% { transform: scale(1.32); } 100% { transform: scale(1); } }
```

**`sess-ping`** · app.css

```css
@keyframes sess-ping { 0% { border-color: color-mix(in srgb,var(--live) 32%,transparent); box-shadow: 0 0 8px 0 color-mix(in srgb,var(--live) 16%,transparent),0 0 0 0 color-mix(in srgb,var(--live) 46%,transparent); } 55% { border-color: color-mix(in srgb,var(--live) 54%,transparent); box-shadow: 0 0 14px 2px color-mix(in srgb,var(--live) 30%,transparent),0 0 0 6px color-mix(in srgb,var(--live) 6%,transparent); } 100% { border-color: color-mix(in srgb,var(--live) 32%,transparent); box-shadow: 0 0 8px 0 color-mix(in srgb,var(--live) 16%,transparent),0 0 0 9px transparent; } }
```

**`sess-bloom`** · app.css

```css
@keyframes sess-bloom { 0%, 100% { opacity: 0.58; transform: scale(1.18); filter: blur(2.3px); } 50% { opacity: 1; transform: scale(0.6); filter: blur(0.5px); } }
```

**`arrive`** · app.css

```css
@keyframes arrive { 0% { opacity: 0; transform: translateY(-50%) scaleX(0.72); } 100% { opacity: 1; transform: translateY(-50%) scaleX(1); } }
```

**`arrive-pt`** · app.css

```css
@keyframes arrive-pt { 0% { opacity: 0; transform: rotate(45deg) scale(0.4); } 100% { opacity: 1; transform: rotate(45deg) scale(1); } }
```

**`rowin`** · app.css

```css
@keyframes rowin { 0% { opacity: 0; transform: translateX(-10px); } 100% { opacity: 1; transform: none; } }
```

**`landed`** · app.css

```css
@keyframes landed { 0% { background: color-mix(in srgb,var(--c,var(--staged)) 26%,transparent); } 55% { background: color-mix(in srgb,var(--c,var(--staged)) 16%,transparent); } 100% { background: transparent; } }
```

**`figRoll`** · app.css

```css
@keyframes figRoll { 0% { transform: translateY(0px); opacity: 1; } 45% { transform: translateY(-42%); opacity: 0; } 55% { transform: translateY(42%); opacity: 0; } 100% { transform: translateY(0px); opacity: 1; } }
```

**`fdrift`** · app.css

```css
@keyframes fdrift { 0% { opacity: 0; transform: translateY(6px); } 25% { opacity: 1; transform: translateY(0px); } 100% { opacity: 0; transform: translateY(-9px); } }
```

**`toastIn`** · app.css

```css
@keyframes toastIn { 0% { opacity: 0; transform: translateX(-50%) translateY(26px) scale(0.97); } 35% { opacity: 1; } 100% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } }
```

**`toastOut`** · app.css

```css
@keyframes toastOut { 0% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.985); } }
```

**`d-just-granted`** · app.css

```css
@keyframes d-just-granted { 0% { background: color-mix(in srgb, var(--ok) 22%, transparent); } 100% { background: transparent; } }
```

**`b3pop`** · b3/board.css

```css
@keyframes b3pop { 0% { opacity: 0; transform: translateY(-7px) scale(0.965); } 55% { opacity: 1; } 100% { opacity: 1; transform: none; } }
```

**`b3popup`** · b3/board.css

```css
@keyframes b3popup { 0% { opacity: 0; transform: translateY(7px) scale(0.965); } 55% { opacity: 1; } 100% { opacity: 1; transform: none; } }
```

**`b3rise`** · b3/board.css

```css
@keyframes b3rise { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: none; } }
```

**`b3pulse`** · b3/board.css

```css
@keyframes b3pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb,var(--focus) 70%,transparent); } 100% { box-shadow: transparent 0px 0px 0px 14px; } }
```

**`b3draw`** · b3/board.css

```css
@keyframes b3draw { 0% { stroke-dashoffset: var(--dlen,64); } 100% { stroke-dashoffset: 0; } }
```

**`b3attsfade`** · b3/board.css

```css
@keyframes b3attsfade { 0% { --atts-l: 0px; --atts-r: 34px; } 12%, 88% { --atts-l: 24px; --atts-r: 34px; } 100% { --atts-l: 24px; --atts-r: 0px; } }
```

**`pbIn`** · b3/board.css

```css
@keyframes pbIn { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: none; } }
```

**`b3shine`** · b3/board.css

```css
@keyframes b3shine { 0% { transform: translate3d(-160%, 0px, 0px); } 17%, 100% { transform: translate3d(420%, 0px, 0px); } }
```

**`b3extend`** · b3/board.css

```css
@keyframes b3extend { 0% { transform: scaleX(0); opacity: 0; } 100% { transform: none; opacity: 1; } }
```

**`b3unfold`** · b3/board.css

```css
@keyframes b3unfold { 0% { clip-path: inset(0px 0px 100%); opacity: 0.6; } 100% { clip-path: inset(0px); opacity: 1; } }
```

**`b3head`** · b3/board.css

```css
@keyframes b3head { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: none; } }
```

**`b3hand`** · b3/board.css

```css
@keyframes b3hand { 0% { opacity: 0; } 100% { opacity: 1; } }
```

**`b3fade`** · b3/board.css

```css
@keyframes b3fade { 0% { opacity: 0; } 100% { opacity: 1; } }
```

**`b3fold`** · b3/board.css

```css
@keyframes b3fold { 0% { clip-path: inset(0px); opacity: 1; } 100% { clip-path: inset(100% 0px 0px); opacity: 0.4; } }
```

**`b3fadeout`** · b3/board.css

```css
@keyframes b3fadeout { 100% { opacity: 0; } }
```

**`b3chipin`** · b3/board.css

```css
@keyframes b3chipin { 0% { opacity: 0; transform: translateY(6px) scale(0.96); } }
```

**`b3xtin`** · b3/board.css

```css
@keyframes b3xtin { 0% { opacity: 0; transform: translateX(-12px); } }
```

**`b3xtflash`** · b3/board.css

```css
@keyframes b3xtflash { 0% { background: color-mix(in srgb,var(--c) 22%,transparent); } 100% { background: transparent; } }
```

**`b3xtroll`** · b3/board.css

```css
@keyframes b3xtroll { 0% { opacity: 0; transform: translateY(30%); } }
```

**`b3xfin`** · b3/board.css

```css
@keyframes b3xfin { 0% { opacity: 0; transform: translateY(10px); } }
```

**`b3rimr`** · b3/board.css

```css
@keyframes b3rimr { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
```

**`b3toxb1`** · b3/board.css

```css
@keyframes b3toxb1 { 0% { transform: translate3d(15.91%, 23.17%, 0px); } 12.5% { transform: translate3d(27.27%, 35.37%, 0px); } 25% { transform: translate3d(45.45%, 46.34%, 0px); } 37.5% { transform: translate3d(68.18%, 40.24%, 0px); } 50% { transform: translate3d(88.64%, 28.05%, 0px); } 62.5% { transform: translate3d(79.55%, 15.85%, 0px); } 75% { transform: translate3d(54.55%, 8.54%, 0px); } 87.5% { transform: translate3d(29.55%, 13.41%, 0px); } 100% { transform: translate3d(15.91%, 23.17%, 0px); } }
```

**`b3toxb2`** · b3/board.css

```css
@keyframes b3toxb2 { 0% { transform: translate3d(89.47%, 45.71%, 0px); } 12.5% { transform: translate3d(76.32%, 30%, 0px); } 25% { transform: translate3d(52.63%, 18.57%, 0px); } 37.5% { transform: translate3d(31.58%, 28.57%, 0px); } 50% { transform: translate3d(21.05%, 48.57%, 0px); } 62.5% { transform: translate3d(47.37%, 58.57%, 0px); } 75% { transform: translate3d(84.21%, 50%, 0px); } 87.5% { transform: translate3d(100%, 35.71%, 0px); } 100% { transform: translate3d(89.47%, 45.71%, 0px); } }
```

**`b3toxb3`** · b3/board.css

```css
@keyframes b3toxb3 { 0% { transform: translate3d(68.75%, 9.68%, 0px); } 12.5% { transform: translate3d(96.88%, 20.97%, 0px); } 25% { transform: translate3d(125%, 40.32%, 0px); } 37.5% { transform: translate3d(109.38%, 59.68%, 0px); } 50% { transform: translate3d(78.12%, 70.97%, 0px); } 62.5% { transform: translate3d(46.88%, 59.68%, 0px); } 75% { transform: translate3d(25%, 35.48%, 0px); } 87.5% { transform: translate3d(40.62%, 17.74%, 0px); } 100% { transform: translate3d(68.75%, 9.68%, 0px); } }
```

**`b3xtname`** · b3/board.css

```css
@keyframes b3xtname { 0%, 12% { transform: translateX(0px); } 88%, 100% { transform: translateX(min(0px, -100% + 100cqw)); } }
```
