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

import { Box, Flex, Text } from "@theme-ui/components";
import { useState, useRef, useEffect } from "react";
import MDIIcon from "@mdi/react";
import { mdiMicrophone, mdiStop, mdiAlertCircle } from "@mdi/js";
import { strings } from "@notesnook/intl";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const checkStorageSpace = async () => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const {quota, usage} = await navigator.storage.estimate();
        // If we have less than 10MB available, prevent recording
        if (quota && usage && (quota - usage) < 10 * 1024 * 1024) {
          throw new Error("Not enough storage space available. Please free up some space before recording.");
        }
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check storage space");
      return false;
    }
  };

  const startRecording = async () => {
    console.debug("start recording");
    try {
      setError(null);
      const hasSpace = await checkStorageSpace();
      if (!hasSpace) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 128);
        requestAnimationFrame(updateAudioLevel);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateAudioLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError(error instanceof Error ? error.message : "Failed to start recording");
    }
  };

  const stopRecording = () => {
    console.debug("stop recording");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <Flex
        sx={{
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3
        }}
      >
        <Box
          sx={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: error ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            backgroundColor: error ? "error" : "accent",
            transform: `scale(${1 + audioLevel * 0.2})`,
            opacity: error ? 0.7 : 1,
            "&:hover": {
              opacity: error ? 0.7 : 0.9
            }
          }}
          onClick={error ? undefined : toggleRecording}
        >
          <MDIIcon
            path={error ? mdiAlertCircle : isRecording ? mdiStop : mdiMicrophone}
            size={2}
            color="white"
            style={{
              transform: `scale(${1 + audioLevel * 1})`,
              transition: "transform 0.05s ease-out"
            }}
          />
        </Box>
        <Text sx={{ color: error ? "error" : isRecording ? "error" : "paragraph" }}>
          {error || (isRecording ? strings.stopRecording() : strings.startRecording())}
        </Text>
      </Flex>
    </>
  );
}