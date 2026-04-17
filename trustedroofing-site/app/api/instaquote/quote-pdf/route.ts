import { NextResponse } from "next/server";
import { listProjects, type Project } from "@/lib/db";
import { buildPublicQuoteDisplay } from "@/lib/publicQuoteDisplay";
import { canonicalUrl } from "@/lib/seo";
import { createQuoteResumeToken } from "@/lib/quoteResumeToken";
import { promises as fs } from "fs";
import path from "path";
import zlib from "zlib";

type EstimatePayload = {
  address?: string;
  lat?: number | null;
  lng?: number | null;
  roofAreaSqft?: number;
  roofSquares?: number;
  pitchRatio?: string | null;
  pitchDegrees?: number;
  complexityBand?: string;
  dataSource?: string;
  dataSourceLabel?: string;
  extras?: {
    eavesLf?: number;
    eaves?: { low?: number; high?: number };
    sidingVinyl?: { low?: number; high?: number };
    sidingHardie?: { low?: number; high?: number };
  };
  ranges?: {
    good?: { low?: number; high?: number };
    eaves?: { low?: number; high?: number };
  };
};

type ProjectCard = {
  title: string;
  summary: string;
  imageUrl: string;
  href: string;
};

type PdfImageRef = { name: string; width: number; height: number };

