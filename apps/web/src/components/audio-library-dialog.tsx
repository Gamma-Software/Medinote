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

import { useEffect, useState } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import Dialog from "./dialog";
import { listAudioFiles, AudioFile } from "../utils/audio-utils";
import { AudioPlayer } from "./audio-player";
import ReactDOM from "react-dom/client";

// String constants
const DIALOG_STRINGS = {
  title: "Voice Recordings",
  description: "Listen to your recorded voice notes",
  loading: "Loading recordings...",
  noRecordings: "No voice recordings found",
  close: "Close"
};

interface AudioLibraryDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

export function AudioLibraryDialog({ onClose, isOpen }: AudioLibraryDialogProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudioFiles() {
      try {
        setIsLoading(true);
        setError(null);
        const files = await listAudioFiles();
        // Sort files by timestamp, newest first
        files.sort((a, b) => b.timestamp - a.timestamp);
        setAudioFiles(files);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      loadAudioFiles();
    }
  }, [isOpen]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={DIALOG_STRINGS.title}
      description={DIALOG_STRINGS.description}
      width={600}
      sx={{
        maxHeight: "85vh"
      }}
      noScroll
      showCloseButton
    >
      <Flex sx={{ flexDirection: "column", gap: 2, p: 2 }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Text>{DIALOG_STRINGS.loading}</Text>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: "center", color: "error" }}>
            <Text>{error}</Text>
          </Box>
        ) : audioFiles.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Text>{DIALOG_STRINGS.noRecordings}</Text>
          </Box>
        ) : (
          <Box sx={{ overflowY: "auto", maxHeight: "60vh" }}>
            {audioFiles.map((file) => (
              <Box
                key={file.filename}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "border",
                  "&:last-child": { borderBottom: "none" }
                }}
              >
                <AudioPlayer filename={file.filename} />
              </Box>
            ))}
          </Box>
        )}
        <Flex sx={{ justifyContent: "flex-end", pt: 2 }}>
          <Button variant="secondary" onClick={onClose}>
            {DIALOG_STRINGS.close}
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}

// Static method to show the dialog
AudioLibraryDialog.show = () => {
  return new Promise<void>((resolve) => {
    const dialogContainer = document.querySelector(".dialogContainer");
    if (!dialogContainer) return resolve();

    let root: ReactDOM.Root | null = null;

    const cleanup = () => {
      if (root) {
        root.unmount();
        root = null;
      }
      resolve();
    };

    const dialog = (
      <AudioLibraryDialog isOpen={true} onClose={cleanup} />
    );

    root = ReactDOM.createRoot(dialogContainer);
    root.render(dialog);
  });
};