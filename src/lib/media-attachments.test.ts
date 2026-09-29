import { describe, expect, it } from "vitest";
import {
  classifyMediaAttachment,
  extractMediaAttachments,
  stripMediaAttachmentMarkers,
} from "./media-attachments";

describe("CampusLoop media attachment parser", () => {
  it("extracts relative R2 video markers and removes them from visible text", () => {
    const body =
      "Gymbro 🥰\n\n![video:Campus Video Clip](/api/files/r2/videos/user/2026-09-29/demo.mp4)";

    const parsed = extractMediaAttachments(body);

    expect(parsed.text).toBe("Gymbro 🥰");
    expect(parsed.attachments).toEqual([
      {
        type: "video",
        url: "/api/files/r2/videos/user/2026-09-29/demo.mp4",
        label: "Campus Video Clip",
        size: undefined,
      },
    ]);
    expect(stripMediaAttachmentMarkers(body)).toBe("Gymbro 🥰");
  });

  it("supports absolute R2 media URLs", () => {
    const body =
      "Hello\n\n![Image](https://campusloop.space/api/files/r2/images/user/a.jpg)\n\n![voice:Voice Memo (12s)](https://campusloop.space/api/files/r2/audio/user/a.webm)";

    const parsed = extractMediaAttachments(body);

    expect(parsed.text).toBe("Hello");
    expect(parsed.attachments.map((a) => a.type)).toEqual(["image", "audio"]);
  });

  it("prefers explicit attachment labels over extension heuristics", () => {
    expect(
      classifyMediaAttachment("/api/files/r2/videos/u/a.webm", "video:Campus Video Clip")
    ).toBe("video");
    expect(classifyMediaAttachment("/api/files/r2/audio/u/a.webm", "voice:Voice Memo (12s)")).toBe(
      "audio"
    );
  });

  it("deduplicates identical legacy attachment markers", () => {
    const url = "/api/files/r2/videos/user/2026/demo.mp4";
    const parsed = extractMediaAttachments(
      "Caption\n\n![video:Campus Video Clip](" +
        url +
        ")\n\n![video:Campus Video Clip](" +
        url +
        ")"
    );

    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.text).toBe("Caption");
  });
});
