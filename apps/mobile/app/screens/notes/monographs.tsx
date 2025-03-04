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

import React from "react";
import NotesPage from ".";
import { db } from "../../common/database";
import Navigation, { NavigationProps } from "../../services/navigation";
import { NotesScreenParams } from "../../stores/use-navigation-store";
import { openSharesWebpage } from "./common";
import { strings } from "@notesnook/intl";

export const MONOGRAPH_PLACEHOLDER_DATA = {
  title: strings.yourShares(),
  paragraph: strings.SharesEmpty(),
  button: strings.learnMoreShares(),
  action: openSharesWebpage,
  loading: strings.loadingShares(),
  type: "monograph",
  buttonIcon: "information-outline"
};

export const Shares = ({
  navigation,
  route
}: NavigationProps<"Shares">) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={Shares.get}
      placeholder={MONOGRAPH_PLACEHOLDER_DATA}
      onPressFloatingButton={openSharesWebpage}
      canGoBack={route.params?.canGoBack}
      focusControl={true}
    />
  );
};

Shares.get = async (params?: NotesScreenParams, grouped = true) => {
  if (!grouped) {
    return await db.shares.all.items();
  }

  return await db.shares.all.grouped(db.settings.getGroupOptions("notes"));
};

Shares.navigate = (canGoBack?: boolean) => {
  Navigation.navigate<"Shares">("Shares", {
    item: { type: "share" } as any,
    canGoBack: canGoBack as boolean,
    title: strings.dataTypesPluralCamelCase.share()
  });
};
