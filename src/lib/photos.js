import archivedPhotos from "../../data/photos.json";

// These files are shipped in public/photos. Keep them separate from remote
// records: legacy imports generated new IDs, so an archive is not a verified
// replacement for any particular remote photo and must never inherit its ID.
export const ARCHIVED_PHOTOS = archivedPhotos.map((photo) => ({
  id: `archive-${photo.id}`,
  dataUrl: `/photos/${photo.filename}`,
  archived: true,
}));

export function availableGalleryPhotos(photos, failedSources) {
  const available = photos.filter((photo) => photo.dataUrl && !failedSources.has(photo.dataUrl));
  if (available.length > 0 || photos.length === 0) return available;
  return ARCHIVED_PHOTOS.filter((photo) => !failedSources.has(photo.dataUrl));
}
