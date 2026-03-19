import type { ReactNode } from "react";
import PageContainer from "./PageContainer";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHero({ eyebrow, title, description, actions }: Props) {
  return (
    <section className="ui-page-hero">
      <PageContainer>
        {eyebrow ? <p className="homev3-eyebrow homev3-eyebrow--dark">{eyebrow}</p> : null}
        <h1 className="homev3-title">{title}</h1>
        {description ? <p className="homev3-copy">{description}</p> : null}
        {actions ? <div className="ui-page-hero__actions">{actions}</div> : null}
      </PageContainer>
    </section>
  );
}
