# MyRoomeo Quiz Scoring & Roommate Type Matching Logic

> **Implementation:** inline JavaScript in [`quiz.html`](../quiz.html) (`QUIZ`, `TYPES`, `resolveType`)  
> **Product spec reference:** [`docs/result page.md`](./result%20page.md)

---

## 0. Quick answers

| Question | Answer |
|----------|--------|
| Is there scoring logic? | **Yes** — runs client-side in `quiz.html` |
| How is your animal type chosen? | 12 questions → **weighted votes** across 6 animals → highest total wins |
| “What score = what type?” | **Not** a fixed threshold like “100 points = Beaver”. It’s **relative**: whichever of the 6 animals has the highest tally |
| Result page % stats | **Static copy** per type — not computed from answers |
| Two-person compatibility | **Not implemented** dynamically; compat text is preset narrative |

---

## 1. The six roommate types

Code uses a **slug** as the key; the UI shows **The X**:

| slug | Display name | Emoji | Typical dimension profile |
|------|--------------|-------|---------------------------|
| `beaver` | The Beaver | 🦫 | High cleanliness, high structure, medium-high home engagement |
| `owl` | The Owl | 🦉 | Low social energy, high structure, strong boundaries |
| `turtle` | The Turtle | 🐢 | Homebody, moderate structure, decent cleanliness |
| `fox` | The Fox | 🦊 | Flexible, moderately social, looser on cleanliness/rules |
| `bunny` | The Bunny | 🐰 | High social energy, flexible, loves a lively home |
| `cat` | The Cat | 🐱 | Low engagement, low cleanliness, lives in their own lane |

Full copy (roast, stats, compat, etc.) lives in `TYPES[slug]`.

---

## 2. Core algorithm: weighted voting (decides your type)

### 2.1 Flow

```text
User finishes 12 questions
  → answers = [0..3, 0..3, ...]   // option index per question
  → resolveType(answers)
  → tally = { beaver, owl, turtle, fox, bunny, cat }
  → pick highest tally
  → tie → tieOrder priority
  → save to sessionStorage.roomeo_type
```

### 2.2 Points per question

For question `qi`, user picks option `ch` (0=A, 1=B, 2=C, 3=D):

1. Look up `QUIZ[qi].votes[ch]` → animal array, e.g. `['owl', 'beaver']`
2. Weight `w = 1 / array.length`
3. **Each** animal in the array gets `+= w`

| Tags on the option | Points per tagged animal |
|--------------------|--------------------------|
| 1 animal | **+1.0** |
| 2 animals | **+0.5** each |
| 3 animals | **+0.333…** each |
| 4 animals | **+0.25** each |

> Across all 12 questions, the **theoretical max** for one animal is **12.0** (if every pick is a single-tag option for that animal only).  
> With the actual question bank (many dual-tag options), **practical maxima** when always picking the best option for that animal:

| Animal | Max achievable tally (12 optimal picks) |
|--------|---------------------------------------|
| turtle | **8.5** |
| beaver | **8.0** |
| cat | **8.0** |
| owl | **7.5** |
| fox | **7.0** |
| bunny | **6.0** |

### 2.3 How to read tally scores

- Tally is roughly **0 – 8.5**, not a 0–100 scale
- There is **no** cutoff table like “≥7 = Owl”
- Compare **all 6 numbers** — highest wins. Example:

```text
beaver: 5.5
owl:    4.0
turtle: 3.5
fox:    2.0
bunny:  1.5
cat:    1.0
→ Result: The Beaver
```

### 2.4 Tie-break

If two or more animals tie for highest score, pick by fixed priority (**earlier = wins**):

```text
beaver → owl → turtle → fox → bunny → cat
```

Example: `beaver: 6.0` and `owl: 6.0` → **The Beaver**.

### 2.5 Pseudocode

```javascript
function resolveType(ans) {
  const tally = { beaver: 0, cat: 0, owl: 0, fox: 0, bunny: 0, turtle: 0 };
  for (let qi = 0; qi < 12; qi++) {
    const tags = QUIZ[qi].votes[ans[qi]];
    const w = 1 / tags.length;
    for (const tag of tags) tally[tag] += w;
  }
  const tieOrder = ['beaver', 'owl', 'turtle', 'fox', 'bunny', 'cat'];
  return tieOrder.reduce((best, k) => tally[k] > tally[best] ? k : best, 'owl');
}
```

---

## 3. Full mapping: 12 questions × 4 options → types + points

Option index: **A=0, B=1, C=2, D=3**  
“Points” = what **each listed animal** receives when that option is selected.

---

### Q1 · A. Cleanliness & Initiative

**Prompt:** 2 a.m., thirsty, roommate asleep, only their unopened Sprite in the fridge.

| Option | Animals credited | Points each |
|--------|------------------|-------------|
| **A** | owl, beaver | +0.5 |
| **B** | owl, turtle | +0.5 |
| **C** | fox, bunny | +0.5 |
| **D** | cat | +1.0 |

