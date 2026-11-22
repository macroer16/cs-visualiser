import { PageTitle, Card } from "../components/Layout";

export default function About() {
  return (
    <>
      <PageTitle module="About" title="Why I built this" intro="Some first-year topics are much easier to understand when you can see them move." />
      <Card className="max-w-3xl space-y-4 leading-relaxed text-stone-700">
        <p>
          I'm Victor Benson, a first-year Computer Science student at the University of Westminster. I built CS Visualiser to revise
          for my own modules — Mathematics for Computing and Computer Systems Fundamentals — and made it free so my course mates
          can use it too.
        </p>
        <p>
          Everything runs in your browser: no accounts, no tracking, no backend. It's built with React, TypeScript, Vite and
          Tailwind CSS, and hosted on Vercel.
        </p>
        <p>
          Found a mistake or want a topic added? Email <a className="text-accent underline" href="mailto:Victorbenson419@gmail.com">Victorbenson419@gmail.com</a>{" "}
          or open an issue on <a className="text-accent underline" href="https://github.com/macroer16/cs-visualiser" target="_blank" rel="noreferrer">GitHub</a>.
        </p>
      </Card>
    </>
  );
}
