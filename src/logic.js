// Blocks have equal size on the movement axis when a new layer starts.
export function splitBlock(center, supportCenter, size, tolerance = 0.075) {
  const offset = center - supportCenter;
  if (Math.abs(offset) <= tolerance) return { perfect: true, center: supportCenter, size, cut: 0 };
  const remaining = size - Math.abs(offset);
  if (remaining <= 0) return { miss: true };
  return { perfect: false, center: (center + supportCenter) / 2, size: remaining,
    cut: Math.abs(offset), cutCenter: center + Math.sign(offset) * remaining / 2 };
}
