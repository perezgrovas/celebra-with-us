import { z } from "zod";
import { designSchema, defaultDesign } from "./design";
import { fromZonedTime } from "date-fns-tz";

export const sectionLabels = {
  hero: "Portada",
  countdown: "Cuenta regresiva",
  story: "Nuestra historia",
  gallery: "Fotos",
  schedule: "Itinerario",
  location: "Ubicación",
  dresscode: "Vestimenta",
  lodging: "Hospedaje",
  gifts: "Regalos",
  rsvp: "Confirmación",
  final: "Despedida",
  video: "Video",
} as const;
export type SectionKey = keyof typeof sectionLabels;
const text = z.string().trim().max(4000);
const url = z
  .string()
  .max(2000)
  .refine((v) => !v || /^https:\/\//i.test(v), "Usa un enlace con https://");
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Usa un color hexadecimal");
export const configSchema = z
  .object({
    couple: z.object({
      bride: text.min(1).max(120),
      groom: text.min(1).max(120),
      date: z.string().date("Fecha inválida"),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      timezone: z.string().refine((v) => {
        try {
          new Intl.DateTimeFormat("es", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Zona horaria inválida"),
      venue: text,
      city: text,
    }),
    colors: z.object({
      bg: color,
      text: color,
      accent: color,
      soft: color,
      button: color,
    }),
    fonts: z.object({
      title: z.string().max(100),
      subtitle: z.string().max(100),
      body: z.string().max(100),
      button: z.string().max(100),
    }),
    background: z.enum(["ivory", "paper", "linen", "sage", "blush"]),
    backgroundAssetId: z.string().uuid().nullable(),
    backgroundMode: z.enum(["cover", "repeat"]),
    sections: z
      .array(
        z.object({
          key: z.enum(
            Object.keys(sectionLabels) as [SectionKey, ...SectionKey[]],
          ),
          enabled: z.boolean(),
        }),
      )
      .min(11)
      .max(12)
      .refine(
        (a) => new Set(a.map((s) => s.key)).size === a.length,
        "Cada sección debe aparecer una sola vez",
      ),
    design: designSchema.default(defaultDesign),
    content: z.object({
      storyTitle: text,
      story: text,
      dresscode: text,
      lodging: text,
      gifts: text,
      giftsUrl: url,
      mapUrl: url,
      final: text,
    }),
    schedule: z
      .array(
        z.object({
          time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          label: text.min(1),
        }),
      )
      .max(20),
    gallery: z.array(z.string().uuid()).max(30),
    heroAssetId: z.string().uuid().nullable(),
    rsvp: z.object({
      deadline: z.string().date("Fecha inválida"),
      allowChanges: z.boolean(),
      showTables: z.boolean(),
    }),
  })
  .superRefine((c, ctx) => {
    if (
      !Number.isFinite(
        fromZonedTime(
          `${c.couple.date}T${c.couple.time}:00`,
          c.couple.timezone,
        ).getTime(),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["couple", "date"],
        message: "Fecha inválida",
      });
  });
export type WeddingConfig = z.infer<typeof configSchema>;
export const defaultConfig: WeddingConfig = {
  design: defaultDesign,
  couple: {
    bride: "Ale",
    groom: "Juan",
    date: "2027-03-06",
    time: "16:00",
    timezone: "America/Mexico_City",
    venue: "Hacienda San Antonio Arenillas",
    city: "Puebla, México",
  },
  colors: {
    bg: "#F7F1E8",
    text: "#893F04",
    accent: "#C67F43",
    soft: "#DDB8A6",
    button: "#7B876D",
  },
  fonts: {
    title: "Georgia",
    subtitle: "Arial",
    body: "Arial",
    button: "Arial",
  },
  background: "paper",
  backgroundAssetId: null,
  backgroundMode: "repeat",
  sections: (Object.keys(sectionLabels) as SectionKey[]).map((key) => ({
    key,
    enabled: key !== "video",
  })),
  content: {
    storyTitle: "8 años juntos y contando",
    story:
      "De roomies en el Caribe a construir una vida juntos. Queremos celebrar este siguiente capítulo rodeados de nuestra gente favorita.",
    dresscode:
      "Formal cómodo, para jardín. Vestido largo o ¾; traje o lino. Corbata opcional. Trae zapatos cómodos o un par extra. Solo adultos.",
    lodging:
      "Te recomendamos hospedarte en la zona de Angelópolis. Próximamente compartiremos nuestras opciones favoritas.",
    gifts:
      "Tu presencia es el mejor regalo. Si quieres tener un detalle con nosotros, pronto encontrarás aquí las opciones.",
    giftsUrl: "",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Hacienda+San+Antonio+Arenillas+Puebla",
    final: "Nos hace mucha ilusión compartir este día contigo.",
  },
  schedule: [
    { time: "16:00", label: "Ceremonia religiosa" },
    { time: "17:00", label: "Cóctel y ceremonia civil" },
    { time: "18:15", label: "Entrada al banquete" },
    { time: "20:00", label: "Fiesta" },
  ],
  gallery: [],
  heroAssetId: null,
  rsvp: { deadline: "2027-02-06", allowChanges: true, showTables: false },
};
export function eventInstant(config: WeddingConfig) {
  return fromZonedTime(
    `${config.couple.date}T${config.couple.time}:00`,
    config.couple.timezone,
  ).toISOString();
}
export function formatDate(config: WeddingConfig) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: config.couple.timezone,
  }).format(new Date(eventInstant(config)));
}
