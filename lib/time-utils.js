function timeToSeconds(time) {
  const parts = time.trim().split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  throw new Error(`Invalid time format: ${time}`);
}

function secondsToFfmpegTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function parseTimeRange(range) {
  if (!range) {
    throw new Error("Missing Source time range");
  }

  const normalized = range.replace(/–/g, "-").replace(/—/g, "-").replace(/\s+/g, "");

  const [start, end] = normalized.split("-");

  if (!start || !end) {
    throw new Error(`Invalid Source time range: ${range}`);
  }

  const startSeconds = timeToSeconds(start);
  const endSeconds = timeToSeconds(end);
  const durationSeconds = endSeconds - startSeconds;

  if (durationSeconds <= 0) {
    throw new Error(`End time must be after start time: ${range}`);
  }

  return {
    start,
    end,
    duration: secondsToFfmpegTime(durationSeconds),
  };
}

module.exports = {
  timeToSeconds,
  secondsToFfmpegTime,
  parseTimeRange,
};
