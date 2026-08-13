import Image from "next/image";

import { cn } from "@/lib/utils";

type IconScoutName =
  | "add"
  | "calendar"
  | "chevron"
  | "close"
  | "global"
  | "library"
  | "manage"
  | "menu"
  | "new"
  | "search";

const assets: Record<IconScoutName, string> = {
  add: "/iconscout/add.png",
  calendar: "/iconscout/calendar.png",
  chevron: "/iconscout/chevron.png",
  close: "/iconscout/close.png",
  global: "/iconscout/global.png",
  library: "/iconscout/library.png",
  manage: "/iconscout/manage.png",
  menu: "/iconscout/menu.png",
  new: "/iconscout/new.png",
  search: "/iconscout/search.png",
};

export function IconScoutIcon({
  name,
  className,
  alt = "",
}: {
  name: IconScoutName;
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src={assets[name]}
      alt={alt}
      width={24}
      height={24}
      aria-hidden={alt ? undefined : true}
      className={cn("object-contain brightness-0 invert", className)}
      unoptimized
    />
  );
}

export type { IconScoutName };
