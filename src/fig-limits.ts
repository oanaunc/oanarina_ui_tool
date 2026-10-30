export const FIG_LIMITS = Object.freeze({
  inputBytes: 50 * 1024 * 1024,
  archiveBytes: 100 * 1024 * 1024,
  entries: 2048,
  imageBytes: 32 * 1024 * 1024,
  canvasBytes: 32 * 1024 * 1024,
  metadataBytes: 1024 * 1024,
  thumbnailBytes: 8 * 1024 * 1024,
  zstdWindow: 64 * 1024 * 1024,
  zstdBlocks: 8192,
  workerTimeoutMs: 15000,
});
