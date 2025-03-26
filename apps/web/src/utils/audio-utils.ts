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

import { sanitizeFilename } from "@notesnook/common";

// Constants for app-specific directories
const AUDIO_DIR = "audio_recordings";
const DB_NAME = "MedinoteAudioDB";
const STORE_NAME = "audioFiles";

export interface AudioFile {
  filename: string;
  blob: Blob;
  timestamp: number;
}

interface PlatformFS {
  isElectron: boolean;
  isMobile: boolean;
  createDirectory: (path: string) => Promise<void>;
  writeFile: (path: string, data: string, encoding: string) => Promise<string>;
  getAppDirectory: () => Promise<string>;
}

// Platform-specific implementations
const platformFS: PlatformFS = {
  isElectron: typeof process !== "undefined" && !!process?.versions?.electron,
  isMobile:
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),

  async createDirectory(path: string) {
    if (this.isElectron) {
      const fs = window.require("fs").promises;
      await fs.mkdir(path, { recursive: true });
    }
    // For mobile, directory creation is handled by the platform-specific code
  },

  async writeFile(path: string, data: string, encoding: string) {
    if (this.isElectron) {
      const fs = window.require("fs").promises;
      await fs.writeFile(path, data, encoding);
      return path;
    }
    throw new Error("Platform not supported");
  },

  async getAppDirectory() {
    if (this.isElectron) {
      const { app } = window.require("@electron/remote");
      return app.getPath("userData");
    }
    throw new Error("Platform not supported");
  }
};

/**
 * Opens the IndexedDB database for audio storage
 */
async function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "filename" });
      }
    };
  });
}

/**
 * Saves a base64 audio file to the app's designated audio directory
 * @param base64Audio - The base64 string of the audio data
 * @param filename - The desired filename (without extension)
 * @param mimeType - The MIME type of the audio (e.g., 'audio/webm', 'audio/mp3')
 * @returns Promise<string> - Returns the path where the file was saved
 */
export async function saveBase64Audio(
  base64Audio: string,
  filename: string,
  mimeType = "audio/webm"
): Promise<string> {
  // Remove potential data URL prefix
  const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, "");

  // Sanitize filename and add extension
  const extension = mimeType.split("/")[1] || "webm";
  const sanitizedFilename = sanitizeFilename(`${filename}.${extension}`, {
    replacement: "_"
  });

  // Generate a unique filename to prevent overwrites
  const uniqueFilename = `${Date.now()}_${sanitizedFilename}`;

  try {
    if (platformFS.isElectron) {
      const appDir = await platformFS.getAppDirectory();
      const audioDir = `${appDir}/${AUDIO_DIR}`;

      // Ensure audio directory exists
      await platformFS.createDirectory(audioDir);

      const filePath = `${audioDir}/${uniqueFilename}`;
      await platformFS.writeFile(filePath, base64Data, "base64");
      return filePath;
    } else if (platformFS.isMobile) {
      // For mobile platforms, we'll use the platform-specific implementation
      // This will be handled by the mobile app's native code
      throw new Error(
        "Please use the mobile-specific implementation for this platform"
      );
    } else {
      // For web platform, we'll store in IndexedDB
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Store in IndexedDB and return the key
      const db = await openAudioDB();
      const store = db
        .transaction(["audioFiles"], "readwrite")
        .objectStore("audioFiles");
      await store.put({
        filename: uniqueFilename,
        blob,
        timestamp: Date.now()
      });

      return uniqueFilename;
    }
  } catch (error) {
    console.error("Error saving audio file:", error);
    throw error;
  }
}

/**
 * Retrieves an audio file from storage
 * @param filename - The filename of the audio to retrieve
 * @returns Promise<AudioFile | null> - Returns the audio file data or null if not found
 */
export async function getAudioFile(
  filename: string
): Promise<AudioFile | null> {
  try {
    if (platformFS.isElectron) {
      const appDir = await platformFS.getAppDirectory();
      const filePath = `${appDir}/${AUDIO_DIR}/${filename}`;
      const fs = window.require("fs").promises;
      const data = await fs.readFile(filePath);
      return {
        filename,
        blob: new Blob([data], { type: "audio/webm" }),
        timestamp: (await fs.stat(filePath)).mtimeMs
      };
    } else if (platformFS.isMobile) {
      throw new Error(
        "Please use the mobile-specific implementation for this platform"
      );
    } else {
      const db = await openAudioDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(filename);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error("Error retrieving audio file:", error);
    return null;
  }
}

/**
 * Lists all stored audio files
 * @returns Promise<AudioFile[]> - Returns an array of audio file metadata
 */
export async function listAudioFiles(): Promise<AudioFile[]> {
  try {
    if (platformFS.isElectron) {
      const appDir = await platformFS.getAppDirectory();
      const audioDir = `${appDir}/${AUDIO_DIR}`;
      const fs = window.require("fs").promises;

      try {
        await fs.access(audioDir);
      } catch {
        return [];
      }

      const files = await fs.readdir(audioDir);
      const audioFiles: AudioFile[] = [];

      for (const filename of files) {
        const filePath = `${audioDir}/${filename}`;
        const data = await fs.readFile(filePath);
        audioFiles.push({
          filename,
          blob: new Blob([data], { type: "audio/webm" }),
          timestamp: (await fs.stat(filePath)).mtimeMs
        });
      }

      return audioFiles;
    } else if (platformFS.isMobile) {
      throw new Error(
        "Please use the mobile-specific implementation for this platform"
      );
    } else {
      const db = await openAudioDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error("Error listing audio files:", error);
    return [];
  }
}

/**
 * Creates an object URL for an audio file that can be used in an audio element
 * @param audioFile - The audio file to create a URL for
 * @returns string - The object URL for the audio file
 */
export function createAudioURL(audioFile: AudioFile): string {
  return URL.createObjectURL(audioFile.blob);
}

/**
 * Revokes an object URL created by createAudioURL
 * @param url - The URL to revoke
 */
export function revokeAudioURL(url: string): void {
  URL.revokeObjectURL(url);
}
