/**
 * A single SVG element as data, not a string — this is the real fix behind
 * porting the ATS prototype's drawing functions: Python pushed raw SVG
 * template-literal strings into a shared *mutable module-level list*
 * (`parts = []`), which only works for a script that runs once and exits.
 * A renderer a long-running MCP server calls repeatedly can't share that
 * model safely. Every primitive/box function here instead returns plain
 * data; nothing is serialized until serializeNodes() is called once, by
 * the caller, on the full assembled list.
 */
export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  /** Text content for a leaf node like <text>. Escaped at serialization
   * time — callers pass the raw string, never pre-escaped. */
  text?: string;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function serializeNode(node: SvgNode): string {
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
  if (node.text !== undefined) {
    return `<${node.tag}${attrs}>${escapeXml(node.text)}</${node.tag}>`;
  }
  return `<${node.tag}${attrs}/>`;
}

export function serializeNodes(nodes: SvgNode[]): string {
  return nodes.map(serializeNode).join("\n");
}
