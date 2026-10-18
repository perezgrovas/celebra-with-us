"use client";
import { useEffect } from "react";
import fonts from "@/lib/font-catalog.json";
export default function FontLibrary({
  families = [],
}: {
  families?: string[];
}) {
  const key = [...new Set(families)].sort().join("|");
  useEffect(() => {
    let active = true;
    const loaded: FontFace[] = [];
    for (const font of fonts.filter((f) => key.split("|").includes(f.family))) {
      const face = new FontFace(
        font.family,
        `url(${JSON.stringify(font.url)})`,
        { display: "swap" },
      );
      face
        .load()
        .then((f) => {
          if (active) {
            document.fonts.add(f);
            loaded.push(f);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      loaded.forEach((f) => document.fonts.delete(f));
    };
  }, [key]);
  return null;
}
