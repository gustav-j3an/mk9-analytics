const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPNG(size) {
  const width = size;
  const height = size;
  
  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Rasterize image
  const rawData = Buffer.alloc(height * (1 + width * 4));
  
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const S = size;
  const cornerRadius = S * 0.20; // 20% rounded corners
  const hw = S / 2 - cornerRadius;
  const hh = S / 2 - cornerRadius;

  const yMin = S * 0.27;
  const yMax = S * 0.73;
  const H = yMax - yMin;

  const xM_left = S * 0.17;
  const xM_mid = S * 0.34;
  const xM_right = S * 0.51;

  const xK_left = S * 0.59;
  const xK_right = S * 0.83;

  const segments = [
    // M
    [xM_left, yMin, xM_left, yMax],
    [xM_left, yMin, xM_mid, yMin + H * 0.65],
    [xM_mid, yMin + H * 0.65, xM_right, yMin],
    [xM_right, yMin, xM_right, yMax],
    // K
    [xK_left, yMin, xK_left, yMax],
    [xK_left, yMin + H * 0.52, xK_right, yMin],
    [xK_left, yMin + H * 0.48, xK_right, yMax],
  ];

  const strokeRadius = Math.max(0.7, S * 0.058);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    const py = y + 0.5;
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;

      // Background rounded rect alpha
      const dx = Math.max(0, Math.abs(px - S / 2) - hw);
      const dy = Math.max(0, Math.abs(py - S / 2) - hh);
      const distBg = Math.hypot(dx, dy);
      
      let bgAlpha = 0;
      if (distBg <= cornerRadius - 0.5) {
        bgAlpha = 1;
      } else if (distBg < cornerRadius + 0.5) {
        bgAlpha = cornerRadius + 0.5 - distBg;
      }

      if (bgAlpha <= 0) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Letter distance
      let minDist = Infinity;
      for (const seg of segments) {
        const d = distToSegment(px, py, seg[0], seg[1], seg[2], seg[3]);
        if (d < minDist) minDist = d;
      }

      let letterCov = 0;
      if (minDist <= strokeRadius - 0.5) {
        letterCov = 1;
      } else if (minDist < strokeRadius + 0.5) {
        letterCov = strokeRadius + 0.5 - minDist;
      }

      // Colors:
      // BG: #111111 (17, 17, 17)
      // Text: #FFFFFF (255, 255, 255)
      const r = Math.round(17 * (1 - letterCov) + 255 * letterCov);
      const g = Math.round(17 * (1 - letterCov) + 255 * letterCov);
      const b = Math.round(17 * (1 - letterCov) + 255 * letterCov);
      const a = Math.round(bgAlpha * 255);

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressedData);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function createICO(sizes) {
  const images = sizes.map(s => createPNG(s));
  const numImages = sizes.length;

  const headerLen = 6;
  const dirEntryLen = 16;
  const dataOffsetStart = headerLen + numImages * dirEntryLen;

  const header = Buffer.alloc(headerLen);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  let currentOffset = dataOffsetStart;

  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const imgData = images[i];
    const entry = Buffer.alloc(dirEntryLen);

    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(imgData.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset of image data

    dirEntries.push(entry);
    currentOffset += imgData.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images]);
}

const sizes = [16, 32, 48];
const icoBuffer = createICO(sizes);

const targetPath = path.join(__dirname, '..', 'public', 'favicon.ico');
fs.writeFileSync(targetPath, icoBuffer);
console.log(`Favicon successfully generated at ${targetPath} (${icoBuffer.length} bytes)`);
