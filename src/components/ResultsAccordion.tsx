import type { ReactNode } from 'react';

interface ResultsAccordionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function ResultsAccordion({
  title,
  summary,
  defaultOpen = true,
  children,
}: ResultsAccordionProps) {
  return (
    <details className="results-accordion" open={defaultOpen}>
      <summary className="results-accordion-summary">
        <span className="results-accordion-title">{title}</span>
        {summary ? <span className="results-accordion-meta">{summary}</span> : null}
      </summary>
      <div className="results-accordion-body">{children}</div>
    </details>
  );
}
