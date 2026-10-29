import { Icon } from './icons';

type Props = {
  src: string | null; // null = no image → grey placeholder
  alt: string;
  className?: string; // size, e.g. "size-10"
};

// Product photo with a placeholder when there's no image
export function ProductImage({ src, alt, className = 'size-10' }: Props) {
  if (!src) {
    return (
      <span className={`${className} grid shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400`} aria-hidden>
        <Icon name="products" className="size-1/2" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${className} shrink-0 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200`}
    />
  );
}
