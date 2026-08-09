import { hueFromString, initials } from "@/lib/format";

interface AvatarProps {
  name: string | null | undefined;
  size?: number;
}

/** Initials avatar with a stable, name-derived brand-adjacent color. */
export function Avatar({ name, size = 38 }: AvatarProps) {
  const hue = hueFromString(name ?? "?");
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.36,
    background: `linear-gradient(135deg, hsl(${hue} 42% 34%), hsl(${(hue + 28) % 360} 48% 46%))`,
  };
  return (
    <span className="ui-avatar" style={style} aria-hidden>
      {initials(name)}
    </span>
  );
}
