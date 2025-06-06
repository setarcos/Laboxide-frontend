// src/utils/fileops.js
import { ref } from "vue";

// Helper function (can be kept internal to the composable)
export const isImageFile = (filename) => {
  if (!filename || typeof filename !== "string") return false;
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".svg",
    ".webp",
  ];
  const lowerFilename = filename.toLowerCase();
  return imageExtensions.some((ext) => lowerFilename.endsWith(ext));
};

export function useFileHandling(downloadTimelineFileFunction) {
  // --- State ---
  const isPreviewModalVisible = ref(false);
  const previewImageUrl = ref(null);
  const previewImageFilename = ref(null);
  const isPreviewLoading = ref(false);
  const previewError = ref(null);

  // --- Methods ---

  const downloadFile = async (timelineId, filename) => {
    try {
      console.log(
        "[useFileHandling] Attempting to download file for timeline ID:",
        timelineId,
      );
      // Use the function passed as an argument
      const response = await downloadTimelineFileFunction(timelineId);

      if (!(response.data instanceof Blob)) {
        console.error(
          "[useFileHandling] API did not return a Blob for download:",
          response,
        );
        alert("Failed to download file: Invalid response format.");
        return;
      }

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let downloadFilename = filename || `download_${timelineId}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          // Decode URI component for filenames with special characters
          try {
            downloadFilename = decodeURIComponent(filenameMatch[1]);
          } catch (e) {
            console.warn(
              "[useFileHandling] Could not decode filename from header, using fallback.",
              filenameMatch[1],
              e,
            );
            downloadFilename = filenameMatch[1]; // Use raw name if decoding fails
          }
        }
      }

      link.setAttribute("download", downloadFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("[useFileHandling] File download triggered successfully.");
    } catch (error) {
      console.error("[useFileHandling] Error downloading file:", error);
      alert(
        `Failed to download file: ${error.response?.data?.error || error.message || "Unknown error"}`,
      );
    }
  };

  const downloadFileFromBlob = (blob, filename) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "download");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log(
        "[useFileHandling] File download triggered from existing blob.",
      );
    } catch (error) {
      console.error(
        "[useFileHandling] Error triggering download from blob:",
        error,
      );
      alert("Failed to download file from preview data.");
    }
  };

  // Helper to download directly from the preview modal's Blob URL
  const downloadFileFromBlobUrl = async (blobUrl, filename) => {
    if (!blobUrl) return;
    try {
      console.log(
        "[useFileHandling] Attempting download from Blob URL:",
        blobUrl,
      );
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      const blob = await response.blob();
      downloadFileFromBlob(blob, filename); // Reuse existing blob download logic
    } catch (error) {
      console.error(
        "[useFileHandling] Error downloading image from Blob URL:",
        error,
      );
      alert("Failed to download image.");
    }
  };

  const openPreviewModal = (filename) => {
    // Reset state for the new preview
    previewImageUrl.value = null; // Clear previous URL first
    previewImageFilename.value = filename;
    isPreviewLoading.value = true;
    previewError.value = null;
    isPreviewModalVisible.value = true; // Open the modal
  };

  const closePreviewModal = () => {
    console.log(`[useFileHandling] Closing image preview modal.`);
    isPreviewModalVisible.value = false;
    // Revoke the previous Blob URL if it exists to free up memory
    if (previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value);
      console.log("[useFileHandling] Revoked Blob URL:", previewImageUrl.value);
    }
    // Reset state
    previewImageUrl.value = null;
    previewImageFilename.value = null;
    isPreviewLoading.value = false;
    previewError.value = null;
  };

  const handleFileClick = async (entry) => {
    if (!entry || entry.notetype !== 1 || !entry.id) {
      console.warn(
        "[useFileHandling] handleFileClick called on non-file or invalid entry:",
        entry,
      );
      return;
    }

    const filename = entry.note || "attached_file";
    const timelineId = entry.id;

    if (isImageFile(filename)) {
      console.log(
        `[useFileHandling] Attempting image preview for file: ${filename} (ID: ${timelineId})`,
      );
      openPreviewModal(filename); // Open modal and set loading state

      try {
        // Fetch the file content using the provided function
        const response = await downloadTimelineFileFunction(timelineId);

        if (
          response.data instanceof Blob &&
          response.data.type.startsWith("image/")
        ) {
          const url = URL.createObjectURL(response.data);
          previewImageUrl.value = url; // Set the URL for the <img> tag
          console.log("[useFileHandling] Image preview Blob URL created:", url);
        } else {
          console.warn(
            `[useFileHandling] Fetched file for ID ${timelineId} is not an image Blob (type: ${response.data?.type}). Falling back to download.`,
          );
          closePreviewModal(); // Close modal before attempting download
          if (response.data instanceof Blob) {
            downloadFileFromBlob(response.data, filename);
          } else {
            downloadFile(timelineId, filename); // Refetch for download if not a blob
          }
        }
      } catch (err) {
        console.error("[useFileHandling] Error loading image preview:", err);
        previewError.value = `Failed to load image: ${err.response?.data?.error || err.message || "Unknown error"}`;
        previewImageUrl.value = null; // Ensure no broken image link
      } finally {
        isPreviewLoading.value = false; // Turn off loading state
      }
    } else {
      console.log(
        `[useFileHandling] File is not an image: ${filename} (ID: ${timelineId}). Proceeding with standard download.`,
      );
      downloadFile(timelineId, filename);
    }
  };

  // Return reactive state and methods to be used by components
  return {
    isPreviewModalVisible,
    previewImageUrl,
    previewImageFilename,
    isPreviewLoading,
    previewError,
    handleFileClick, // The main function components will call
    closePreviewModal, // Function to close the modal
    downloadFileFromBlobUrl, // Expose if needed for download button inside modal
    // We don't necessarily need to expose isImageFile, downloadFile, etc.
    // unless components need them directly for some other reason.
  };
}
