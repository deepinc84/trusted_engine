"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenIndexes((current) => (
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index]
    ));
  };

  return (
    <div className="quote-faq-list">
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);

        return (
          <article key={item.question} className={`quote-faq-item ${isOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="quote-faq-item__toggle"
              aria-expanded={isOpen}
              onClick={() => toggleItem(index)}
            >
              <span>{item.question}</span>
              <span className="quote-faq-item__icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? <p>{item.answer}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