---

### Q2 · A. Cleanliness & Initiative

**Prompt:** Exhausted after cooking; dishes in the sink.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | beaver | +1.0 |
| **B** | owl, fox | +0.5 |
| **C** | turtle | +1.0 |
| **D** | cat | +1.0 |

---

### Q3 · A. Cleanliness & Initiative

**Prompt:** Trash overflowing; nobody has taken it out.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | beaver | +1.0 |
| **B** | owl, bunny | +0.5 |
| **C** | fox, turtle | +0.5 |
| **D** | cat | +1.0 |

---

### Q4 · B. Social Energy & Guests

**Prompt:** You brought someone over; roommate comes home early during an intimate moment.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | owl | +1.0 |
| **B** | beaver, turtle | +0.5 |
| **C** | fox | +1.0 |
| **D** | bunny, cat | +0.5 |

---

### Q5 · B. Social Energy & Guests

**Prompt:** Friday night, both home, no work tomorrow — ideal vibe?

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | owl | +1.0 |
| **B** | turtle | +1.0 |
| **C** | beaver, fox | +0.5 |
| **D** | bunny | +1.0 |

---

### Q6 · B. Social Energy & Guests

**Prompt:** After 10:30 p.m., FaceTime / low music — not dead quiet.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | owl, turtle | +0.5 |
| **B** | beaver, turtle | +0.5 |
| **C** | fox | +1.0 |
| **D** | bunny, cat | +0.5 |

---

### Q7 · C. Structure vs Flexibility

**Prompt:** Roommate hogs the bathroom every morning when you need it.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | beaver | +1.0 |
| **B** | turtle, owl | +0.5 |
| **C** | fox, cat | +0.5 |
| **D** | owl, beaver | +0.5 |

---

### Q8 · C. Structure vs Flexibility

**Prompt:** Messy sink, surprise guests, no quiet-hour agreement — what system do you want?

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | fox, cat | +0.5 |
| **B** | bunny | +1.0 |
| **C** | turtle | +1.0 |
| **D** | owl, beaver | +0.5 |

---

### Q9 · C. Structure vs Flexibility

**Prompt:** Roommate’s habits differ from yours — your instinct?

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | bunny | +1.0 |
| **B** | owl | +1.0 |
| **C** | turtle, fox | +0.5 |
| **D** | beaver | +1.0 |

---

### Q10 · C. Structure vs Flexibility

**Prompt:** How would your roommate describe living with you? (pick the most accurate)

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | beaver, owl | +0.5 |
| **B** | turtle | +1.0 |
| **C** | fox, bunny | +0.5 |
| **D** | cat | +1.0 |

---

### Q11 · D. Presence & Engagement

**Prompt:** Where are you most likely to be on Saturday?

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | turtle | +1.0 |
| **B** | beaver, owl | +0.5 |
| **C** | bunny, fox | +0.5 |
| **D** | cat | +1.0 |

---

### Q12 · D. Presence & Engagement

**Prompt:** Roommate’s fridge section leaked onto shared shelves.

| Option | Animals | Points each |
|--------|---------|-------------|
| **A** | beaver, turtle | +0.5 |
| **B** | owl, beaver | +0.5 |
| **C** | fox, turtle | +0.5 |
| **D** | cat | +1.0 |

---

## 4. How often each animal appears in the bank

Counts **option slots** (48 total: 12 questions × 4 options) where the animal is tagged:

| Animal | Appearances (of 48) | Notes |
|--------|---------------------|-------|
| beaver | 14 | Most common on cleanliness / rules questions |
| owl | 14 | Boundaries, quiet, structure |
| turtle | 14 | Middle ground, homebody |
| fox | 12 | Flexible, moderate social |
| bunny | 9 | Social — fewer cleanliness tags |
| cat | 10 | Low engagement — often on D options |

**Bunny** appears least often, so winning purely on votes is harder. **Turtle / beaver / owl** have the widest coverage in the mapping.

---

## 5. Worked examples (full tally)

### Example A: all A’s (12 × option 0)

| Animal | Tally | Sources |
|--------|-------|---------|
| beaver | **4.5** | Q1×0.5 + Q7×1 + Q8×0.5 + Q10×0.5 + Q11×0.5 + Q12×0.5 |
| owl | 3.5 | Q1×0.5 + Q4×1 + Q5×1 + Q6×0.5 + Q7×0.5 + Q8×0.5 + Q10×0.5 + Q11×0.5 + Q12×0.5 |
| turtle | 2.0 | Q1×0.5 + Q6×0.5 |
| fox | 0.5 | — |
| bunny | 1.0 | — |
| cat | 0.5 | — |

**Winner: The Beaver** (4.5)

### Example B: all D’s (12 × option 3)

| Animal | Tally |
|--------|-------|
| cat | **7.0** |
| beaver | 2.0 |
| bunny | 2.0 |
| owl | 1.0 |
| turtle / fox | 0 |

