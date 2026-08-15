export function CoverImage({
  url,
  alt,
  className = "",
  placeholderClassName = "h-full w-full",
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} className={`object-cover ${className}`} />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)] ${placeholderClassName}`}
    >
      <span className="font-mono text-[11px] text-[#8B98A5]">Sin foto</span>
    </div>
  );
}
