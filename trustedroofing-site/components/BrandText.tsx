import type { ReactNode } from "react";

type BrandTextProps = {
  className?: string;
  descriptor?: ReactNode;
};

export default function BrandText({ className, descriptor }: BrandTextProps) {
  const classes = ["brand-text", descriptor ? "brand-text--with-descriptor" : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <span className="brand-text__main">TRUSTED</span>
      {descriptor ? <span className="brand-text__descriptor">{descriptor}</span> : null}
    </span>
  );
}
