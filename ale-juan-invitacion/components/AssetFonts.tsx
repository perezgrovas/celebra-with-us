"use client";
import { useEffect } from "react";
import type { Asset } from "@/lib/types";
export default function AssetFonts({ assets }: { assets: Asset[] }) {
  useEffect(() => {
    let active = true;
    const loaded: FontFace[] = [];
    for (const asset of assets.filter(
      (a) => a.kind === "font" && a.family && /^https:\/\//.test(a.url),
    )) {
      const face = new FontFace(
        asset.family!,
        `url(${JSON.stringify(asset.url)})`,
      );
      face
        .load()
        .then((font) => {
          if (active) {
            document.fonts.add(font);
            loaded.push(font);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      loaded.forEach((font) => document.fonts.delete(font));
    };
  }, [assets]);
  return null;
}
