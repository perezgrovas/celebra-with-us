import { z } from "zod";
export const positionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(5).max(100),
});
export const masks = [
  "none",
  "rounded",
  "arch",
  "circle",
  "oval",
  "heart",
  "diamond",
] as const;
export const sectionDesignSchema = z.object({
  heading: z.string().max(200).optional(),
  layout: z
    .enum([
      "center",
      "split-left",
      "split-right",
      "editorial",
      "photo-background",
      "card",
    ])
    .default("center"),
  align: z.enum(["left", "center", "right"]).default("center"),
  padding: z.number().min(24).max(180).default(64),
  titleSize: z.number().min(24).max(100).default(48),
  bodySize: z.number().min(12).max(28).default(16),
  background: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  imageAssetId: z.string().uuid().nullable().default(null),
  mask: z.enum(masks).default("rounded"),
  fit: z.enum(["cover", "contain"]).default("contain"),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  imageHeight: z.number().min(160).max(850).default(380),
  overlay: z.number().min(0).max(0.85).default(0.25),
  shifts: z
    .record(
      z.string(),
      z.object({
        x: z.number().min(-35).max(35),
        y: z.number().min(-35).max(35),
      }),
    )
    .default({}),
});
export const layerSchema = z.object({
  id: z.string().uuid(),
  section: z.string().max(30),
  kind: z.enum(["text", "doodle", "photo"]),
  text: z.string().max(1000).default(""),
  doodleId: z.string().max(80).optional(),
  assetId: z.string().uuid().optional(),
  font: z.string().max(100).default("Georgia"),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default("#7E8666"),
  size: z.number().min(12).max(120).default(32),
  rotation: z.number().min(-180).max(180).default(0),
  opacity: z.number().min(0.1).max(1).default(1),
  position: positionSchema.default({ x: 75, y: 22, width: 20 }),
  mobile: positionSchema.optional(),
  mask: z.enum(masks).default("none"),
});
export const designSchema = z.object({
  sections: z.record(z.string(), sectionDesignSchema).default({}),
  layers: z.array(layerSchema).max(100).default([]),
  galleryMode: z.enum(["carousel", "grid", "mosaic"]).default("carousel"),
  galleryFit: z.enum(["cover", "contain"]).default("contain"),
  galleryHeight: z.number().min(160).max(700).default(380),
  video: z
    .object({
      assetId: z.string().uuid().nullable().default(null),
      url: z
        .string()
        .max(2000)
        .refine(
          (v) =>
            !v ||
            Boolean(videoEmbed(v)) ||
            /^https:\/\/[^\s]+\.mp4(\?.*)?$/i.test(v),
          "Usa un enlace de YouTube, Vimeo o un archivo MP4 con https://",
        )
        .default(""),
      caption: z.string().max(300).default("Un recuerdo para compartir"),
      posterAssetId: z.string().uuid().nullable().default(null),
    })
    .default({
      assetId: null,
      url: "",
      caption: "Un recuerdo para compartir",
      posterAssetId: null,
    }),
  customPalettes: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        colors: z.object({
          bg: z.string(),
          text: z.string(),
          accent: z.string(),
          soft: z.string(),
          button: z.string(),
        }),
      }),
    )
    .max(12)
    .default([]),
});
export type SectionDesign = z.infer<typeof sectionDesignSchema>;
export type DesignLayer = z.infer<typeof layerSchema>;
export const defaultDesign = designSchema.parse({});
export function sectionDesign(
  config: { design: z.infer<typeof designSchema> },
  key: string,
) {
  return sectionDesignSchema.parse(config.design.sections[key] || {});
}
export function videoEmbed(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
        u.hostname,
      )
    ) {
      const id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : u.pathname.startsWith("/shorts/")
            ? u.pathname.split("/")[2]
            : u.searchParams.get("v");
      if (id && /^[\w-]{11}$/.test(id))
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (
      ["vimeo.com", "www.vimeo.com"].includes(u.hostname) &&
      /^\/\d+$/.test(u.pathname)
    )
      return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
  } catch {}
  return null;
}
export const palettes = [
  {
    name: "Jardín de olivos",
    colors: {
      bg: "#F7F1E8",
      text: "#2C2A26",
      accent: "#7E8666",
      soft: "#DED7CA",
      button: "#344A3D",
    },
  },
  {
    name: "Champagne",
    colors: {
      bg: "#FAF4EA",
      text: "#46372D",
      accent: "#AF9165",
      soft: "#E7D8C2",
      button: "#6D5139",
    },
  },
  {
    name: "Rosa empolvado",
    colors: {
      bg: "#FFF6F4",
      text: "#543D43",
      accent: "#B98993",
      soft: "#ECD3D8",
      button: "#845565",
    },
  },
  {
    name: "Azul porcelana",
    colors: {
      bg: "#F4F7FC",
      text: "#263B55",
      accent: "#7594B7",
      soft: "#D7E2F0",
      button: "#395C83",
    },
  },
  {
    name: "Terracota",
    colors: {
      bg: "#FBF3EB",
      text: "#513B31",
      accent: "#BA7157",
      soft: "#E6CDBB",
      button: "#8E4E3A",
    },
  },
  {
    name: "Marfil y negro",
    colors: {
      bg: "#FAF8F1",
      text: "#222320",
      accent: "#9A8D70",
      soft: "#E0DCD1",
      button: "#222320",
    },
  },
  {
    name: "Lavanda",
    colors: {
      bg: "#F8F5FC",
      text: "#453951",
      accent: "#A18BB9",
      soft: "#E0D6EC",
      button: "#6E5885",
    },
  },
  {
    name: "Vino y pétalos",
    colors: {
      bg: "#FAF3F1",
      text: "#47252D",
      accent: "#9C6473",
      soft: "#E8D2D7",
      button: "#702D41",
    },
  },
  {
    name: "Bautizo cielo",
    colors: {
      bg: "#F5FAFC",
      text: "#375264",
      accent: "#8DB6C8",
      soft: "#DCEBF1",
      button: "#497689",
    },
  },
  {
    name: "Fiesta de colores",
    colors: {
      bg: "#FFF9EE",
      text: "#40334A",
      accent: "#D48775",
      soft: "#F1DCA8",
      button: "#78628C",
    },
  },
  {
    name: "Noche especial",
    colors: {
      bg: "#202736",
      text: "#F4EEE4",
      accent: "#D2B27A",
      soft: "#465063",
      button: "#786342",
    },
  },
  {
    name: "Verde botánico",
    colors: {
      bg: "#F1F5EA",
      text: "#304032",
      accent: "#7A9866",
      soft: "#D5DFC8",
      button: "#476141",
    },
  },
];
