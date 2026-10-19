/**
 * Parses LRC synced lyrics format into structured array
 * Example line: [01:23.45] Some lyric line
 */
function parseLrc(lrcText) {
  if (!lrcText) return { synced: false, lines: [] };

  const lines = lrcText.split('\n');
  const result = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = regex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fractionStr = match[3];
      const fraction = fractionStr.length === 2 ? parseInt(fractionStr, 10) * 10 : parseInt(fractionStr, 10);
      const timeMs = minutes * 60000 + seconds * 1000 + fraction;
      const text = match[4].trim();

      result.push({
        timeMs,
        timeStr: `${match[1]}:${match[2]}.${match[3]}`,
        text
      });
    } else if (line.length > 0 && !line.startsWith('[')) {
      // Unsynced fallback line
      result.push({
        timeMs: null,
        timeStr: null,
        text: line
      });
    }
  }

  // Sort chronologically if synced
  const hasSynced = result.some(item => item.timeMs !== null);
  if (hasSynced) {
    result.sort((a, b) => (a.timeMs || 0) - (b.timeMs || 0));
  }

  return {
    synced: hasSynced,
    lines: result
  };
}

module.exports = { parseLrc };
