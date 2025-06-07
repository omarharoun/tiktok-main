import { MediaService } from "./mediaPB";

export const saveMediaToStorage = async (
  media: string,
  recordId: string,
  field: string = "media",
) => {
  const blob = await uriToBlob(media);
  // Upload to posts collection by default, can be customized
  return await MediaService.uploadMedia("posts", recordId, field, blob);
};

export function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("uriToBlob failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

// Re-export MediaService for convenience
export { MediaService };
