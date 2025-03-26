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

import { IconButton, Box, Text } from "@theme-ui/components";
import MDIIcon from "@mdi/react";
import { mdiMicrophone, mdiPlaylistMusic } from "@mdi/js";
import { useState, useRef, useCallback } from "react";
import { AudioLibraryDialog } from "./audio-library-dialog";
import { useEditorStore, SaveState } from "../stores/editor-store";

const LONG_PRESS_DURATION = 500; // milliseconds

export function MicrophoneButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [isLongPress, setIsLongPress] = useState(false);

  const handleMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      AudioLibraryDialog.show();
    }, LONG_PRESS_DURATION);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Only trigger click action if it wasn't a long press
    if (!isLongPress) {
      const activeSession = useEditorStore.getState().getActiveSession();
      if (activeSession) {
        const sessionId = `voice_note_${Date.now()}`;
        useEditorStore.getState().addSession({
          type: "new",
          id: sessionId,
          tabId: activeSession.tabId,
          saveState: SaveState.NotSaved
        });
      }
    }

    setIsLongPress(false);
  }, [isLongPress]);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setShowTooltip(false);
    setIsLongPress(false);
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setShowTooltip(true)}
        sx={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 1000,
          backgroundColor: "primary",
          color: "white",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "primary",
            opacity: 0.9
          }
        }}
      >
        <MDIIcon
          path={isLongPress ? mdiPlaylistMusic : mdiMicrophone}
          size={1}
          color="currentColor"
        />
      </IconButton>
      {showTooltip && (
        <Text
          sx={{
            position: "fixed",
            bottom: "60px",
            right: "10px",
            backgroundColor: "background",
            color: "text",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 1000,
            whiteSpace: "nowrap"
          }}
        >
          Click to record • Hold to view recordings
        </Text>
      )}
    </Box>
  );
}