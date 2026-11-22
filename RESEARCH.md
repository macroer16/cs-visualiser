# Research notes

Before building I looked at interactive learning tools and design references to decide how CS Visualiser should feel.

## What I looked at

- **@DilumSanjaya's interactive science apps** — one small interactive app per textbook chapter; design is the hard part, not the code.
- **scroll-wise** — short quizzes gate access to distracting apps; you pick the topic and how many correct answers unlock time.
- **explainr.in** — turns topics into short animated explainers.
- **tasteskill.dev** — rules for making AI-built front ends look designed rather than generic.
- **jeeify, oroitu, guiden.ai, arclenui, osui** — exam tutors, vocabulary cards, course platforms and UI kits for reference.

## The 10 ideas I used

1. **One concept per page.** Each tool does one thing well, like one app per chapter.
2. **Live feedback, no submit button.** Every input recalculates instantly so cause and effect are obvious.
3. **Show the working, not just the answer.** Bases show place values and repeated division, the way an exam expects.
4. **Highlight what changed.** The CPU tool enlarges and colours only the registers touched in each micro-step.
5. **Plain-English narration.** A sentence under the CPU explains every step, and history keeps the full story.
6. **Examples to start from.** Preset circuits (half adder, XOR from NANDs) and preset set expressions mean the page is never empty.
7. **Randomised practice.** Quiz numbers are generated each time, so students can't just memorise answers (spaced, repeatable practice like scroll-wise).
8. **Warm neutral palette + one accent.** Off-white paper, near-black ink and a single blue, avoiding default purple gradients (tasteskill).
9. **Left-aligned hierarchy and real copy.** Short module label, clear title, one-line instruction — no filler feature cards.
10. **Works on a phone.** Big tap targets on gate ports, scrollable tables and touch dragging, checked at mobile width.

## Redesign (Nov 2026)

Second round of research: ~130 explorable explanations from awesome-explorables and the Interactive-Learning list,
plus NandGame, Bartosz Ciechanowski's articles, Red Blob Games and setosa.io, and Nicky Case's design patterns.

What changed because of it:
- **A hook first.** The home page opens with eight switches you can flip — no reading needed (Case: interest curve).
- **Start small, build big.** The tools became six numbered chapters on a path, from bits to a CPU (NandGame).
- **See, model, apply.** Each chapter ends with a challenge that checks your answer (Case: embedded problems).
- **Progress.** Ticks in the nav and on the path, saved in localStorage (achiever motivation).
- **No AI-template look.** The grid of icon cards is gone. Graph paper, ink borders with hard shadows, a highlighter, Bricolage Grotesque + JetBrains Mono.
