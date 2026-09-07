import { Icon } from "./icons";

export function ProductArtwork({ tone, icon, compact = false }: { tone: string; icon: string; compact?: boolean }) {
  return (
    <div className={`product-artwork tone-${tone} ${compact ? "compact" : ""}`} aria-hidden="true">
      <span className="product-placeholder-icon"><Icon name={icon} size={compact ? 28 : 48} strokeWidth={1.45} /></span>
      <small>Imagem ilustrativa</small>
    </div>
  );
}
