import Image from "next/image";

type BrandLogoProps = {
  priority?: boolean;
};

export function BrandLogo({ priority = false }: BrandLogoProps) {
  return (
    <Image
      alt="Projeção"
      height={44}
      priority={priority}
      src="/brand/logo.svg"
      width={184}
    />
  );
}
