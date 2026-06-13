'use client';

export function BulletList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const safeItems = items ?? [];
  if (safeItems.length === 0) return <p className="text-sm text-muted-foreground">N/A</p>;

  return (
    <ul className={`space-y-1.5 ${ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
      {safeItems.map((item: string, i: number) => (
        <li key={i} className="text-sm text-foreground leading-relaxed">
          {item ?? ''}
        </li>
      ))}
    </ul>
  );
}
