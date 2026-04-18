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
  if (scope === "hardie_siding") {
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
  if (scope === "all") {
    return sidingMaterial === "hardie"
      ? {
        heading: "Requested material blend",
        included: "Included in this estimate: Roofing + Hardie siding + eavestrough planning baseline, 0% baseline",
        upgrades: [
          "Upgrade option: Malarkey Vista roof + Hardie premium trim, +12% to +20%",
          "Upgrade option: Legacy roof package + enhanced drainage, +20% to +32%",
          "Premium option: Euroshield roof + architectural siding package, +65% to +110%"
        ]
      }
      : {
        heading: "Requested material blend",
        included: "Included in this estimate: Roofing + vinyl siding + eavestrough planning baseline, 0% baseline",
        upgrades: [
          "Upgrade option: UHDZ roof + insulated vinyl blend, +12% to +20%",
          "Upgrade option: Vista roof + premium trim and drainage, +18% to +28%",
          "Premium option: Legacy roof + premium envelope package, +30% to +50%"
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
  const widthRatio = w / image.width;
  const heightRatio = h / image.height;
  const scale = Math.min(widthRatio, heightRatio);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (w - drawWidth) / 2;
  const offsetY = y + (h - drawHeight) / 2;
  page.commands.push(`q ${drawWidth} 0 0 ${drawHeight} ${offsetX} ${offsetY} cm /${image.name} Do Q`);
}

function drawImageCover(page: PdfPageDraft, image: PdfImageRef, x: number, y: number, w: number, h: number) {
  const widthRatio = w / image.width;
  const heightRatio = h / image.height;
  const scale = Math.max(widthRatio, heightRatio);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (w - drawWidth) / 2;
  const offsetY = y + (h - drawHeight) / 2;
  page.commands.push(
    `q ${x} ${y} ${w} ${h} re W n ${drawWidth} 0 0 ${drawHeight} ${offsetX} ${offsetY} cm /${image.name} Do Q`
  );
}

function drawHeader(
  page: PdfPageDraft,
  input: {
    title: string;
    subtitle: string;
    logo?: PdfImageRef | null;
    badge: string;
  }
) {
  const headerTop = PAGE_HEIGHT - 124;
  drawRect(page, 0, headerTop, PAGE_WIDTH, 124, "0.09 0.17 0.41");
  drawRect(page, 0, headerTop - 2, PAGE_WIDTH, 2, "0.81 0.66 0.27");
  if (input.logo) {
    const logoMaxWidth = 108;
    const logoMaxHeight = 48;
    const widthRatio = logoMaxWidth / input.logo.width;
    const heightRatio = logoMaxHeight / input.logo.height;
    const scale = Math.min(widthRatio, heightRatio);
    const logoWidth = input.logo.width * scale;
    const logoHeight = input.logo.height * scale;
    drawImage(page, input.logo, MARGIN, PAGE_HEIGHT - 86, logoWidth, logoHeight);
  }
  drawText(page, input.title, MARGIN + 132, PAGE_HEIGHT - 56, 20, "1 1 1");
  drawText(page, input.subtitle, MARGIN + 132, PAGE_HEIGHT - 78, 10.5, "0.82 0.88 0.98");
  drawRoundedBox(page, PAGE_WIDTH - MARGIN - 132, PAGE_HEIGHT - 90, 132, 30, "0.18 0.29 0.62", "0.18 0.29 0.62");
  drawText(page, input.badge, PAGE_WIDTH - MARGIN - 108, PAGE_HEIGHT - 72, 9, "1 1 1");
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

function appendApiKey(url: string, key: string) {
  if (!url) return url;
  if (url.includes("key=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
}

async function fetchSolarRgbImage(lat: number, lng: number, key: string) {
  try {
    const params = new URLSearchParams({
      "location.latitude": String(lat),
      "location.longitude": String(lng),
      radiusMeters: "80",
      pixelSizeMeters: "0.21",
      view: "FULL_LAYERS",
      requiredQuality: "LOW",
      key
    });
    const response = await fetch(`https://solar.googleapis.com/v1/dataLayers:get?${params.toString()}`, {
      cache: "no-store"
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { rgbUrl?: string };
    if (!payload.rgbUrl) return null;
    return await fetchBuffer(appendApiKey(payload.rgbUrl, key));
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

  const aerialFallbackUrl =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(target)}&zoom=20&size=640x360&maptype=satellite&key=${encodeURIComponent(key)}`
      : `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(target)}&zoom=19&size=640x360&maptype=satellite&key=${encodeURIComponent(key)}`;

  const streetUrl =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(target)}&fov=95&heading=0&pitch=5&key=${encodeURIComponent(key)}`
      : `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${encodeURIComponent(target)}&fov=95&heading=0&pitch=5&key=${encodeURIComponent(key)}`;

  const streetFallbackUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(target)}&zoom=18&size=640x360&maptype=roadmap&markers=color:0x1d4ed8%7C${encodeURIComponent(target)}&key=${encodeURIComponent(key)}`;

  const solarAerial =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? await fetchSolarRgbImage(input.lat, input.lng, key)
      : null;
  const [aerialFallback, streetPrimary] = await Promise.all([fetchBuffer(aerialFallbackUrl), fetchBuffer(streetUrl)]);
  const streetFallback = streetPrimary ? null : await fetchBuffer(streetFallbackUrl);
  const aerial = solarAerial ?? aerialFallback;
  const street = streetPrimary ?? streetFallback;
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

    const headerLogo = logoBuffer ? addImageObject(builder, page1, "Logo", logoBuffer) : null;
    drawHeader(page1, {
      title: "Instant Estimate Summary",
      subtitle: "Estimate only — request a full proposal to lock in scope",
      logo: headerLogo,
      badge: "Customer Estimate"
    });

    drawRoundedBox(page1, MARGIN, PAGE_HEIGHT - 228, CONTENT_WIDTH, 90, "0.94 0.97 1", "0.78 0.84 0.94");
    drawText(page1, `${serviceLabelFromScope(requestedScope)} estimate for`, MARGIN + 14, PAGE_HEIGHT - 166, 10, "0.24 0.36 0.54");
    drawRoundedBox(page1, PAGE_WIDTH - MARGIN - 116, PAGE_HEIGHT - 168, 102, 20, "0.94 0.9 0.63", "0.94 0.9 0.63");
    drawText(page1, "ESTIMATE ONLY", PAGE_WIDTH - MARGIN - 102, PAGE_HEIGHT - 156, 7.8, "0.42 0.33 0.08");
    drawMultiline(page1, estimate.address ?? "your property", MARGIN + 14, PAGE_HEIGHT - 184, 76, 14, 15, "0.07 0.15 0.29");
    drawText(page1, `Quoted planning range: ${fmtCurrency(primaryLow)} - ${fmtCurrency(primaryHigh)}`, MARGIN + 14, PAGE_HEIGHT - 214, 18, "0.05 0.14 0.35");

    let detailsY = PAGE_HEIGHT - 250;
    drawText(page1, "Modeled details", MARGIN, detailsY, 12, "0.16 0.27 0.44");
    detailsY -= 18;
    publicQuoteDisplay.supportingItems.slice(0, 6).forEach((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const cardX = MARGIN + col * ((CONTENT_WIDTH - 12) / 2 + 12);
      const cardY = detailsY - row * 56 - 44;
      drawRoundedBox(page1, cardX, cardY, (CONTENT_WIDTH - 12) / 2, 48, "0.97 0.99 1", "0.84 0.89 0.95");
      drawText(page1, item.label, cardX + 10, cardY + 31, 9, "0.35 0.44 0.56");
      drawText(page1, item.value, cardX + 10, cardY + 13, 11, "0.11 0.2 0.33");
    });

    const imagePanelTop = PAGE_HEIGHT - 488;
    drawText(page1, "Property imagery", MARGIN, imagePanelTop + 12, 12, "0.16 0.27 0.44");

    const aerialRect = { x: MARGIN, y: imagePanelTop - 150, w: (CONTENT_WIDTH - 12) / 2, h: 140 };
    const streetRect = { x: MARGIN + (CONTENT_WIDTH - 12) / 2 + 12, y: imagePanelTop - 150, w: (CONTENT_WIDTH - 12) / 2, h: 140 };

    drawRoundedBox(page1, aerialRect.x, aerialRect.y, aerialRect.w, aerialRect.h, "0.96 0.98 1", "0.82 0.88 0.95");
    drawRoundedBox(page1, streetRect.x, streetRect.y, streetRect.w, streetRect.h, "0.96 0.98 1", "0.82 0.88 0.95");

    if (propertyImages.aerial) {
      const aerial = addImageObject(builder, page1, "AerialImg", propertyImages.aerial);
      if (aerial) drawImageCover(page1, aerial, aerialRect.x + 4, aerialRect.y + 4, aerialRect.w - 8, aerialRect.h - 8);
    } else {
      drawRect(page1, aerialRect.x + 4, aerialRect.y + 4, aerialRect.w - 8, aerialRect.h - 8, "0.9 0.93 0.97");
      drawText(page1, "Aerial view pending", aerialRect.x + 58, aerialRect.y + 72, 10, "0.38 0.45 0.58");
      drawText(page1, "Google Solar API", aerialRect.x + 68, aerialRect.y + 56, 8.5, "0.44 0.5 0.6");
    }

    if (propertyImages.street) {
      const street = addImageObject(builder, page1, "StreetImg", propertyImages.street);
      if (street) drawImageCover(page1, street, streetRect.x + 4, streetRect.y + 4, streetRect.w - 8, streetRect.h - 8);
    } else {
      drawRect(page1, streetRect.x + 4, streetRect.y + 4, streetRect.w - 8, streetRect.h - 8, "0.9 0.93 0.97");
      drawText(page1, "Street view unavailable", streetRect.x + 50, streetRect.y + 66, 9.5, "0.38 0.45 0.58");
    }

    const noteY = imagePanelTop - 176;
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

    const headerLogo2 = logoBuffer ? addImageObject(builder, page2, "Logo2", logoBuffer) : null;
    drawHeader(page2, {
      title: "Materials & Upgrade Options",
      subtitle: "Your quoted system first — upgrades shown as planning ranges",
      logo: headerLogo2,
      badge: "Customer Estimate"
    });

    const material = materialConfig(requestedScope, sidingMaterial);

    drawRoundedBox(page2, MARGIN, PAGE_HEIGHT - 230, CONTENT_WIDTH, 84, "0.95 0.98 1", "0.82 0.88 0.95");
    drawText(page2, "Your quoted material is shown first", MARGIN + 14, PAGE_HEIGHT - 170, 14, "0.14 0.18 0.25");
    drawMultiline(page2, "Upgrade percentages are relative to your quoted base system. Numbers lock in at the proposal stage after site review.", MARGIN + 14, PAGE_HEIGHT - 190, 92, 9.4, 11.5, "0.39 0.44 0.52");

    let upgradeY = PAGE_HEIGHT - 258;
    const [includedLabel, includedDelta] = material.included.split(", ");
    const materialRows = [
      { tag: "Included in this estimate", title: includedLabel.replace("Included in this estimate: ", ""), delta: includedDelta?.replace("baseline", "baseline") ?? "0% baseline" },
      ...material.upgrades.map((upgrade) => {
        const [name, delta] = upgrade.split(", ");
        return {
          tag: name.toLowerCase().includes("premium") ? "Premium option" : "Upgrade option",
          title: name.replace("Upgrade option: ", "").replace("Premium option: ", ""),
          delta: delta ?? ""
        };
      })
    ];

    materialRows.forEach((row) => {
      drawRoundedBox(page2, MARGIN, upgradeY - 54, CONTENT_WIDTH, 50, "1 1 1", "0.83 0.88 0.95");
      drawRoundedBox(page2, MARGIN + 10, upgradeY - 18, 102, 12, row.tag === "Included in this estimate" ? "0.86 0.94 0.87" : "0.92 0.93 0.98", row.tag === "Included in this estimate" ? "0.86 0.94 0.87" : "0.92 0.93 0.98");
      drawText(page2, row.tag, MARGIN + 15, upgradeY - 11, 6.8, "0.28 0.33 0.42");
      drawText(page2, row.title, MARGIN + 12, upgradeY - 34, 14, "0.12 0.16 0.23");
      drawText(page2, row.delta, PAGE_WIDTH - MARGIN - 124, upgradeY - 34, 12.5, "0.14 0.19 0.34");
      upgradeY -= 50;
    });

    drawRoundedBox(page2, MARGIN, 116, CONTENT_WIDTH, 34, "0.93 0.95 0.99", "0.81 0.85 0.94");
    drawText(page2, "Final proposal stage", MARGIN + 12, 136, 11, "0.16 0.2 0.3");
    drawText(page2, "Confirms exact product availability, accessory package selections, and installation sequencing.", MARGIN + 12, 122, 9.2, "0.31 0.37 0.46");

    const headerLogo3 = logoBuffer ? addImageObject(builder, page3, "Logo3", logoBuffer) : null;
    drawHeader(page3, {
      title: "Other Exterior Options",
      subtitle: "Secondary planning ranges for the same property",
      logo: headerLogo3,
      badge: "Customer Estimate"
    });

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
          if (image) drawImageCover(page3, image, x + 4, y + 64, cardWidth - 8, 78);
        } else {
          drawRect(page3, x + 4, y + 64, cardWidth - 8, 78, "0.9 0.93 0.97");
          drawText(page3, "Image unavailable", x + 18, y + 102, 8, "0.4 0.47 0.58");
        }

        drawMultiline(page3, project.title, x + 6, y + 52, 22, 9, 11, "0.14 0.23 0.38");
        const summary = project.summary?.trim() ? project.summary : "See this recent project example.";
        drawMultiline(page3, summary, x + 6, y + 28, 24, 8, 10, "0.28 0.34 0.45");
        drawText(page3, "View project \u2192", x + 6, y + 10, 9, "0.13 0.38 0.72");
        addLink(builder, page3, x + 1, y + 1, cardWidth - 2, 145, project.href);
      }
    }

    drawRoundedBox(page3, MARGIN, 58, (CONTENT_WIDTH - 14) / 2, 48, "0.96 0.97 0.99", "0.82 0.86 0.93");
    drawText(page3, "Useful Links", MARGIN + 12, 88, 12, "0.15 0.2 0.3");
    drawText(page3, "\u2192 Request full proposal", MARGIN + 12, 74, 9.5, "0.18 0.25 0.36");
    drawText(page3, "\u2192 See recent project photos", MARGIN + 12, 62, 9.5, "0.18 0.25 0.36");
    addLink(builder, page3, MARGIN + 10, 70, 160, 12, proposalUrl);
    addLink(builder, page3, MARGIN + 10, 58, 172, 12, canonicalUrl("/projects"));

    const ctaX = MARGIN + (CONTENT_WIDTH - 14) / 2 + 14;
    drawRoundedBox(page3, ctaX, 58, (CONTENT_WIDTH - 14) / 2, 48, "0.1 0.2 0.5", "0.1 0.2 0.5");
    drawText(page3, "Want a locked-in scope?", ctaX + 12, 88, 12, "1 1 1");
    drawRoundedBox(page3, ctaX + 12, 66, (CONTENT_WIDTH - 14) / 2 - 24, 14, "0.84 0.71 0.31", "0.84 0.71 0.31");
    drawText(page3, "Request a full proposal \u2192", ctaX + 78, 70.5, 8.7, "0.12 0.17 0.29");
    addLink(builder, page3, ctaX + 12, 66, (CONTENT_WIDTH - 14) / 2 - 24, 14, proposalUrl);

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
