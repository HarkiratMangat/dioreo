---
kind: reference
status: live
---

# Port values — board 2 G4 vs the portal

*Generated 2026-09-15 22:44 EDT by `scripts/portalProbe.mjs` with the `--mockup` override added the same evening. Both values read from a rendered page, never recalled — plan §5b Step 6's close condition. `mk` is board 2, `pt` is the portal harness.*

### Tools bar

`#g4man .pb-tools` → `.mtools` · pin 3

- `height` · mk `132px` → pt `165px`
- `fontSize` · mk `13px` → pt `16.5px`

### Add build

`#g4man .pb-add` → `.mtools .madd` · pin 4

- `width` · mk `116.984px` → pt `114.984px`

### Column heads

`#g4man .pb-heads.pb-ghead` → `.wg-heads` · pin 14

- `height` · mk `45px` → pt `44px`

### Weapon sort

`#g4man .pb-sort` → `.wg-sort` · pin 14

- `width` · mk `60.1875px` → pt `61.1875px`
- `display` · mk `flex` → pt `inline-flex`

### Weapon header

`#g4man .pb-gh` → `.wg-h` · pin 19

- `fontSize` · mk `13px` → pt `16.5px`

### Build row

`#g4man .pb-rb` → `.wg-r` · pin 15

- `fontSize` · mk `13px` → pt `16.5px`

### Tier tag

`#g4man .pb-tag` → `.wg-tag` · pin 7

- `fontWeight` · mk `700` → pt `600`

### Attachment tag

`#g4man .pb-rail > .pb-at[style]` → `.wg-rail > .wg-at[style]` · pin 16

- `columnGap` · mk `8px` → pt `normal`

### Fix chip wrapper

`#g4man .pb-fwrap` → `.wg-fwrap` · pin 13

- `width` · mk `115.719px` → pt `113.719px`
- `fontSize` · mk `13px` → pt `16.5px`

### Fix chip

`#g4man .pb-fsum` → `.wg-fsum` · pin 13

- `width` · mk `115.719px` → pt `113.719px`

### Code field

`#g4man .pb-igw .pb-igf` → `.wg-code .wg-igf` · pin 8

- `borderRadius` · mk `7px 0px 0px 7px` → pt `6px 0px 0px 6px`
- `boxShadow` · mk `rgba(0, 0, 0, 0.45) 0px 2px 4px 0px inset` → pt `color(srgb 0.0194118 0.0264706 0.0317647) 0px 2px 4px 0px inset`
- `fontSize` · mk `13px` → pt `16.5px`

### Copy segment

`#g4man .pb-igw .pb-igb` → `.wg-code .wg-igb` · pins 9, 11

- `borderRadius` · mk `0px 7px 7px 0px` → pt `0px 6px 6px 0px`
- `fontSize` · mk `13px` → pt `16.5px`

### Share button

`#g4man .pb-rb .pb-acts > .pb-ib:first-child` → `.wg-r .wg-acts > .wg-ib:first-child` · pins 11, 47

- `borderRadius` · mk `6px` → pt `0px`
- `paddingLeft` · mk `6px` → pt `0px`
- `paddingRight` · mk `6px` → pt `0px`
- `minHeight` · mk `auto` → pt `0px`
- `fontSize` · mk `13px` → pt `16.5px`

### Delete button

`#g4man .pb-rb .pb-del` → `.wg-r .wg-del` · pin 47

- `borderRadius` · mk `6px` → pt `0px`
- `paddingLeft` · mk `6px` → pt `0px`
- `paddingRight` · mk `6px` → pt `0px`
- `minHeight` · mk `auto` → pt `0px`
- `fontSize` · mk `13px` → pt `16.5px`

