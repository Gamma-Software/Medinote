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

import { strings } from "@notesnook/intl";
import { SettingsGroup } from "./types";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { i18n } from "@lingui/core";

const AVAILABLE_LOCALES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" }
];

export const LocaleSettings: SettingsGroup[] = [
  {
    header: strings.languages(),
    key: "locale",
    section: "locale",
    settings: [
      {
        key: "language",
        title: strings.languages(),
        description: strings.spellCheckerLanguagesDescription(),
        components: [
          {
            type: "dropdown",
            options: AVAILABLE_LOCALES.map((locale) => ({
              value: locale.code,
              title: locale.name
            })),
            selectedOption: () => i18n.locale,
            onSelectionChanged: (value) => {
              i18n.activate(value);
              useSettingStore.getState().setLocale(value);
              window.location.reload();
            }
          }
        ]
      }
    ]
  }
];
