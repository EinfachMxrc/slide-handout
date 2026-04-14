import { defaultSchema } from "rehype-sanitize";

// rehype-sanitize re-uses hast-util-sanitize's Schema type but doesn't re-export
// it. We infer the structural type from defaultSchema.
type Schema = typeof defaultSchema;

/**
 * Restriktives Schema basierend auf rehype-sanitize Defaults.
 *
 * Erlaubt: Standard-Markdown-Elemente, GFM-Tabellen, `<pre>/<code>` mit
 * Sprach-ClassName, `<img>` nur https.
 *
 * Verboten: alle Event-Handler-Attribute, `javascript:`-URLs, `<script>`,
 * `<iframe>`, `<style>`.
 */
export const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    div: [...(defaultSchema.attributes?.div ?? []), ["className"]],
    img: [
      ["src", /^https:\/\//],
      "alt",
      "title",
      ["loading", "lazy", "eager"],
      "width",
      "height",
    ],
    a: [
      ["href", /^https?:\/\//],
      "title",
      ["target", "_blank"],
      ["rel", "noopener", "noreferrer"],
    ],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["https"],
  },
  tagNames: (defaultSchema.tagNames ?? []).filter(
    (t) => !["iframe", "object", "embed", "style"].includes(t),
  ),
};
