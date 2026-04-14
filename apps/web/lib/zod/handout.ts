import { z } from "zod";

export const HexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Hex color expected");

export const HttpsUrl = z
  .string()
  .refine((s) => s === "" || /^https:\/\//.test(s), "https:// required")
  .max(1024);

export const HandoutCreate = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000),
});
export type HandoutCreate = z.infer<typeof HandoutCreate>;

export const HandoutUpdate = z
  .object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000),
    accentColor: HexColor.or(z.literal("")),
    coverImageUrl: HttpsUrl,
    logoUrl: HttpsUrl,
    fontFamily: z.enum(["sans", "serif", "mono"]),
    readerTheme: z.enum(["auto", "light", "dark"]),
    footerMarkdown: z.string().max(2000),
  })
  .partial();
export type HandoutUpdate = z.infer<typeof HandoutUpdate>;
