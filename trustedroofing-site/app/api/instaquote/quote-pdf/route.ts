import { NextResponse } from "next/server";
import { buildPublicQuoteDisplay } from "@/lib/publicQuoteDisplay";
import { canonicalUrl } from "@/lib/seo";
import { createQuoteResumeToken } from "@/lib/quoteResumeToken";
import { resolvePublicLocation } from "@/lib/serviceAreas";
import {
  getRelatedProjects,
  getServiceSpecificQuoteSignals,
  getSolarSnapshotData,
  buildMonthlySolarProductionSeries,
  type SolarSnapshotData,
  type RelatedProjectCard,
  type ServiceSpecificQuoteSignal
} from "@/lib/instantQuotePdfData";
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
  solarSnapshot?: {
    buildingInsights?: Record<string, unknown> | null;
    dataLayers?: Record<string, unknown> | null;
  } | null;
};

type PdfImageRef = { name: string; width: number; height: number };

type PdfPageDraft = {
  commands: string[];
  xObjects: Record<string, number>;
  annotations: number[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN_X = 40;
const HEADER_H = 96;
const FOOTER_H = 44;
const PAGE_TOP_START = PAGE_HEIGHT - HEADER_H - 18;
const CARD_RADIUS = 12;
const CARD_BORDER_COLOR = "0.82 0.88 0.95";
const CARD_BORDER_WIDTH = 1;
const CARD_PADDING_X = 14;
const CARD_PADDING_Y = 12;
const SECTION_GAP_Y = 12;
const GRID_GAP_X = 10;
const GRID_GAP_Y = 10;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;

function pdfRgbFromHex(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

const COLORS: Record<string, string> = {
  navy: pdfRgbFromHex("#1B2D5B"),
  navyDark: pdfRgbFromHex("#131F4A"),
  navyText: pdfRgbFromHex("#1B2D5B"),
  blueText: pdfRgbFromHex("#374151"),
  accentGold: pdfRgbFromHex("#C8A84B"),
  cardBg: "1 1 1",
  cardSoft: pdfRgbFromHex("#F4F6FA"),
  cardSofter: pdfRgbFromHex("#F4F6FA"),
  border: pdfRgbFromHex("#DDE1EA"),
  textDark: pdfRgbFromHex("#111827"),
  textMid: pdfRgbFromHex("#374151"),
  textSub: pdfRgbFromHex("#6B7280"),
  badgeBlueBg: pdfRgbFromHex("#EEF1F8"),
  badgeBlueFg: pdfRgbFromHex("#1B2D5B"),
  badgeGreenBg: pdfRgbFromHex("#EAF4EC"),
  badgeGreenFg: pdfRgbFromHex("#3A7D44"),
  badgePurpleBg: pdfRgbFromHex("#F5F0FF"),
  badgePurpleFg: pdfRgbFromHex("#7C3AED"),
  badgeAmberBg: pdfRgbFromHex("#FEF3C7"),
  badgeAmberFg: pdfRgbFromHex("#92400E"),
  customerBadgeBg: pdfRgbFromHex("#243672"),
  white: "1 1 1"
};
const MARGIN = PAGE_MARGIN_X;

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

function measureTextWidth(text: string, size: number) {
  return text.length * size * 0.48;
}

function wrapTextByWidth(text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measureTextWidth(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function clampTextLines(text: string, size: number, maxWidth: number, maxLines: number) {
  const wrapped = wrapTextByWidth(text, size, maxWidth);
  if (wrapped.length <= maxLines) return wrapped;

  const clipped = wrapped.slice(0, maxLines);
  let finalLine = clipped[maxLines - 1] ?? "";
  const ellipsis = "…";
  while (finalLine.length > 0 && measureTextWidth(`${finalLine}${ellipsis}`, size) > maxWidth) {
    finalLine = finalLine.slice(0, -1);
  }
  clipped[maxLines - 1] = `${finalLine}${ellipsis}`;
  return clipped;
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

function drawText(
  page: PdfPageDraft,
  text: string,
  x: number,
  y: number,
  size = 11,
  color = "0 0 0",
  font: "F1" | "F2" = "F1"
) {
  page.commands.push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function drawTextCentered(
  page: PdfPageDraft,
  text: string,
  centerX: number,
  y: number,
  size = 11,
  color = "0 0 0",
  font: "F1" | "F2" = "F1"
) {
  const width = measureTextWidth(text, size);
  drawText(page, text, centerX - width / 2, y, size, color, font);
}

function drawMultiline(
  page: PdfPageDraft,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 11,
  leading = 14,
  color = "0 0 0",
  font: "F1" | "F2" = "F1"
) {
  const lines = wrapTextByWidth(text, size, maxWidth);
  lines.forEach((line, index) => drawText(page, line, x, y - index * leading, size, color, font));
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
  const r = Math.min(CARD_RADIUS, w / 2, h / 2);
  const k = 0.5522847498;
  const c = r * k;
  const cmds: string[] = ["q"];
  if (fillRgb) cmds.push(`${fillRgb} rg`);
  if (strokeRgb) cmds.push(`${strokeRgb} RG ${CARD_BORDER_WIDTH} w`);
  cmds.push(
    `${x + r} ${y} m`,
    `${x + w - r} ${y} l`,
    `${x + w - r + c} ${y} ${x + w} ${y + r - c} ${x + w} ${y + r} c`,
    `${x + w} ${y + h - r} l`,
    `${x + w} ${y + h - r + c} ${x + w - r + c} ${y + h} ${x + w - r} ${y + h} c`,
    `${x + r} ${y + h} l`,
    `${x + r - c} ${y + h} ${x} ${y + h - r + c} ${x} ${y + h - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c`
  );
  cmds.push(fillRgb && strokeRgb ? "B" : fillRgb ? "f" : "S");
  cmds.push("Q");
  page.commands.push(cmds.join("\n"));
}

function drawCard(page: PdfPageDraft, x: number, y: number, w: number, h: number, fill = COLORS.cardBg) {
  drawRoundedBox(page, x, y, w, h, fill, COLORS.border);
}

function drawStatCell(page: PdfPageDraft, x: number, y: number, w: number, h: number, label: string, value: string) {
  drawCard(page, x, y, w, h, COLORS.cardSofter);
  drawText(page, label.toUpperCase(), x + CARD_PADDING_X, y + h - 15, 6.5, COLORS.textSub, "F1");
  drawText(page, value, x + CARD_PADDING_X, y + 9, 11.5, COLORS.textDark, "F2");
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

function drawMonthlySolarLineChart(
  page: PdfPageDraft,
  x: number,
  y: number,
  w: number,
  h: number,
  monthlyKwh: number[]
) {
  drawCard(page, x, y, w, h, COLORS.cardBg);
  drawText(page, "Estimated annual solar production", x + 12, y + h - 16, 11.2, COLORS.textDark, "F2");
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const plotX = x + 18;
  const plotY = y + 18;
  const plotW = w - 30;
  const plotH = h - 38;
  drawRect(page, plotX, plotY, plotW, 0.6, COLORS.border);
  const maxValue = Math.max(...monthlyKwh, 1);
  const stepX = plotW / (months.length - 1);
  const points = monthlyKwh.map((value, index) => ({
    x: plotX + index * stepX,
    y: plotY + (value / maxValue) * (plotH - 10) + 2
  }));
  page.commands.push(`q ${COLORS.navy} RG 1.6 w`);
  points.forEach((point, index) => {
    page.commands.push(index === 0 ? `${point.x} ${point.y} m` : `${point.x} ${point.y} l`);
  });
  page.commands.push("S Q");
  points.forEach((point, index) => {
    drawRect(page, point.x - 1.6, point.y - 1.6, 3.2, 3.2, COLORS.navy);
    if (index % 2 === 0) drawTextCentered(page, months[index], point.x, plotY - 10, 6.5, COLORS.textSub, "F1");
  });
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
  const headerTop = PAGE_HEIGHT - HEADER_H;
  drawRect(page, 0, headerTop, PAGE_WIDTH, HEADER_H, COLORS.navyDark);
  drawRect(page, 0, headerTop + HEADER_H - 20, PAGE_WIDTH, 20, COLORS.navy);
  drawRect(page, 0, headerTop - 2, PAGE_WIDTH, 2, COLORS.accentGold);
  if (input.logo) {
    const logoMaxWidth = 118;
    const logoMaxHeight = 46;
    const widthRatio = logoMaxWidth / input.logo.width;
    const heightRatio = logoMaxHeight / input.logo.height;
    const scale = Math.min(widthRatio, heightRatio);
    const logoWidth = input.logo.width * scale;
    const logoHeight = input.logo.height * scale;
    drawImage(page, input.logo, MARGIN, PAGE_HEIGHT - 67, logoWidth, logoHeight);
  }
  drawText(page, "TRUSTED ESTIMATE SUMMARY", MARGIN + 124, PAGE_HEIGHT - 30, 7.8, "0.83 0.89 0.98", "F1");
  drawText(page, input.title, MARGIN + 124, PAGE_HEIGHT - 46, 18.5, "1 1 1", "F2");
  drawText(page, input.subtitle, MARGIN + 124, PAGE_HEIGHT - 62, 10, "0.82 0.88 0.98");
  drawRoundedBox(page, PAGE_WIDTH - MARGIN - 124, PAGE_HEIGHT - 72, 124, 24, COLORS.customerBadgeBg, COLORS.customerBadgeBg);
  drawTextCentered(page, input.badge, PAGE_WIDTH - MARGIN - 62, PAGE_HEIGHT - 57, 9, COLORS.white, "F2");
}

function drawFooter(page: PdfPageDraft) {
  drawRect(page, 0, 0, PAGE_WIDTH, FOOTER_H, COLORS.navyDark);
  drawRect(page, 0, FOOTER_H - 1, PAGE_WIDTH, 1, COLORS.accentGold);
  drawText(page, "Trusted Roofing & Exteriors", MARGIN, 16, 9.5, "0.84 0.9 0.98");
  drawText(page, "trustedroofingcalgary.com", PAGE_WIDTH - MARGIN - 150, 16, 9.5, "0.84 0.9 0.98");
  drawText(page, "Estimate planning document", PAGE_WIDTH / 2 - 55, 16, 8.4, "0.7 0.78 0.9");
}

function drawIntroCard(page: PdfPageDraft, yTop: number, title: string, description: string) {
  const h = 72;
  const y = yTop - h;
  drawCard(page, MARGIN, y, CONTENT_WIDTH, h, COLORS.cardSoft);
  drawText(page, title, MARGIN + CARD_PADDING_X, y + h - 24, 13, COLORS.textDark, "F2");
  const lines = clampTextLines(description, 8.5, CONTENT_WIDTH - CARD_PADDING_X * 2, 2);
  lines.forEach((line, i) => drawText(page, line, MARGIN + CARD_PADDING_X, y + h - 41 - i * 11, 8.5, COLORS.textMid));
}

function drawMaterialOptionCard(
  page: PdfPageDraft,
  x: number,
  y: number,
  w: number,
  h: number,
  input: { badgeText: string; badgeFg: string; badgeBg: string; title: string; price: string; desc: string }
) {
  drawCard(page, x, y, w, h, COLORS.cardBg);
  drawRoundedBox(page, x + CARD_PADDING_X, y + h - 23, 118, 14, input.badgeBg, input.badgeBg);
  drawTextCentered(page, input.badgeText, x + CARD_PADDING_X + 59, y + h - 14, 7, input.badgeFg, "F2");
  drawText(page, input.title, x + CARD_PADDING_X, y + h - 40, 13, COLORS.textDark, "F2");
  drawText(page, input.price, x + w - CARD_PADDING_X - 118, y + h - 40, 13, COLORS.navy, "F2");
  const descLines = clampTextLines(input.desc, 8.5, w - CARD_PADDING_X * 2, 2);
  descLines.forEach((line, i) => drawText(page, line, x + CARD_PADDING_X, y + h - 56 - i * 10.5, 8.5, COLORS.textMid));
}

function drawProjectCard(
  page: PdfPageDraft,
  x: number,
  y: number,
  w: number,
  h: number,
  input: { title: string; summary: string; href: string; image?: PdfImageRef | null; location: string; serviceBadge: string; ctaLabel: string },
  builder: PdfBuilder
) {
  const PROJECT_IMAGE_H = 92;
  const PROJECT_TITLE_MAX_LINES = 2;
  const PROJECT_DESC_MAX_LINES = 2;
  const PROJECT_LINK_BOTTOM_OFFSET = 12;
  drawCard(page, x, y, w, h, COLORS.cardBg);
  const imageY = y + h - PROJECT_IMAGE_H - 6;
  if (input.image) drawImageCover(page, input.image, x + 6, imageY, w - 12, PROJECT_IMAGE_H);
  else {
    drawRect(page, x + 6, imageY, w - 12, PROJECT_IMAGE_H, "0.9 0.93 0.97");
    drawText(page, "Image unavailable", x + 16, imageY + PROJECT_IMAGE_H / 2, 8, "0.4 0.47 0.58");
  }
  drawRoundedBox(page, x + CARD_PADDING_X, imageY - 14, 74, 12, COLORS.badgeBlueBg, COLORS.badgeBlueBg);
  drawTextCentered(page, input.serviceBadge, x + CARD_PADDING_X + 37, imageY - 10.5, 6.5, COLORS.badgeBlueFg, "F2");
  const textW = w - CARD_PADDING_X * 2;
  const titleLines = clampTextLines(input.title, 9.8, textW, PROJECT_TITLE_MAX_LINES);
  titleLines.forEach((line, i) => drawText(page, line, x + CARD_PADDING_X, y + 76 - i * 11, 9.8, COLORS.navyText));
  drawText(page, input.location, x + CARD_PADDING_X, y + 56, 7.8, COLORS.textSub);
  const descLines = clampTextLines(input.summary, 8.4, textW, PROJECT_DESC_MAX_LINES);
  descLines.forEach((line, i) => drawText(page, line, x + CARD_PADDING_X, y + 42 - i * 10, 8.4, COLORS.blueText));
  drawText(page, `${input.ctaLabel} →`, x + CARD_PADDING_X, y + PROJECT_LINK_BOTTOM_OFFSET, 9, "0.13 0.38 0.72");
  addLink(builder, page, x + 2, y + 2, w - 4, h - 4, input.href);
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

function buildStreetViewUrl(input: {
  key: string;
  location: string;
  heading?: number;
  fov?: number;
  pitch?: number;
  size?: string;
}) {
  const params = new URLSearchParams({
    size: input.size ?? "1280x720",
    location: input.location,
    fov: String(input.fov ?? 58),
    heading: String(input.heading ?? 20),
    pitch: String(input.pitch ?? -8),
    key: input.key
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

function buildSatelliteStaticMapUrl(input: {
  key: string;
  center: string;
  zoom?: number;
  size?: string;
  scale?: number;
}) {
  const params = new URLSearchParams({
    center: input.center,
    zoom: String(input.zoom ?? 21),
    size: input.size ?? "1280x720",
    scale: String(input.scale ?? 2),
    maptype: "satellite",
    key: input.key
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

async function fetchPropertyImages(input: { lat?: number | null; lng?: number | null; address?: string }) {
  const key = process.env.GOOGLE_SECRET_KEY;
  if (!key) return { aerial: null as Buffer | null, street: null as Buffer | null };

  const target =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? `${input.lat},${input.lng}`
      : (input.address ?? "").trim();

  if (!target) return { aerial: null as Buffer | null, street: null as Buffer | null };

  const center = typeof input.lat === "number" && typeof input.lng === "number"
    ? `${input.lat},${input.lng}`
    : target;
  const heading = typeof input.lng === "number"
    ? input.lng >= -114.18 && input.lng <= -113.95
      ? 28
      : 22
    : 22;

  const aerialUrl = buildSatelliteStaticMapUrl({
    key,
    center,
    zoom: 21,
    size: "640x420",
    scale: 2
  });
  const streetUrl = buildStreetViewUrl({
    key,
    location: center,
    heading,
    fov: 58,
    pitch: -8,
    size: "640x420"
  });
  const streetFallbackUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=19&size=640x420&scale=2&maptype=roadmap&markers=color:0x1d4ed8%7C${encodeURIComponent(center)}&key=${encodeURIComponent(key)}`;

  const [aerialPrimary, streetPrimary] = await Promise.all([fetchBuffer(aerialUrl), fetchBuffer(streetUrl)]);
  const streetFallback = streetPrimary ? null : await fetchBuffer(streetFallbackUrl);
  const aerial = aerialPrimary;
  const street = streetPrimary ?? streetFallback;
  return { aerial, street };
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
  const fontBoldId = builder.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const contentId = builder.addStream("", page.commands.join("\n"));
    const xObjectEntries = Object.entries(page.xObjects)
      .map(([name, id]) => `/${name} ${id} 0 R`)
      .join(" ");
    const annots = page.annotations.length
      ? `/Annots [${page.annotations.map((id) => `${id} 0 R`).join(" ")}]`
      : "";

    const resources = `<< /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >>${xObjectEntries ? ` /XObject << ${xObjectEntries} >>` : ""} >>`;
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
    const testMode = body.testMode === true || request.headers.get("x-instaquote-test-mode") === "1";
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
    const locationContext = resolvePublicLocation({ address: estimate.address });
    const [projects, quoteSignal] = testMode
      ? [[], null] as [RelatedProjectCard[], ServiceSpecificQuoteSignal | null]
      : await Promise.all([
        getRelatedProjects({
          serviceType: requestedScope,
          address: estimate.address,
          city: locationContext?.city ?? null,
          quadrant: locationContext?.quadrant ?? null,
          neighborhood: locationContext?.locality ?? null,
          limit: 3
        }),
        getServiceSpecificQuoteSignals({
          address: estimate.address,
          city: locationContext?.city ?? null,
          quadrant: locationContext?.quadrant ?? null,
          neighborhood: locationContext?.locality ?? null,
          serviceType: requestedScope
        })
      ]);
    const solarSnapshot = getSolarSnapshotData({
      buildingInsights: estimate.solarSnapshot?.buildingInsights ?? null,
      dataLayers: estimate.solarSnapshot?.dataLayers ?? null,
      quoteContext: { serviceType: requestedScope },
      propertyContext: { roofAreaSqft: estimate.roofAreaSqft }
    });
    const includeSolarPage = requestedScope === "roofing" || requestedScope === "all" || solarSnapshot.hasStrongData;
    const [propertyImages, logoBuffer] = await Promise.all([
      fetchPropertyImages({ lat: estimate.lat, lng: estimate.lng, address: estimate.address }),
      loadLogo()
    ]);

    const builder = new PdfBuilder();
    const page1 = beginPage();
    const page2 = beginPage();
    const page3 = beginPage();
    const page4 = beginPage();

    const headerLogo = logoBuffer ? addImageObject(builder, page1, "Logo", logoBuffer) : null;
    drawHeader(page1, {
      title: "Instant Estimate Summary",
      subtitle: "Estimate only — request a full proposal to lock in scope",
      logo: headerLogo,
      badge: "Customer Estimate"
    });

    let cursorTop = PAGE_TOP_START;
    drawIntroCard(
      page1,
      cursorTop,
      "Estimate summary",
      "This instant estimate mirrors our proposal structure and keeps your requested scope, pricing basis, and modeled property details together."
    );
    cursorTop -= 72 + SECTION_GAP_Y;

    const quoteCardH = 174;
    const quoteCardY = cursorTop - quoteCardH;
    drawCard(page1, MARGIN, quoteCardY, CONTENT_WIDTH, quoteCardH, COLORS.cardBg);
    const quoteLeftW = 306;
    drawText(page1, "REQUESTED SYSTEM", MARGIN + CARD_PADDING_X, quoteCardY + quoteCardH - 22, 7, COLORS.accentGold);
    drawText(page1, serviceLabelFromScope(requestedScope), MARGIN + CARD_PADDING_X, quoteCardY + quoteCardH - 38, 17, COLORS.textDark, "F2");
    drawMultiline(page1, estimate.address ?? "your property", MARGIN + CARD_PADDING_X, quoteCardY + quoteCardH - 56, quoteLeftW - 18, 9, 11, COLORS.textMid);
    drawText(page1, `${fmtCurrency(primaryLow)} - ${fmtCurrency(primaryHigh)}`, MARGIN + CARD_PADDING_X, quoteCardY + 54, 24, COLORS.navy, "F2");
    drawText(page1, "Estimate basis: instant model + address intelligence", MARGIN + CARD_PADDING_X, quoteCardY + 34, 8.5, COLORS.textMid);
    drawRoundedBox(page1, MARGIN + CARD_PADDING_X, quoteCardY + 12, 108, 14, COLORS.badgeAmberBg, COLORS.badgeAmberBg);
    drawTextCentered(page1, "ESTIMATE ONLY", MARGIN + CARD_PADDING_X + 54, quoteCardY + 16, 7.5, COLORS.badgeAmberFg, "F2");

    const imageColX = MARGIN + quoteLeftW + GRID_GAP_X;
    const imageColW = CONTENT_WIDTH - quoteLeftW - GRID_GAP_X - CARD_PADDING_X;
    const imageH = (quoteCardH - CARD_PADDING_Y * 2 - GRID_GAP_Y) / 2;
    drawCard(page1, imageColX, quoteCardY + quoteCardH - CARD_PADDING_Y - imageH, imageColW, imageH, COLORS.cardSoft);
    drawCard(page1, imageColX, quoteCardY + CARD_PADDING_Y, imageColW, imageH, COLORS.cardSoft);
    if (propertyImages.aerial) {
      const aerial = addImageObject(builder, page1, "AerialImg", propertyImages.aerial);
      if (aerial) drawImageCover(page1, aerial, imageColX + 4, quoteCardY + quoteCardH - CARD_PADDING_Y - imageH + 4, imageColW - 8, imageH - 8);
    }
    if (propertyImages.street) {
      const street = addImageObject(builder, page1, "StreetImg", propertyImages.street);
      if (street) drawImageCover(page1, street, imageColX + 4, quoteCardY + CARD_PADDING_Y + 4, imageColW - 8, imageH - 8);
    }
    cursorTop -= quoteCardH + SECTION_GAP_Y;

    const stats = publicQuoteDisplay.supportingItems.slice(0, 6);
    const statCols = 2;
    const statW = (CONTENT_WIDTH - GRID_GAP_X) / statCols;
    const statH = 46;
    const statGridH = statH * 3 + GRID_GAP_Y * 2;
    const statsY = cursorTop - statGridH;
    stats.forEach((item, index) => {
      const row = Math.floor(index / statCols);
      const col = index % statCols;
      const x = MARGIN + col * (statW + GRID_GAP_X);
      const y = statsY + statGridH - (row + 1) * statH - row * GRID_GAP_Y;
      drawStatCell(page1, x, y, statW, statH, item.label, item.value);
    });
    cursorTop -= statGridH + SECTION_GAP_Y;

    drawCard(page1, MARGIN, cursorTop - 56, CONTENT_WIDTH, 56, COLORS.cardSoft);
    const noteLines = clampTextLines(
      "This document is an instant planning estimate. Final proposal pricing is confirmed after full scope review, measurements, and product availability.",
      8.5,
      CONTENT_WIDTH - CARD_PADDING_X * 2,
      3
    );
    drawText(page1, "Important note", MARGIN + CARD_PADDING_X, cursorTop - 20, 11, COLORS.textDark, "F2");
    noteLines.forEach((line, i) => drawText(page1, line, MARGIN + CARD_PADDING_X, cursorTop - 33 - i * 10.5, 8.5, COLORS.textMid));
    addLink(builder, page1, MARGIN, cursorTop - 56, CONTENT_WIDTH, 56, proposalUrl);
    drawCard(page1, MARGIN, 50, CONTENT_WIDTH, 52, COLORS.cardSoft);
    const trustPills = [
      "Local estimate intelligence",
      "Proposal-aligned pricing logic",
      "Calgary-focused exterior scope planning"
    ];
    trustPills.forEach((pill, index) => {
      const x = MARGIN + CARD_PADDING_X + index * ((CONTENT_WIDTH - 32) / 3);
      drawRoundedBox(page1, x, 62, ((CONTENT_WIDTH - 50) / 3), 14, COLORS.badgeBlueBg, COLORS.badgeBlueBg);
      drawTextCentered(page1, pill, x + ((CONTENT_WIDTH - 50) / 6), 66.5, 6.6, COLORS.badgeBlueFg, "F2");
    });
    drawFooter(page1);

    const headerLogo2 = logoBuffer ? addImageObject(builder, page2, "Logo2", logoBuffer) : null;
    drawHeader(page2, {
      title: "Materials & Upgrade Options",
      subtitle: "Your quoted system first — upgrades shown as planning ranges",
      logo: headerLogo2,
      badge: "Customer Estimate"
    });

    const material = materialConfig(requestedScope, sidingMaterial);
    let page2Top = PAGE_TOP_START;
    drawIntroCard(
      page2,
      page2Top,
      "Material options",
      "Your requested system appears first, followed by comparable option cards using the same proposal layout rhythm."
    );
    page2Top -= 72 + SECTION_GAP_Y;

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

    const materialCardH = 62;
    materialRows.forEach((row) => {
      const y = page2Top - materialCardH;
      drawMaterialOptionCard(page2, MARGIN, y, CONTENT_WIDTH, materialCardH, {
        badgeText: row.tag,
        badgeFg: row.tag === "Included in this estimate"
          ? COLORS.badgeGreenFg
          : row.tag === "Premium option"
            ? COLORS.badgePurpleFg
            : COLORS.badgeBlueFg,
        badgeBg: row.tag === "Included in this estimate"
          ? COLORS.badgeGreenBg
          : row.tag === "Premium option"
            ? COLORS.badgePurpleBg
            : COLORS.badgeBlueBg,
        title: row.title,
        price: row.delta,
        desc: "Proposal-aligned option card. Final values are confirmed during full proposal review."
      });
      page2Top -= materialCardH + SECTION_GAP_Y;
    });

    drawCard(page2, MARGIN, page2Top - 62, CONTENT_WIDTH, 62, COLORS.cardSoft);
    drawText(page2, "Final proposal stage", MARGIN + CARD_PADDING_X, page2Top - 24, 13, COLORS.textDark, "F2");
    drawMultiline(
      page2,
      "Confirms exact product availability, accessory package selections, and installation sequencing before contract lock-in.",
      MARGIN + CARD_PADDING_X,
      page2Top - 40,
      CONTENT_WIDTH - CARD_PADDING_X * 2,
      8.5,
      11.5,
      COLORS.textMid
    );
    drawFooter(page2);

    const headerLogo3 = logoBuffer ? addImageObject(builder, page3, "Logo3", logoBuffer) : null;
    drawHeader(page3, {
      title: "Planning Support & Similar Scope Signals",
      subtitle: "Additional quoted items, local quote activity, and related projects",
      logo: headerLogo3,
      badge: "Customer Estimate"
    });

    let optionsY = PAGE_TOP_START - 8;
    drawText(page3, "Additional quoted items", MARGIN, optionsY - 8, 12.5, COLORS.textDark, "F2");
    optionsY -= 16;
    otherOptions(requestedScope, estimate).forEach((option) => {
      drawCard(page3, MARGIN, optionsY - 40, CONTENT_WIDTH, 34, COLORS.cardSoft);
      drawText(page3, option.title, MARGIN + CARD_PADDING_X, optionsY - 20, 10.5, COLORS.textDark, "F2");
      drawText(page3, option.value, MARGIN + 330, optionsY - 20, 10.5, COLORS.navy, "F2");
      optionsY -= 34 + SECTION_GAP_Y;
    });
    optionsY -= 6;

    if (quoteSignal) {
      const trustH = 86;
      drawCard(page3, MARGIN, optionsY - trustH, CONTENT_WIDTH, trustH, COLORS.cardSoft);
      drawText(page3, quoteSignal.heading, MARGIN + 12, optionsY - 22, 12, COLORS.textDark, "F2");
      drawMultiline(page3, quoteSignal.subtext, MARGIN + 12, optionsY - 36, CONTENT_WIDTH - 220, 8.4, 10.5, COLORS.textMid);
      drawRoundedBox(page3, MARGIN + CONTENT_WIDTH - 204, optionsY - trustH + 12, 192, 62, COLORS.cardBg, COLORS.border);
      drawText(page3, `${quoteSignal.quoteSignalCount} recent ${quoteSignal.serviceType.toLowerCase()} signals`, MARGIN + CONTENT_WIDTH - 194, optionsY - trustH + 56, 8.2, COLORS.textDark, "F2");
      drawText(page3, quoteSignal.geographyLabel, MARGIN + CONTENT_WIDTH - 194, optionsY - trustH + 43, 8.1, COLORS.textSub);
      drawText(page3, `Modeled range: ${fmtCurrency(quoteSignal.rangeMin)} - ${fmtCurrency(quoteSignal.rangeMax)}`, MARGIN + CONTENT_WIDTH - 194, optionsY - trustH + 29, 8.2, COLORS.navy, "F2");
      optionsY -= trustH + SECTION_GAP_Y;
    }

    drawText(page3, "Related projects", MARGIN, optionsY - 10, 13, COLORS.textDark, "F2");
    optionsY -= 24;

    if (projects.length === 0) {
      drawCard(page3, MARGIN, optionsY - 64, CONTENT_WIDTH, 58, COLORS.cardSoft);
      drawText(page3, "More project examples are available on our website.", MARGIN + CARD_PADDING_X, optionsY - 33, 11, COLORS.textDark, "F2");
      drawText(page3, "See recent work", MARGIN + CARD_PADDING_X, optionsY - 50, 11, "0.12 0.38 0.72");
      addLink(builder, page3, MARGIN + 12, optionsY - 56, 140, 18, canonicalUrl("/projects"));
    } else {
      const cardWidth = (CONTENT_WIDTH - GRID_GAP_X * 2) / 3;
      const cardHeight = 204;
      for (let i = 0; i < projects.length; i += 1) {
        const project = projects[i];
        const x = MARGIN + i * (cardWidth + GRID_GAP_X);
        const y = optionsY - 218;
        const imageBuffer = await fetchBuffer(project.imageUrl);
        const imageRef = imageBuffer ? addImageObject(builder, page3, `Proj${i + 1}`, imageBuffer) : null;
        drawProjectCard(
          page3,
          x,
          y,
          cardWidth,
          cardHeight,
          {
            title: project.title,
            summary: project.summary?.trim() ? project.summary : "See this recent project example.",
            href: project.href,
            image: imageRef,
            location: project.locationLabel,
            serviceBadge: project.serviceBadge,
            ctaLabel: project.ctaLabel
          },
          builder
        );
      }
    }

    drawCard(page3, MARGIN, 92, CONTENT_WIDTH, 64, COLORS.cardSoft);
    drawRoundedBox(page3, MARGIN + 12, 130, 166, 14, COLORS.badgeAmberBg, COLORS.badgeAmberBg);
    drawTextCentered(page3, "SOLAR SNAPSHOT", MARGIN + 95, 134.5, 7.2, COLORS.badgeAmberFg, "F2");
    drawText(page3, solarSnapshot.teaserTitle, MARGIN + 12, 116, 12.5, COLORS.textDark, "F2");
    drawMultiline(page3, solarSnapshot.teaserBody, MARGIN + 12, 103, CONTENT_WIDTH - 24, 8.4, 10.4, COLORS.textMid);
    drawText(page3, includeSolarPage ? solarSnapshot.teaserNextPage : "Solar snapshot appears when stronger rooftop model data is available.", MARGIN + 12, 70, 8.8, COLORS.navy, "F2");
    drawRoundedBox(page3, MARGIN + CONTENT_WIDTH - 176, 66, 164, 18, COLORS.navy, COLORS.navy);
    drawTextCentered(page3, "View solar overview →", MARGIN + CONTENT_WIDTH - 94, 72, 8.6, COLORS.white, "F2");
    addLink(builder, page3, MARGIN + CONTENT_WIDTH - 176, 66, 164, 18, solarSnapshot.ctaUrl);
    drawFooter(page3);

    if (includeSolarPage) {
      const headerLogo4 = logoBuffer ? addImageObject(builder, page4, "Logo4", logoBuffer) : null;
      drawHeader(page4, {
        title: "Solar suitability snapshot",
        subtitle: "Modeled from rooftop and sun exposure data for this property",
        logo: headerLogo4,
        badge: "Planning Snapshot"
      });
      drawCard(page4, MARGIN, PAGE_TOP_START - 62, CONTENT_WIDTH, 50, COLORS.cardSoft);
      drawText(page4, "Planning snapshot only, not part of the quoted scope.", MARGIN + 12, PAGE_TOP_START - 34, 8.8, COLORS.textMid);
      drawText(page4, "Solar is not included in this estimate.", MARGIN + 12, PAGE_TOP_START - 46, 8.8, COLORS.textMid);
      drawText(page4, solarSnapshot.sourceNote, MARGIN + 12, PAGE_TOP_START - 57, 8, COLORS.navy, "F2");

      const verdictY = PAGE_TOP_START - 146;
      drawCard(page4, MARGIN, verdictY, CONTENT_WIDTH, 76, COLORS.cardBg);
      drawText(page4, `Solar suitability: ${solarSnapshot.suitabilityVerdict}`, MARGIN + 12, verdictY + 53, 13.5, COLORS.textDark, "F2");
      drawText(page4, `Modeled capacity: Up to ${solarSnapshot.maxPanels ?? "n/a"} panels`, MARGIN + 12, verdictY + 38, 8.8, COLORS.textMid);
      drawText(page4, `Annual solar exposure: ~${solarSnapshot.maxSunHoursYear ? Math.round(solarSnapshot.maxSunHoursYear).toLocaleString() : "n/a"} sun-hours/year`, MARGIN + 12, verdictY + 26, 8.8, COLORS.textMid);
      drawText(page4, `Estimated annual production range: ~${solarSnapshot.estimatedProductionLowKwh ? Math.round(solarSnapshot.estimatedProductionLowKwh).toLocaleString() : "n/a"} to ${solarSnapshot.estimatedProductionHighKwh ? Math.round(solarSnapshot.estimatedProductionHighKwh).toLocaleString() : "n/a"} kWh/year`, MARGIN + 12, verdictY + 14, 8.8, COLORS.textMid);

      const roofBlockY = verdictY - 140;
      drawCard(page4, MARGIN, roofBlockY, CONTENT_WIDTH, 132, COLORS.cardBg);
      drawText(page4, "Modeled roof context", MARGIN + 12, roofBlockY + 114, 10.5, COLORS.textDark, "F2");
      const roofVisualW = 320;
      const roofVisualH = 94;
      if (propertyImages.aerial) {
        const aerial4 = addImageObject(builder, page4, "SolarRoofAerial", propertyImages.aerial);
        if (aerial4) drawImageCover(page4, aerial4, MARGIN + 8, roofBlockY + 14, roofVisualW, roofVisualH);
      } else if (propertyImages.street) {
        const street4 = addImageObject(builder, page4, "SolarRoofStreet", propertyImages.street);
        if (street4) drawImageCover(page4, street4, MARGIN + 8, roofBlockY + 14, roofVisualW, roofVisualH);
      } else {
        drawRect(page4, MARGIN + 8, roofBlockY + 14, roofVisualW, roofVisualH, COLORS.cardSoft, COLORS.border);
        drawText(page4, "Property context image unavailable", MARGIN + 18, roofBlockY + 58, 8.2, COLORS.textSub);
      }
      drawMultiline(page4, "Highlighted roof areas represent sections most likely to support panel placement based on modeled rooftop data.", MARGIN + 12, roofBlockY + 10, CONTENT_WIDTH - 24, 7.3, 9, COLORS.textSub);
      drawMultiline(page4, "This property-specific view anchors the modeled solar performance profile before a no-cost review.", MARGIN + 340, roofBlockY + 88, CONTENT_WIDTH - 352, 8, 10.5, COLORS.textMid);

      const likelyAnnual = solarSnapshot.estimatedProductionLikelyKwh ?? solarSnapshot.estimatedProductionHighKwh ?? 0;
      const monthlyProduction = buildMonthlySolarProductionSeries(likelyAnnual);
      const chartY = roofBlockY - 126;
      drawMonthlySolarLineChart(page4, MARGIN, chartY, CONTENT_WIDTH, 118, monthlyProduction);
      drawText(page4, `Modeled annual production range: ${solarSnapshot.estimatedProductionLowKwh ? Math.round(solarSnapshot.estimatedProductionLowKwh).toLocaleString() : "n/a"} to ${solarSnapshot.estimatedProductionHighKwh ? Math.round(solarSnapshot.estimatedProductionHighKwh).toLocaleString() : "n/a"} kWh/year`, MARGIN + 12, chartY + 12, 7.4, COLORS.textSub, "F2");
      drawText(page4, "Production is typically higher in spring and summer and lower in winter. Final system sizing depends on roof layout, usable planes, and actual electricity usage.", MARGIN + 12, chartY + 3, 7.1, COLORS.textMid);

      const meaningY = chartY - 50;
      drawCard(page4, MARGIN, meaningY, CONTENT_WIDTH, 42, COLORS.cardSoft);
      drawText(page4, "What this means", MARGIN + 12, meaningY + 30, 10.6, COLORS.textDark, "F2");
      const meaningLines = clampTextLines(
        "Based on modeled roof area, panel capacity, and sun exposure, this property appears to be a strong candidate for a solar review. A full review can confirm usable roof planes, expected production, and potential offset against annual usage.",
        7.8,
        CONTENT_WIDTH - 24,
        2
      );
      meaningLines.forEach((line, i) => drawText(page4, line, MARGIN + 12, meaningY + 18 - i * 9, 7.8, COLORS.textMid));

      const structureY = meaningY - 54;
      const halfW = (CONTENT_WIDTH - 10) / 2;
      drawCard(page4, MARGIN, structureY, halfW, 50, COLORS.cardBg);
      drawText(page4, "How solar projects are often structured", MARGIN + 10, structureY + 36, 9, COLORS.textDark, "F2");
      const structureLines = clampTextLines(
        "• Systems are often sized around annual usage • Stronger summer output can help balance lower winter output • Some municipalities may offer property-related financing options for eligible homeowners",
        7.2,
        halfW - 20,
        4
      );
      structureLines.forEach((line, i) => drawText(page4, line, MARGIN + 10, structureY + 24 - i * 8, 7.2, COLORS.textMid));

      drawCard(page4, MARGIN + halfW + 10, structureY, halfW, 50, COLORS.cardSoft);
      drawText(page4, "Why review now", MARGIN + halfW + 20, structureY + 36, 9.4, COLORS.textDark, "F2");
      drawText(page4, "• Easier to assess during roofing or exterior planning", MARGIN + halfW + 20, structureY + 24, 7.1, COLORS.textMid);
      drawText(page4, "• Layout should align with roof condition and usable planes", MARGIN + halfW + 20, structureY + 16, 7.1, COLORS.textMid);
      drawText(page4, "• Confirms whether the property is worth deeper review", MARGIN + halfW + 20, structureY + 8, 7.1, COLORS.textMid);

      const nextY = structureY - 50;
      drawCard(page4, MARGIN, nextY, CONTENT_WIDTH, 44, COLORS.cardBg);
      drawText(page4, "What happens next", MARGIN + 12, nextY + 31, 10, COLORS.textDark, "F2");
      drawText(page4, "• No commitment to proceed", MARGIN + 12, nextY + 20, 7.4, COLORS.textMid);
      drawText(page4, "• No cost for the initial review", MARGIN + 12, nextY + 11, 7.4, COLORS.textMid);
      drawText(page4, "• A recent electricity bill is used to size the system correctly", MARGIN + 212, nextY + 20, 7.4, COLORS.textMid);
      drawText(page4, "This step simply confirms whether solar makes sense for this property before any decisions are made.", MARGIN + 12, nextY + 2, 7.2, COLORS.navy, "F2");

      drawRoundedBox(page4, MARGIN, 46, CONTENT_WIDTH, 30, COLORS.navy, COLORS.navy);
      drawTextCentered(page4, "Request a solar review", PAGE_WIDTH / 2, 58.8, 9.6, COLORS.white, "F2");
      drawTextCentered(page4, "A recent electricity bill is required to prepare the review and size the system to actual usage.", PAGE_WIDTH / 2, 49.8, 6.6, "0.82 0.89 0.98");
      addLink(builder, page4, MARGIN, 46, CONTENT_WIDTH, 30, solarSnapshot.ctaUrl);
      drawFooter(page4);
    }

    const pdf = finalizeDocument(builder, includeSolarPage ? [page1, page2, page3, page4] : [page1, page2, page3]);

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
