import Image from "next/image";
import type { ReactNode } from "react";
import PageContainer from "./PageContainer";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  image?: string;
  imageAlt?: string;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  actions,
  image,
  imageAlt,
}: Props) {
  return (
    <section className="ui-page-hero">
      <PageContainer>
        <div className={image ? "ui-page-hero__layout" : undefined}>
          <div>
            {eyebrow ? (
              <p className="homev3-eyebrow homev3-eyebrow--dark">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="homev3-title">{title}</h1>
            {description ? <p className="homev3-copy">{description}</p> : null}
            {actions ? (
              <div className="ui-page-hero__actions">{actions}</div>
            ) : null}
          </div>
          {image ? (
            <Image
              src={image}
              alt={imageAlt ?? ""}
              width={720}
              height={480}
              className="ui-page-hero__image"
              priority
            />
          ) : null}
        </div>
      </PageContainer>
    </section>
  );
}
