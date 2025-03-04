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

import "./index.css";
import "@notesnook/web/src/polyfills";
import "@notesnook/web/src/app.css";
import { ThemeDark, ThemeLight, themeToCSS } from "@notesnook/theme";
import Config from "@notesnook/web/src/utils/config";
import { setI18nGlobal, Messages } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import { App } from "./app";
import { useStore as useSettingStore } from "@notesnook/core/stores/setting-store";

const colorScheme = JSON.parse(
  window.localStorage.getItem("colorScheme") || '"light"'
);
const root = document.querySelector("html");
if (root) root.setAttribute("data-theme", colorScheme);

const theme =
  colorScheme === "dark"
    ? Config.get("theme:dark", ThemeDark)
    : Config.get("theme:light", ThemeLight);
const stylesheet = document.getElementById("theme-colors");
if (theme) {
  const css = themeToCSS(theme);
  if (stylesheet) stylesheet.innerHTML = css;
} else stylesheet?.remove();

const locales = {
  fr: import("@notesnook/intl/locales/$fr.json"),
  en: import("@notesnook/intl/locales/$en.json"),
  pseudo: import("@notesnook/intl/locales/$pseudo-LOCALE.json")
};

Promise.all(
  Object.entries(locales).map(async ([lang, module]) => {
    const { default: locale } = await module;
    return [lang, locale.messages];
  })
).then((results) => {
  const messages = Object.fromEntries(results);
  i18n.load(messages as Record<string, Messages>);
  i18n.activate(useSettingStore.getState().locale || "en"); // Default to english

  performance.mark("import:root");
  import("@notesnook/web/src/root.js").then(({ startApp }) => {
    performance.mark("start:app");
    startApp(<App />);
  });
});

setI18nGlobal(i18n);
