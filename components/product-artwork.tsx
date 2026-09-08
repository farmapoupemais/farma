import { Icon } from "./icons";

export function ProductArtwork({
  tone,
  icon,
  compact = false,
  productName,
  brand,
  category,
}: {
  tone: string;
  icon: string;
  compact?: boolean;
  productName?: string;
  brand?: string;
  category?: string;
}) {
  const altDescription = productName
    ? `Item farmacêutico: ${productName}${brand ? ` - ${brand}` : ""}${category ? ` (${category})` : ""}. Procedência garantida Poupe Mais.`
    : "Item do catálogo Farmácia Poupe Mais";

  return (
    <div
      className={`product-artwork tone-${tone} ${compact ? "compact" : ""}`}
      role="img"
      aria-label={altDescription}
    >
      <span className="product-placeholder-icon" aria-hidden="true">
        <Icon name={icon} size={compact ? 28 : 48} strokeWidth={1.45} />
      </span>
      <span className="sr-only">{altDescription}</span>
      <small aria-hidden="true">Procedência verificada</small>
    </div>
  );
}

