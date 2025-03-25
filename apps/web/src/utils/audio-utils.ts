/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2025 Leaptech EURL

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Platform } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import { ScopedStorage } from "../common/filesystem/scoped-storage";
import { saveAs } from "file-saver";
import { sanitizeFilename } from "@notesnook/common";

/**
 * Saves a base64 audio file locally with platform-specific handling
 * @param base64Audio - The base64 string of the audio data
 * @param filename - The desired filename (without extension)
 * @param mimeType - The MIME type of the audio (e.g., 'audio/webm', 'audio/mp3')
 * @returns Promise<string> - Returns the path where the file was saved (if applicable)
 */
export async function saveBase64Audio(
  base64Audio: string,
  filename: string,
  mimeType: string = "audio/webm"
): Promise<string | void> {
  // Remove potential data URL prefix
  const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, "");

  // Sanitize filename and add extension
  const extension = mimeType.split("/")[1] || "webm";
  const sanitizedFilename = sanitizeFilename(`${filename}.${extension}`, {
    replacement: "_"
  });

  // Web platform
  if (typeof window !== "undefined" && !Platform) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    saveAs(blob, sanitizedFilename);
    return;
  }

  // Mobile platforms
  if (Platform) {
    try {
      if (Platform.OS === "android") {
        // Android: Use ScopedStorage
        const result = await ScopedStorage.createDocument(
          sanitizedFilename,
          mimeType,
          base64Data,
          "base64"
        );
        return result?.uri;
      } else if (Platform.OS === "ios") {
        // iOS: Save to app's document directory
        const path = await RNFetchBlob.fs.dirs.DocumentDir;
        const filePath = `${path}/${sanitizedFilename}`;
        await RNFetchBlob.fs.writeFile(filePath, base64Data, "base64");
        return filePath;
      }
    } catch (error) {
      console.error("Error saving audio file:", error);
      throw error;
    }
  }

  // Desktop (Electron) platform
  // Note: Implementation would depend on your Electron setup
  // This is a placeholder for desktop-specific implementation
  if (process.type === "renderer") {
    // Desktop implementation would go here
    // You would typically use Electron's IPC to communicate with the main process
    // to save the file using Node.js fs module
    console.warn("Desktop implementation not provided");
  }
}
