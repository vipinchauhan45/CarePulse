export function calculateHRVFromBase64(ecgBase64: string): number {
  if (!ecgBase64) return 0;

  try {
    const buffer = Buffer.from(ecgBase64, "base64");
    const samples: number[] = [];

    // Convert Base64 bytes into signed 16-bit ECG samples
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const high = buffer[i];
      const low = buffer[i + 1];

      if (high === undefined || low === undefined) {
        continue;
      }

      let value = (high << 8) | low;

      if (value > 32767) {
        value -= 65536;
      }

      samples.push(value);
    }

    if (samples.length < 3) return 0;

    // R-peak detection
    const maxVal = Math.max(...samples);
    const threshold = maxVal * 0.6;

    const rPeaks: number[] = [];

    for (let i = 1; i < samples.length - 1; i++) {
      const current = samples[i];
      const prev = samples[i - 1];
      const next = samples[i + 1];

      if (
        current !== undefined &&
        prev !== undefined &&
        next !== undefined &&
        current > threshold &&
        current > prev &&
        current > next
      ) {
        rPeaks.push(i);
      }
    }

    if (rPeaks.length < 2) return 0;

    const sampleRate = 250;
    const rrIntervals: number[] = [];

    for (let i = 1; i < rPeaks.length; i++) {
      const currentPeak = rPeaks[i];
      const previousPeak = rPeaks[i - 1];

      if (currentPeak === undefined || previousPeak === undefined) {
        continue;
      }

      const intervalMs =
        ((currentPeak - previousPeak) / sampleRate) * 1000;

      rrIntervals.push(intervalMs);
    }

    if (rrIntervals.length < 2) return 0;

    const mean =
      rrIntervals.reduce((sum, value) => sum + value, 0) /
      rrIntervals.length;

    const variance =
      rrIntervals.reduce(
        (sum, value) => sum + Math.pow(value - mean, 2),
        0
      ) / rrIntervals.length;

    const sdnn = Math.sqrt(variance);

    return Number(sdnn.toFixed(2));
  } catch (error) {
    console.error("[HRV ERROR]", error);
    return 0;
  }
}