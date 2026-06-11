import Image from "next/image";
import type { ReactNode } from "react";
import PageContainer from "./PageContainer";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  image?: string | {
    src: string;
    alt: string;
    priority?: boolean;
  };
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
  const imageSrc = typeof image === "string" ? image : image?.src;
  const resolvedImageAlt =
    typeof image === "string" ? imageAlt ?? "" : image?.alt ?? imageAlt ?? "";
  const imagePriority = typeof image === "string" ? true : image?.priority;

  return (
    <section className={`ui-page-hero${imageSrc ? " ui-page-hero--with-image" : ""}`}>
      <PageContainer>
        <div className={imageSrc ? "ui-page-hero__layout" : undefined}>
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

          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={resolvedImageAlt}
              width={720}
              height={480}
              className="ui-page-hero__image"
              priority={imagePriority}
            />
          ) : null}
        </div>
      </PageContainer>
    </section>
  );
}
      </PageContainer>
    </section>
  );
}
