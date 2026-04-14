import { z } from "zod";

export const BlockTrigger = z.enum(["slide", "always", "manual"]);
export const BlockLayout = z.enum([
  "default",
  "centered",
  "wide",
  "compact",
  "terminal",
]);
export const BlockTerminalVariant = z.enum(["neutral", "success", "danger"]);
export const BlockImagePosition = z.enum([
  "top",
  "bottom",
  "left",
  "right",
  "full",
  "background",
]);
export const BlockFontSize = z.enum(["sm", "base", "lg", "xl"]);

export const BlockCreate = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().max(20_000),
  trigger: BlockTrigger,
  slideNumber: z.number().int().min(1).max(999).optional(),
  layout: BlockLayout.default("default"),
  imagePosition: BlockImagePosition.default("top"),
  fontSize: BlockFontSize.default("base"),
  imageS3Key: z.string().max(512).optional(),
  imageUrl: z
    .string()
    .max(1024)
    .refine((s) => s === "" || /^https:\/\//.test(s), "https:// required")
    .optional(),
  imageCaption: z.string().max(280).optional(),
  terminalVariant: BlockTerminalVariant.optional(),
  terminalLabel: z.string().max(60).optional(),
});
export type BlockCreate = z.infer<typeof BlockCreate>;

export const BlockUpdate = BlockCreate.partial();
export type BlockUpdate = z.infer<typeof BlockUpdate>;
