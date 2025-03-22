/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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

import { useCallback, useEffect, useState } from "react";
import Voice, { SpeechResultsEvent } from "@react-native-voice/voice";

export const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value) {
        setResults(e.value);
      }
    };
    Voice.onSpeechError = (e: any) => {
      setError(e.error?.message || "Unknown error occurred");
      setIsRecording(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResults([]);
      await Voice.start("en-US");
    } catch (e: any) {
      setError(e.message || "Failed to start recording");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      setError(e.message || "Failed to stop recording");
    }
  }, []);

  return {
    isRecording,
    results,
    error,
    startRecording,
    stopRecording
  };
};
