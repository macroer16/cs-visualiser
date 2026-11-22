import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageTitle } from "../components/Layout";
import { newQuiz } from "../lib/quiz";
import { markDone } from "../lib/progress";

export default function Quiz() {
  const [questions, setQuestions] = useState(() => newQuiz());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[index];
  const finished = index >= questions.length;
  if (finished && score >= 8) markDone("/quiz");

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => { setIndex((i) => i + 1); setPicked(null); };
  const restart = () => { setQuestions(newQuiz()); setIndex(0); setPicked(null); setScore(0); };

  return (
    <>
      <PageTitle n="06" module="Both modules" title="The final test" intro="Ten random questions across every chapter. Numbers change every time, so you can't just memorise the answers. Score 8 or more to finish the path." />

      <div className="mx-auto max-w-2xl">
        {finished ? (
          <Card className="text-center">
            <p className="text-sm text-stone-500">Your score</p>
            <p className="mt-2 text-6xl font-bold text-accent">{score}/{questions.length}</p>
            <p className="mt-3 text-stone-600">
              {score === questions.length ? "Perfect. You're ready." : score >= 7 ? "Strong — review the ones you missed." : "Good start. Use the tools above, then try again."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={restart} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white">New quiz</button>
              <Link to="/" className="rounded-lg bg-stone-200 px-5 py-2.5">Back to tools</Link>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between text-sm text-stone-500">
              <span>Question {index + 1} of {questions.length} · <span className="text-accent">{q.topic}</span></span>
              <span>Score {score}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-stone-100">
              <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
            </div>

            <h2 className="mt-6 text-xl font-semibold">{q.prompt}</h2>
            <div className="mt-5 grid gap-2">
              {q.options.map((o, i) => {
                const state = picked === null ? "" : i === q.answer ? "border-on bg-on/10" : i === picked ? "border-red-500 bg-red-50" : "opacity-50";
                return (
                  <button key={i} onClick={() => choose(i)} disabled={picked !== null}
                    className={`rounded-xl border-2 border-stone-200 px-4 py-3 text-left font-mono transition hover:border-accent ${state}`}>
                    {o}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <div className="mt-5 rounded-xl bg-stone-50 p-4" aria-live="polite">
                <p className={`font-semibold ${picked === q.answer ? "text-on" : "text-red-600"}`}>{picked === q.answer ? "Correct!" : "Not quite."}</p>
                <p className="mt-1 text-sm text-stone-600">{q.why}</p>
                <button onClick={next} autoFocus className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
                  {index + 1 === questions.length ? "See score" : "Next question →"}
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
