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
    priority?: boolean;
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
    <section className="ui-page-hero">
      <PageContainer>
        {image ? (
          <div className="ui-page-hero__inner">
            <div className="ui-page-hero__content">{content}</div>
            <div className="ui-page-hero__media">
              <Image
                className="ui-page-hero__image"
                src={image.src}
                alt={image.alt}
                fill
                priority={image.priority}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        ) : (
          content
        )}
      </PageContainer>
    </section>
  );
}
