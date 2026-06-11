import Image from "next/image";
import type { ReactNode } from "react";
import PageContainer from "./PageContainer";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  image?: {
    src: string;
    alt: string;
  };
};

export default function PageHero({ eyebrow, title, description, actions, image }: Props) {
  const content = (
    <>
      {eyebrow ? <p className="homev3-eyebrow homev3-eyebrow--dark">{eyebrow}</p> : null}
      <h1 className="homev3-title">{title}</h1>
      {description ? <p className="homev3-copy">{description}</p> : null}
      {actions ? <div className="ui-page-hero__actions">{actions}</div> : null}
    </>
  );

  return (
    <section className={`ui-page-hero${image ? " ui-page-hero--with-image" : ""}`}>
      <PageContainer>
        {image ? (
          <div className="ui-page-hero__layout">
            <div className="ui-page-hero__content">{content}</div>
            <Image
              src={image.src}
              alt={image.alt}
              width={720}
              height={480}
              className="ui-page-hero__image"
              priority
              sizes="(max-width: 760px) 100vw, 46vw"
            />
          </div>
        ) : content}
      </PageContainer>
    </section>
  );
}
