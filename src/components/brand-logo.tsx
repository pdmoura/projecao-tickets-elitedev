import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  priority?: boolean;
};

export function BrandLogo({
  className,
  inverse = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      alt="Projeção"
      className={className}
      height={58}
      priority={priority}
      src={inverse ? "/brand/logo-inverse.svg" : "/brand/logo.svg"}
      width={184}
    />
  );
}