**Winner: The Cat** (7.0)

### Example C: Beaver-leaning path

Option sequence: `A,B,A, B,C,B, A,D,D, A,B,B, B` (letters = 0–3)

| Animal | Tally |
|--------|-------|
| **beaver** | **8.0** |
| owl | 2.5 |
| turtle | 1.0 |
| fox | 0.5 |

**Winner: The Beaver**

### Example D: Turtle-leaning path

| Animal | Tally |
|--------|-------|
| **turtle** | **8.5** |
| fox | 1.5 |
| owl | 1.5 |
| beaver | 0.5 |

**Winner: The Turtle**

---

## 6. Four-dimension scores (auxiliary — does not decide type)

This is a **second scoring system**, independent of animal tally.

### 6.1 Option → numeric score

```javascript
score = 4 - optionIndex   // A=4, B=3, C=2, D=1
```

### 6.2 Dimension totals

| Dimension | Questions | Count | Score range |
|-----------|-----------|-------|-------------|
| Cleanliness | Q1–Q3 | 3 | 3–12 |
| Social energy | Q4–Q6 | 3 | 3–12 |
| Structure | Q7–Q10 | 4 | 4–16 |
| Engagement | Q11–Q12 | 2 | 2–8 |

### 6.3 Dimension → label (High / Moderate / Low)

Scaled by question count (`traitLevel(sum, invert, n)`):

- High: `sum ≥ round(9 × n/3)`
- Low: `sum ≤ round(5 × n/3)`
- Otherwise: Moderate

**Social energy uses `invert: true`:** more A’s (higher sum) → quieter social label; more D’s → higher social label.

### 6.4 Where it’s used (does not affect `resolveType`)

| Function | Purpose |
|----------|---------|
| `deriveLifestyle()` | Prefill profile step 2 (rhythm / clean / social) |
| `getWhyBullets()` | Dynamic “Your answers suggest…” bullets (backfilled from `whyFallback`) |
| `buildTraitGridHtml()` | 4-dimension grid (**function exists; not mounted on result UI**) |

### 6.5 Result page % stats

`TYPES[slug].stats` entries like `Cleanliness: 100%` are **static display copy** per type — not derived from section 6 scores.

---

## 7. Compatibility (“Compatibility radar” on results)

Each type has **2 fixed entries** in `TYPES[slug].compat`:

- 1 × Soulmate
- 1 × Roommate war

Example — Beaver:

| Relationship | Match | Copy type |
|--------------|-------|-----------|
| Soulmate | The Owl | Preset one-liner |
| Roommate war | The Cat | Preset one-liner |

**Not** a dynamic compatibility score after two users complete the quiz.

---

## 8. Not implemented yet

1. Two users finish → automatic compatibility %
2. Compare with a Friend → dual result card after friend completes quiz (friend slot stays `?` today)
3. Backend / waitlist real matching
4. Linking stats % on the result page to live answer scores
5. Real QR codes (placeholder: `assets/site/share-qr-placeholder.svg`)

---

## 9. sessionStorage

| Key | Contents |
|-----|----------|
| `roomeo_quiz_answers` | JSON array of 12 option indices (0–3) |
| `roomeo_type` | Result slug string |
| `roomeo_profile_step1` | `{ name, email, city }` |
| `roomeo_profile_step2` | Profile step 2 fields |
| `roomeo_compare_friend` | `{ email, name, tips, ts }` on compare form submit |

Quiz retry clears the first four keys (not `roomeo_compare_friend`).

---

## 10. Debugging

| Method | Usage |
|--------|-------|
| Hash | `quiz.html#turtle` — open a type’s result page directly (`bootFromHash()`) |
| Figma preview | `quiz.html#figmacapture=1&previewResult=beaver` — **hash** query, not `?previewResult=` alone |
| Share link | `quiz.html#fox` — same as `shareUrl()` |
| Console | After quiz: `JSON.parse(sessionStorage.getItem('roomeo_quiz_answers'))` — hand-tally using §3 |
| Code | Log tally inside `resolveType()` before return |

---

## 11. Code index

| Symbol | ~Line in quiz.html | Description |
|--------|-------------------|-------------|
| `QUIZ` | ~2823 | 12 questions + `votes` mapping |
| `TYPES` | ~2983 | Copy for all 6 types |
| `resolveType()` | ~3310 | **Type assignment** |
| `answerScores()` | ~3287 | A=4…D=1 for dimensions |
| `traitLevel()` | ~3292 | High / Moderate / Low |
| `showResults()` | ~3883 | Submit → score entry point |

---

## 12. One-line summary

**Mapping rule:** each option tags 1–2 animal slugs; selecting it adds `1 ÷ tag count` to each tag; after 12 questions the highest tally is your type (Beaver wins ties). There is no standalone “score X = type Y” table — only relative ranking across the six animals.
