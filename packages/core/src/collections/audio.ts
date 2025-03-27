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

import Database from "../api/index.js";
import { Audio } from "../types.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";

export class AudioCollection implements ICollection {
  name = "audio";
  readonly collection: SQLCollection<"audio", Audio>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "audio",
      db.eventManager,
      db.sanitizer
    );
  }

  async init() {
    await this.collection.init();
  }

  async add(item: Audio) {
    await this.collection.upsert(item);
  }
}
