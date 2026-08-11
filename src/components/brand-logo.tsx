import Image from "next/image";

type BrandLogoProps = {
  inverse?: boolean;
  priority?: boolean;
};

export function BrandLogo({ inverse = false, priority = false }: BrandLogoProps) {
  return (
    <Image
      alt="Projeção"
      height={44}
      priority={priority}
      src={inverse ? "/brand/logo-inverse.svg" : "/brand/logo.svg"}
      width={184}
    />
  );
}