type PdfPageDraft = {
  commands: string[];
  xObjects: Record<string, number>;
  annotations: number[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function fmtCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `$${Math.round(value).toLocaleString()}`;
}

function serviceLabelFromScope(scope: string) {
  if (scope === "vinyl_siding") return "Vinyl siding";
  if (scope === "hardie_siding") return "Hardie siding";
  if (scope === "eavestrough") return "Eavestrough";
  if (scope === "all") return "Full exterior";
  return "Roofing";
}

function serviceSlugFromScope(scope: string) {
  if (scope.includes("siding")) return "siding";
  if (scope === "eavestrough") return "gutters";
  return "roofing";
}

function materialConfig(scope: string, sidingMaterial: "vinyl" | "hardie") {
  if (scope === "hardie_siding" || sidingMaterial === "hardie") {
    return {
      heading: "Requested material",
      included: "Included in this estimate: James Hardie lap siding, 0% baseline",
      upgrades: [
        "Upgrade option: Hardie Architectural Collection, +12% to +20%",
        "Upgrade option: Premium trim package, +8% to +14%",
        "Upgrade option: Enhanced weather barrier package, +6% to +10%"
      ]
    };
  }
  if (scope === "vinyl_siding") {
    return {
      heading: "Requested material",
      included: "Included in this estimate: Premium vinyl siding system, 0% baseline",
      upgrades: [
        "Upgrade option: Insulated vinyl panel package, +10% to +16%",
        "Upgrade option: Premium trim and accents, +7% to +13%",
        "Upgrade option: Designer profile blend, +12% to +20%"
      ]
    };
  }
  if (scope === "eavestrough") {
    return {
      heading: "Requested system",
      included: "Included in this estimate: Seamless aluminum eavestrough system, 0% baseline",
      upgrades: [
        "Upgrade option: Oversized downspout package, +8% to +14%",
        "Upgrade option: Premium gutter guard package, +16% to +24%",
        "Upgrade option: Heavy-gauge aluminum profile, +12% to +20%"
      ]
    };
  }
  return {
    heading: "Requested system",
    included: "Included in this estimate: GAF Timberline HDZ, 0% baseline",
    upgrades: [
      "Upgrade option: GAF Timberline UHDZ, +8% to +14%",
      "Upgrade option: Malarkey Vista, +10% to +18%",
      "Upgrade option: Malarkey Legacy, +18% to +30%",
      "Premium option: Euroshield rubber roofing, +85% to +140%"
    ]
  };
}

function otherOptions(scope: string, estimate: EstimatePayload) {
  const ranges = [
    {
      key: "roofing",
      title: "Roofing planning range",
      value: `${fmtCurrency(estimate.ranges?.good?.low)} - ${fmtCurrency(estimate.ranges?.good?.high)}`
    },
    {
      key: "vinyl_siding",
      title: "Vinyl siding planning range",
      value: `${fmtCurrency(estimate.extras?.sidingVinyl?.low)} - ${fmtCurrency(estimate.extras?.sidingVinyl?.high)}`
    },
    {
      key: "hardie_siding",
      title: "Hardie siding planning range",
      value: `${fmtCurrency(estimate.extras?.sidingHardie?.low)} - ${fmtCurrency(estimate.extras?.sidingHardie?.high)}`
    },
    {
      key: "eavestrough",
      title: "Eavestrough planning range",
      value: `${fmtCurrency(estimate.extras?.eaves?.low)} - ${fmtCurrency(estimate.extras?.eaves?.high)}`
    }
  ];

  return ranges.filter((item) => item.key !== scope);
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class PdfBuilder {
  private objects: Buffer[] = [];

  addObject(content: string | Buffer) {
    const id = this.objects.length + 1;
    this.objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content, "binary"));
    return id;
  }

  addStream(dict: string, bytes: Buffer | string) {
    const streamBytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, "binary");
    const body = Buffer.concat([
      Buffer.from(`<< ${dict} /Length ${streamBytes.length} >>\nstream\n`, "binary"),
      streamBytes,
      Buffer.from("\nendstream", "binary")
    ]);
    return this.addObject(body);
  }

  serialize(rootId: number) {
    let file = Buffer.from("%PDF-1.4\n", "binary");
    const offsets = [0];

    this.objects.forEach((object, index) => {
      offsets.push(file.length);
      file = Buffer.concat([
        file,
        Buffer.from(`${index + 1} 0 obj\n`, "binary"),
        object,
        Buffer.from("\nendobj\n", "binary")
      ]);
    });

    const xrefOffset = file.length;
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i += 1) {
      xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    file = Buffer.concat([
      file,
      Buffer.from(
        `${xref}trailer << /Size ${this.objects.length + 1} /Root ${rootId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
        "binary"
      )
    ]);

    return file;
  }
}

function parsePng(buffer: Buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idat: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString("ascii");
    const data = buffer.slice(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (!width || !height || bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) return null;

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const raw = Buffer.alloc(stride * height);

  let src = 0;
  let dst = 0;
  const prevLine = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const line = Buffer.from(inflated.slice(src, src + stride));
    src += stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? line[x - bytesPerPixel] : 0;
      const up = prevLine[x];
      const upLeft = x >= bytesPerPixel ? prevLine[x - bytesPerPixel] : 0;

      if (filter === 1) line[x] = (line[x] + left) & 0xff;
      else if (filter === 2) line[x] = (line[x] + up) & 0xff;
      else if (filter === 3) line[x] = (line[x] + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        line[x] = (line[x] + pred) & 0xff;
      }
    }

    line.copy(raw, dst);
    line.copy(prevLine);
    dst += stride;
  }

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = colorType === 6 ? Buffer.alloc(width * height) : null;

  if (colorType === 6) {
    for (let i = 0, j = 0, a = 0; i < raw.length; i += 4, j += 3, a += 1) {
      rgb[j] = raw[i];
      rgb[j + 1] = raw[i + 1];
      rgb[j + 2] = raw[i + 2];
      if (alpha) alpha[a] = raw[i + 3];
    }
  } else {
    raw.copy(rgb);
  }

  return { width, height, rgb, alpha };
}

function parseJpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const size = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    offset += size + 2;
  }
  return null;
}

function startsWithPng(buffer: Buffer) {
  return buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

function startsWithJpeg(buffer: Buffer) {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
}

function drawText(page: PdfPageDraft, text: string, x: number, y: number, size = 11, color = "0 0 0") {
  page.commands.push(`BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function drawMultiline(page: PdfPageDraft, text: string, x: number, y: number, maxChars: number, size = 11, leading = 14, color = "0 0 0") {
  const lines = wrapText(text, maxChars);
  lines.forEach((line, index) => drawText(page, line, x, y - index * leading, size, color));
  return lines.length;
}

function drawRect(page: PdfPageDraft, x: number, y: number, w: number, h: number, fillRgb?: string, strokeRgb?: string, lineWidth = 1) {
  const cmds: string[] = ["q"];
  if (fillRgb) cmds.push(`${fillRgb} rg`);
  if (strokeRgb) cmds.push(`${strokeRgb} RG ${lineWidth} w`);
  cmds.push(`${x} ${y} ${w} ${h} re`);
  if (fillRgb && strokeRgb) cmds.push("B");
  else if (fillRgb) cmds.push("f");
  else if (strokeRgb) cmds.push("S");
  cmds.push("Q");
  page.commands.push(cmds.join("\n"));
}

function drawRoundedBox(page: PdfPageDraft, x: number, y: number, w: number, h: number, fillRgb: string, strokeRgb: string) {
  drawRect(page, x, y, w, h, fillRgb, strokeRgb, 1);
}

function addLink(builder: PdfBuilder, page: PdfPageDraft, x: number, y: number, w: number, h: number, url: string) {
  const annotationId = builder.addObject(
    `<< /Type /Annot /Subtype /Link /Rect [${x} ${y} ${x + w} ${y + h}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfText(url)}) >> >>`
  );
  page.annotations.push(annotationId);
}

function drawImage(page: PdfPageDraft, image: PdfImageRef, x: number, y: number, w: number, h: number) {
  page.commands.push(`q ${w} 0 0 ${h} ${x} ${y} cm /${image.name} Do Q`);
}

async function fetchBuffer(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function fetchPropertyImages(input: { lat?: number | null; lng?: number | null; address?: string }) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return { aerial: null as Buffer | null, street: null as Buffer | null };

  const target =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `${input.lat},${input.lng}`
      : (input.address ?? "").trim();

  if (!target) return { aerial: null as Buffer | null, street: null as Buffer | null };

  const aerialUrl =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(target)}&zoom=20&size=640x360&maptype=satellite&key=${encodeURIComponent(key)}`
      : `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(target)}&zoom=19&size=640x360&maptype=satellite&key=${encodeURIComponent(key)}`;

  const streetUrl =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(target)}&fov=95&heading=0&pitch=5&key=${encodeURIComponent(key)}`
      : `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(target)}&fov=95&heading=0&pitch=5&key=${encodeURIComponent(key)}`;

  const [aerial, street] = await Promise.all([fetchBuffer(aerialUrl), fetchBuffer(streetUrl)]);
  return { aerial, street };
}

function projectHasImage(project: Project) {
  return Boolean(project.photos?.[0]?.public_url);
}

async function selectRelatedProjects(scope: string): Promise<ProjectCard[]> {
  const primaryService = serviceSlugFromScope(scope);
  const primary = await listProjects({ service_slug: primaryService, include_unpublished: false, limit: 8 });
  const secondary = await listProjects({ include_unpublished: false, limit: 20 });

  const combined = [...primary, ...secondary]
    .filter((project, index, array) => array.findIndex((candidate) => candidate.id === project.id) === index)
    .filter((project) => project.is_published && projectHasImage(project));

  return combined.slice(0, 3).map((project) => ({
    title: project.title,
    summary: project.summary,
    imageUrl: project.photos?.[0]?.public_url ?? "",
    href: canonicalUrl(`/projects/${project.slug}`)
  }));
}

function addImageObject(builder: PdfBuilder, page: PdfPageDraft, imageName: string, buffer: Buffer): PdfImageRef | null {
  if (startsWithJpeg(buffer)) {
    const dimensions = parseJpegDimensions(buffer);
    if (!dimensions) return null;
    const objectId = builder.addStream(
      `/Type /XObject /Subtype /Image /Width ${dimensions.width} /Height ${dimensions.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
      buffer
    );
    page.xObjects[imageName] = objectId;
    return { name: imageName, width: dimensions.width, height: dimensions.height };
  }

  if (startsWithPng(buffer)) {
    const png = parsePng(buffer);
    if (!png) return null;
    const compressedRgb = zlib.deflateSync(png.rgb);
    let smaskRef = "";

    if (png.alpha) {
      const compressedAlpha = zlib.deflateSync(png.alpha);
      const alphaId = builder.addStream(
        `/Type /XObject /Subtype /Image /Width ${png.width} /Height ${png.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`,
        compressedAlpha
      );
      smaskRef = ` /SMask ${alphaId} 0 R`;
    }

    const imageId = builder.addStream(
      `/Type /XObject /Subtype /Image /Width ${png.width} /Height ${png.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode${smaskRef}`,
      compressedRgb
    );
    page.xObjects[imageName] = imageId;
    return { name: imageName, width: png.width, height: png.height };
  }

  return null;
}

async function loadLogo() {
  try {
    return await fs.readFile(path.join(process.cwd(), "public", "full_white_new2.png"));
  } catch {
    return null;
  }
}

function beginPage(): PdfPageDraft {
  return { commands: [], xObjects: {}, annotations: [] };
}

function finalizeDocument(builder: PdfBuilder, pages: PdfPageDraft[]) {
  const fontId = builder.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const contentId = builder.addStream("", page.commands.join("\n"));
    const xObjectEntries = Object.entries(page.xObjects)
      .map(([name, id]) => `/${name} ${id} 0 R`)
      .join(" ");
    const annots = page.annotations.length
      ? `/Annots [${page.annotations.map((id) => `${id} 0 R`).join(" ")}]`
      : "";

    const resources = `<< /Font << /F1 ${fontId} 0 R >>${xObjectEntries ? ` /XObject << ${xObjectEntries} >>` : ""} >>`;
    const pageId = builder.addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources ${resources} /Contents ${contentId} 0 R ${annots} >>`
    );
    pageIds.push(pageId);
  });

  const pagesId = builder.addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

  pageIds.forEach((pageId) => {
    const raw = builder["objects"][pageId - 1].toString("binary").replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
    builder["objects"][pageId - 1] = Buffer.from(raw, "binary");
  });

  const catalogId = builder.addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  return builder.serialize(catalogId);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const estimate = (body.estimate ?? {}) as EstimatePayload;
    const requestedScope = String(body.requestedScope ?? "roofing");
    const primaryLow = Number(body.primaryLow ?? 0);
    const primaryHigh = Number(body.primaryHigh ?? 0);
    const sidingMaterial = (body.sidingMaterial === "hardie" ? "hardie" : "vinyl") as "vinyl" | "hardie";

    const publicQuoteDisplay = buildPublicQuoteDisplay({
      selectedScope: requestedScope,
      roofAreaSqft: estimate.roofAreaSqft,
      roofSquares: estimate.roofSquares,
      pitchRatio: estimate.pitchRatio,
      pitchDegrees: estimate.pitchDegrees,
      complexityBand: estimate.complexityBand,
      dataSource: estimate.dataSource,
      dataSourceLabel: estimate.dataSourceLabel,
      eavesLengthLf: estimate.extras?.eavesLf,
      stories: 2,
      material: requestedScope === "hardie_siding"
        ? "Hardie board"
        : requestedScope === "vinyl_siding"
          ? "Vinyl siding"
          : undefined
    });

    const quoteResumeToken = createQuoteResumeToken({
      requestedScope,
      sidingMaterial,
      estimate: estimate as unknown as Record<string, unknown>
    });

    const proposalUrl = canonicalUrl(`/online-estimate?resume=${encodeURIComponent(quoteResumeToken)}`);
    const projects = await selectRelatedProjects(requestedScope);
    const [propertyImages, logoBuffer] = await Promise.all([
      fetchPropertyImages({ lat: estimate.lat, lng: estimate.lng, address: estimate.address }),
      loadLogo()
    ]);

    const builder = new PdfBuilder();
    const page1 = beginPage();
    const page2 = beginPage();
    const page3 = beginPage();

    drawRect(page1, 0, PAGE_HEIGHT - 130, PAGE_WIDTH, 130, "0.07 0.12 0.25");
    drawText(page1, "Trusted Roofing & Exteriors", MARGIN + 90, PAGE_HEIGHT - 62, 22, "1 1 1");
    drawText(page1, "Instant estimate summary", MARGIN + 90, PAGE_HEIGHT - 88, 12, "0.76 0.86 1");

    if (logoBuffer) {
      const logo = addImageObject(builder, page1, "Logo", logoBuffer);
      if (logo) drawImage(page1, logo, MARGIN, PAGE_HEIGHT - 95, 78, 45);
    }

    drawRoundedBox(page1, MARGIN, PAGE_HEIGHT - 220, CONTENT_WIDTH, 78, "0.94 0.97 1", "0.78 0.84 0.94");
    drawText(page1, "ESTIMATE ONLY", MARGIN + 14, PAGE_HEIGHT - 165, 9, "0.13 0.33 0.62");
    drawText(page1, `${serviceLabelFromScope(requestedScope)} estimate for ${estimate.address ?? "your property"}`, MARGIN + 14, PAGE_HEIGHT - 188, 14);
    drawText(page1, `Quoted planning range: ${fmtCurrency(primaryLow)} - ${fmtCurrency(primaryHigh)}`, MARGIN + 14, PAGE_HEIGHT - 208, 16, "0.05 0.14 0.35");

    let detailsY = PAGE_HEIGHT - 246;
    drawText(page1, "Modeled details", MARGIN, detailsY, 12, "0.16 0.27 0.44");
    detailsY -= 18;
    publicQuoteDisplay.supportingItems.slice(0, 5).forEach((item) => {
      drawText(page1, `${item.label}: ${item.value}`, MARGIN + 4, detailsY, 10);
      detailsY -= 14;
    });

    const imagePanelTop = PAGE_HEIGHT - 410;
    drawText(page1, "Property imagery", MARGIN, imagePanelTop + 12, 12, "0.16 0.27 0.44");

    const aerialRect = { x: MARGIN, y: imagePanelTop - 150, w: (CONTENT_WIDTH - 12) / 2, h: 140 };
    const streetRect = { x: MARGIN + (CONTENT_WIDTH - 12) / 2 + 12, y: imagePanelTop - 150, w: (CONTENT_WIDTH - 12) / 2, h: 140 };

    drawRoundedBox(page1, aerialRect.x, aerialRect.y, aerialRect.w, aerialRect.h, "0.96 0.98 1", "0.82 0.88 0.95");
    drawRoundedBox(page1, streetRect.x, streetRect.y, streetRect.w, streetRect.h, "0.96 0.98 1", "0.82 0.88 0.95");

    if (propertyImages.aerial) {
      const aerial = addImageObject(builder, page1, "AerialImg", propertyImages.aerial);
      if (aerial) drawImage(page1, aerial, aerialRect.x + 4, aerialRect.y + 4, aerialRect.w - 8, aerialRect.h - 8);
    } else {
      drawText(page1, "Aerial image unavailable", aerialRect.x + 16, aerialRect.y + aerialRect.h / 2, 10, "0.28 0.39 0.54");
    }

    if (propertyImages.street) {
      const street = addImageObject(builder, page1, "StreetImg", propertyImages.street);
      if (street) drawImage(page1, street, streetRect.x + 4, streetRect.y + 4, streetRect.w - 8, streetRect.h - 8);
    } else {
      drawText(page1, "Street view unavailable", streetRect.x + 16, streetRect.y + streetRect.h / 2, 10, "0.28 0.39 0.54");
    }

    const noteY = imagePanelTop - 178;
    drawMultiline(
      page1,
      "This instant quote is a planning estimate. Final proposal pricing confirms exact measurements, material selections, and full scope after review.",
      MARGIN,
      noteY,
      96,
      10,
      13,
      "0.25 0.3 0.4"
    );

    const ctaY = 92;
    drawRoundedBox(page1, MARGIN, ctaY, CONTENT_WIDTH, 42, "0.13 0.37 0.72", "0.13 0.37 0.72");
    drawText(page1, "Request Full Proposal", MARGIN + 18, ctaY + 16, 14, "1 1 1");
    addLink(builder, page1, MARGIN, ctaY, CONTENT_WIDTH, 42, proposalUrl);

    const material = materialConfig(requestedScope, sidingMaterial);
    drawRect(page2, 0, PAGE_HEIGHT - 120, PAGE_WIDTH, 120, "0.1 0.17 0.3");
    drawText(page2, "Material and upgrade options", MARGIN, PAGE_HEIGHT - 62, 20, "1 1 1");
    drawText(page2, "Upgrade percentages are relative to your quoted base system.", MARGIN, PAGE_HEIGHT - 86, 11, "0.74 0.85 1");

    drawRoundedBox(page2, MARGIN, PAGE_HEIGHT - 230, CONTENT_WIDTH, 84, "0.95 0.98 1", "0.82 0.88 0.95");
    drawText(page2, material.heading, MARGIN + 14, PAGE_HEIGHT - 168, 11, "0.13 0.33 0.62");
    drawMultiline(page2, material.included, MARGIN + 14, PAGE_HEIGHT - 190, 84, 13, 15);

    let upgradeY = PAGE_HEIGHT - 258;
    material.upgrades.forEach((upgrade) => {
      drawRoundedBox(page2, MARGIN, upgradeY - 42, CONTENT_WIDTH, 38, "1 1 1", "0.83 0.88 0.95");
      drawMultiline(page2, upgrade, MARGIN + 12, upgradeY - 20, 90, 11, 14, "0.13 0.23 0.37");
      upgradeY -= 50;
    });

    drawMultiline(
      page2,
      "Final proposal stage confirms exact product availability, accessory package selections, and installation sequencing.",
      MARGIN,
      120,
      96,
      10,
      13,
      "0.27 0.33 0.44"
    );

    drawRect(page3, 0, PAGE_HEIGHT - 120, PAGE_WIDTH, 120, "0.08 0.16 0.29");
    drawText(page3, "Other exterior options and related projects", MARGIN, PAGE_HEIGHT - 62, 20, "1 1 1");
    drawText(page3, "These are secondary planning ranges for the same property.", MARGIN, PAGE_HEIGHT - 86, 11, "0.74 0.85 1");

    let optionsY = PAGE_HEIGHT - 158;
    otherOptions(requestedScope, estimate).forEach((option) => {
      drawRoundedBox(page3, MARGIN, optionsY - 40, CONTENT_WIDTH, 34, "0.97 0.99 1", "0.84 0.89 0.95");
      drawText(page3, option.title, MARGIN + 10, optionsY - 20, 11, "0.16 0.26 0.42");
      drawText(page3, option.value, MARGIN + 330, optionsY - 20, 11, "0.08 0.16 0.29");
      optionsY -= 44;
    });

    drawText(page3, "Recent related projects", MARGIN, optionsY - 10, 13, "0.16 0.27 0.44");
    optionsY -= 24;

    if (projects.length === 0) {
      drawRoundedBox(page3, MARGIN, optionsY - 64, CONTENT_WIDTH, 58, "0.95 0.98 1", "0.83 0.89 0.95");
      drawText(page3, "More project examples are available on our website.", MARGIN + 14, optionsY - 33, 11, "0.18 0.28 0.43");
      drawText(page3, "See recent work", MARGIN + 14, optionsY - 50, 11, "0.12 0.38 0.72");
      addLink(builder, page3, MARGIN + 12, optionsY - 56, 140, 18, canonicalUrl("/projects"));
    } else {
      const cardWidth = (CONTENT_WIDTH - 20) / 3;
      for (let i = 0; i < projects.length; i += 1) {
        const project = projects[i];
        const x = MARGIN + i * (cardWidth + 10);
        const y = optionsY - 156;
        drawRoundedBox(page3, x, y, cardWidth, 148, "1 1 1", "0.82 0.88 0.95");

        const imageBuffer = await fetchBuffer(project.imageUrl);
        if (imageBuffer) {
          const image = addImageObject(builder, page3, `Proj${i + 1}`, imageBuffer);
          if (image) drawImage(page3, image, x + 4, y + 64, cardWidth - 8, 78);
        }

        drawMultiline(page3, project.title, x + 6, y + 52, 22, 9, 11, "0.14 0.23 0.38");
        const summary = project.summary?.trim() ? project.summary : "See this recent project example.";
        drawMultiline(page3, summary, x + 6, y + 28, 24, 8, 10, "0.28 0.34 0.45");
        drawText(page3, "View project", x + 6, y + 10, 9, "0.13 0.38 0.72");
        addLink(builder, page3, x + 1, y + 1, cardWidth - 2, 145, project.href);
      }
    }

    drawRoundedBox(page3, MARGIN, 64, CONTENT_WIDTH, 32, "0.13 0.37 0.72", "0.13 0.37 0.72");
    drawText(page3, "Request Full Proposal", MARGIN + 16, 76, 12, "1 1 1");
    addLink(builder, page3, MARGIN, 64, CONTENT_WIDTH, 32, proposalUrl);

    const pdf = finalizeDocument(builder, [page1, page2, page3]);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"instant-estimate-${Date.now()}.pdf\"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate PDF." },
      { status: 400 }
    );
  }
}
