import Link from "next/link";

type Chip = {
  label: string;
  href: string;
};

export default function NeighborhoodChips({ chips }: { chips: Chip[] }) {
  if (!chips.length) return null;

  return (
    <div className="ui-chips">
      {chips.map((chip) => (
        <Link key={`${chip.href}-${chip.label}`} href={chip.href}>
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
