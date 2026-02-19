function toDmsRationals(value: number): Array<[number, number]> {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(seconds * 10000), 10000]
  ];
}

function buildGpsExifSegment(lat: number, lng: number) {
  const latRef = lat >= 0 ? "N\0" : "S\0";
  const lngRef = lng >= 0 ? "E\0" : "W\0";
  const latDms = toDmsRationals(lat);
  const lngDms = toDmsRationals(lng);

  const tiffParts: Buffer[] = [];
  const push = (buffer: Buffer) => tiffParts.push(buffer);

  const short = (n: number) => {
    const b = Buffer.alloc(2);
    b.writeUInt16BE(n, 0);
    return b;
  };

  const long = (n: number) => {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n, 0);
    return b;
  };

  const rationalTripletBuffer = (values: Array<[number, number]>) => {
    const b = Buffer.alloc(24);
    values.forEach((entry, index) => {
      b.writeUInt32BE(entry[0], index * 8);
      b.writeUInt32BE(entry[1], index * 8 + 4);
    });
    return b;
  };

  // TIFF header (big-endian)
  push(Buffer.from([0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08]));

  const ifd0Offset = 8;
  const ifd0EntryCount = 1;
  const ifd0Size = 2 + ifd0EntryCount * 12 + 4;
  const gpsIfdOffset = ifd0Offset + ifd0Size;

  // IFD0
  push(short(ifd0EntryCount));
  // GPSInfoIFDPointer tag
  push(short(0x8825));
  push(short(4)); // LONG
  push(long(1));
  push(long(gpsIfdOffset));
  push(long(0)); // next IFD

  const gpsEntryCount = 5;
  const gpsIfdSize = 2 + gpsEntryCount * 12 + 4;
  const gpsDataOffsetStart = gpsIfdOffset + gpsIfdSize;

  const latData = rationalTripletBuffer(latDms);
  const lngData = rationalTripletBuffer(lngDms);
  const datumData = Buffer.from("WGS-84\0", "ascii");

  const latDataOffset = gpsDataOffsetStart;
  const lngDataOffset = latDataOffset + latData.length;
  const datumOffset = lngDataOffset + lngData.length;

  // GPS IFD
  push(short(gpsEntryCount));

  // GPSVersionID
  push(short(0x0000));
  push(short(1)); // BYTE
  push(long(4));
  push(Buffer.from([2, 3, 0, 0]));

  // GPSLatitudeRef
  push(short(0x0001));
  push(short(2)); // ASCII
  push(long(2));
  push(Buffer.from([latRef.charCodeAt(0), 0x00, 0x00, 0x00]));

  // GPSLatitude
  push(short(0x0002));
  push(short(5)); // RATIONAL
  push(long(3));
  push(long(latDataOffset));

  // GPSLongitudeRef
  push(short(0x0003));
  push(short(2));
  push(long(2));
  push(Buffer.from([lngRef.charCodeAt(0), 0x00, 0x00, 0x00]));

  // GPSLongitude
  push(short(0x0004));
  push(short(5));
  push(long(3));
  push(long(lngDataOffset));

  push(long(0)); // next IFD

  push(latData);
  push(lngData);
  push(datumData);

  const tiffBuffer = Buffer.concat(tiffParts);
  const exifPayload = Buffer.concat([Buffer.from("Exif\0\0", "ascii"), tiffBuffer]);

  const marker = Buffer.from([0xff, 0xe1]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(exifPayload.length + 2, 0);

  return Buffer.concat([marker, length, exifPayload]);
}

export function embedGpsExifIfPossible(input: Buffer, lat: number | null, lng: number | null) {
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return input;
  }

  // JPEG magic bytes
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) {
    return input;
  }

  const exifSegment = buildGpsExifSegment(lat, lng);
  // Insert right after SOI marker.
  return Buffer.concat([input.subarray(0, 2), exifSegment, input.subarray(2)]);
}
