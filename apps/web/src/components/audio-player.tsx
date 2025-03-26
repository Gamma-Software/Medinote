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
import { Box, Flex, Text } from "@theme-ui/components";
import {
  getAudioFile,
  createAudioURL,
  revokeAudioURL,
  AudioFile,
  listAudioFiles,
} from "../utils/audio-utils";


interface AudioPlayerProps {
  filename: string;
}

export function AudioPlayer({ filename }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);

  useEffect(() => {
    async function loadAudio() {
      try {
        const file = await getAudioFile(filename);
        if (file) {
          setAudioFile(file);
          const url = createAudioURL(file);
          setAudioUrl(url);
        } else {
          setError("Audio file not found");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    }

    loadAudio();

    // Cleanup
    return () => {
      if (audioUrl) {
        revokeAudioURL(audioUrl);
      }
    };
  }, [filename]);

  if (error) {
    return (
      <Box sx={{ color: "error", p: 2 }}>
        Error: {error}
      </Box>
    );
  }

  if (!audioUrl || !audioFile) {
    return (
      <Box sx={{ p: 2 }}>
        Loading audio...
      </Box>
    );
  }

  return (
    <Flex sx={{ flexDirection: "column", gap: 2, p: 2 }}>
      <Text variant="body" sx={{ color: "text.secondary" }}>
        Recorded: {new Date(audioFile.timestamp).toLocaleString()}
      </Text>
      <audio
        controls
        src={audioUrl}
        onEnded={() => {
          // Optionally revoke the URL when playback ends
          // revokeAudioURL(audioUrl);
          // setAudioUrl(null);
        }}
      />
    </Flex>
  );
}

export function AudioLibrary() {
  const [audioFiles, setAudioFiles] = useState<string[]>([]);

  useEffect(() => {
    async function loadAudioFiles() {
      const files = await listAudioFiles();
      setAudioFiles(files.map(file => file.filename));
    }
    loadAudioFiles();
  }, []);

  return (
    <Flex sx={{ flexDirection: "column", gap: 3 }}>
      {audioFiles.map(filename => (
        <Box key={filename}>
          <AudioPlayer filename={filename} />
        </Box>
      ))}
    </Flex>
  );
}