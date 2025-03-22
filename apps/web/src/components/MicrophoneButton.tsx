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

import { IconButton } from "@theme-ui/components";
import MDIIcon from "@mdi/react";
import { mdiMicrophone } from "@mdi/js";

export function MicrophoneButton() {
  const handleClick = () => {
    console.log("Microphone button clicked!");
  };

  return (
    <IconButton
      onClick={handleClick}
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
      <MDIIcon path={mdiMicrophone} size={1} color="currentColor" />
    </IconButton>
  );
}