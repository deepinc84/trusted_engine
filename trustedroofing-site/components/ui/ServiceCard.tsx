import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  description: string;
};

export default function ServiceCard({ slug, title, description }: Props) {
  return (
    <article className="ui-card ui-card--service">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={`/services/${slug}`}>Learn more about {title}</Link>
    </article>
  );
}
