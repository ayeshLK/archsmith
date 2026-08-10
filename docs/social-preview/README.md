# ArchSmith social preview and launch kit

[`archsmith-social-preview.png`](archsmith-social-preview.png) is the repository's GitHub social preview. It is an opaque 1280×640 PNG, matching GitHub's recommended size and staying below the 1 MB upload limit. [`archsmith-social-preview.svg`](archsmith-social-preview.svg) is the editable source and embeds the real `examples/ticket-booking/diagram.svg` render.

The image distills ArchSmith's real five-column diagram convention into a small-card composition: inbound actors, ingress, the wider core platform, egress, and external systems. Its colors come from the standard registry and the rendered `ticket-booking` example:

- navy `#182449`
- mint `#D9F2EC`
- purple `#5B3A9E`
- teal `#177F6B`
- amber `#92600E`

## Upload and verify

1. Open the repository **Settings** page.
2. Under **Social preview**, choose **Edit → Upload an image…** and select `archsmith-social-preview.png`.
3. Share the repository URL in a link-preview debugger or a private message and confirm that the full wordmark, descriptor, and five columns remain visible.
4. Check both a wide preview and a small mobile card. The background is deliberately opaque so the result does not depend on a platform's light or dark mode.

GitHub currently accepts PNG, JPG, or GIF previews under 1 MB and recommends 1280×640 for best display. Recheck [GitHub's social-preview documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview) before replacing the asset.

## Generation brief

The initial composition was explored with OpenAI image generation, then rebuilt as the editable SVG source so its text stays exact and its diagram is a real ArchSmith render. Keep this brief with the asset so future revisions can retain the same intent:

```text
Use case: ads-marketing
Asset type: GitHub repository social preview, exact 2:1 landscape composition designed for 1280×640
Primary request: create a polished, restrained social-preview concept for the open-source developer tool ArchSmith, which turns validated JSON into consistent SVG architecture diagrams
Scene/backdrop: solid deep navy #182449 backdrop with a subtle structured technical grid
Subject: the exact wordmark “ArchSmith” and a clean five-column layered architecture diagram motif made of rounded rectangular boxes and swimlanes, with two narrow gateway columns around a wide central platform column
Style/medium: crisp flat technical editorial design; vector-like geometry; professional open-source developer-tool branding
Composition/framing: 2:1 landscape; large wordmark and short descriptor on the left; recognizable five-column architecture diagram motif on the right; generous safe margins; readable at small link-card size
Color palette: #182449 navy, white, #D9F2EC mint, #5B3A9E purple, #177F6B teal, #92600E amber
Text (verbatim): “ArchSmith” and “Validated JSON → consistent SVG architecture diagrams”
Constraints: render only those two text strings, exactly once each and verbatim; no logos other than the ArchSmith wordmark; no trademarks; no code snippets; no invented UI; no people; no photorealism; no watermark; solid opaque background
```

Before committing a replacement, export the source SVG to exactly 1280×640, verify the text character by character, confirm the PNG remains below 1 MB, and inspect it at a small card size. Do not introduce registry colors or diagram structures that ArchSmith does not support.

## Reusable announcement

> ArchSmith turns a validated JSON description of a layered system architecture into a clean, consistent SVG diagram. The renderer is deterministic: the same IR produces the same layout and house style for a human using the CLI or an agent using the MCP server.
>
> Install the CLI and render a diagram:
>
> ```sh
> npm install -g @archsmith/cli
> archsmith validate architecture.archsmith.json
> archsmith render architecture.archsmith.json -o architecture.svg
> ```
>
> Use [Setup ArchSmith](https://github.com/marketplace/actions/setup-archsmith) to run the same validation and rendering in GitHub Actions. See the [ArchSmith repository](https://github.com/ayeshLK/archsmith), the [CLI package](https://www.npmjs.com/package/@archsmith/cli), the [MCP server package](https://www.npmjs.com/package/@archsmith/mcp-server), and a [real rendered example](https://github.com/ayeshLK/archsmith/blob/main/examples/ticket-booking/diagram.svg).

For an Actions-focused announcement, append this workflow excerpt and attach the generated `architecture.svg` artifact or a screenshot from the completed run:

```yaml
- uses: ayeshLK/setup-archsmith@v0
  with:
    version: "latest"
- run: archsmith validate architecture.archsmith.json
- run: archsmith render architecture.archsmith.json -o architecture.svg
- uses: actions/upload-artifact@v4
  with:
    name: architecture-diagram
    path: architecture.svg
```

Prefer `latest` in introductory material so the snippet does not become stale. Use an exact CLI version and a full action commit SHA in reproducibility- or security-sensitive workflows.
