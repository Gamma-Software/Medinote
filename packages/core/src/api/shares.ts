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

import http from "../utils/http.js";
import Constants from "../utils/constants.js";
import Database from "./index.js";
import { Note, isDeleted } from "../types.js";
import { Cipher } from "@notesnook/crypto";
import { isFalse } from "../database/index.js";
import { logger } from "../logger.js";

type BaseShare = {
  id: string;
  title: string;
  userId: string;
  selfDestruct: boolean;
};
type UnencryptedShare = BaseShare & {
  content: string;
};
type EncryptedShare = BaseShare & {
  encryptedContent: Cipher<"base64">;
};
type Share = UnencryptedShare | EncryptedShare;

export type PublishOptions = { password?: string; selfDestruct?: boolean };
export class Shares {
  shares: string[] = [];
  constructor(private readonly db: Database) {}

  async clear() {
    this.shares = [];
    await this.db.kv().write("shares", this.shares);
  }

  async refresh() {
    try {
      const user = await this.db.user.getUser();
      const token = await this.db.tokenManager.getAccessToken();
      if (!user || !token || !user.isEmailConfirmed) return;

      const shares = await http.get(`${Constants.API_HOST}/shares`, token);
      await this.db.kv().write("shares", shares);
      if (shares) this.shares = shares;
    } catch (e) {
      logger.error(e, "Error while refreshing shares.");
    }
  }

  /**
   * Check if note is published.
   */
  isPublished(noteId: string) {
    return this.shares && this.shares.indexOf(noteId) > -1;
  }

  /**
   * Get note published share id
   */
  share(noteId: string) {
    return this.shares[this.shares.indexOf(noteId)];
  }

  /**
   * Publish a note as a share
   */
  async publish(noteId: string, opts: PublishOptions = {}) {
    if (!this.shares.length) await this.refresh();

    const update = !!this.isPublished(noteId);

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = await this.db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");
    if (!note.contentId) throw new Error("Cannot publish an empty note.");

    const contentItem = await this.db.content.get(note.contentId);

    if (!contentItem || isDeleted(contentItem))
      throw new Error("Could not find content for this note.");

    if (contentItem.locked) throw new Error("Cannot published locked notes.");

    const content = await this.db.content.downloadMedia(
      `share-${noteId}`,
      contentItem,
      false
    );

    const share: Share = {
      id: noteId,
      title: note.title,
      userId: user.id,
      selfDestruct: opts.selfDestruct || false,
      ...(opts.password
        ? {
            encryptedContent: await this.db
              .storage()
              .encrypt(
                { password: opts.password },
                JSON.stringify({ type: content.type, data: content.data })
              )
          }
        : {
            content: JSON.stringify({
              type: content.type,
              data: content.data
            })
          })
    };

    const method = update ? http.patch.json : http.post.json;

    const { id } = await method(`${Constants.API_HOST}/shares`, share, token);

    this.shares.push(id);
    return id;
  }

  /**
   * Unpublish a note
   */
  async unpublish(noteId: string) {
    if (!this.shares.length) await this.refresh();

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    if (!this.isPublished(noteId))
      throw new Error("This note is not published.");

    await http.delete(`${Constants.API_HOST}/shares/${noteId}`, token);

    this.shares.splice(this.shares.indexOf(noteId), 1);
  }

  get all() {
    return this.db.notes.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("id", "in", this.shares),
      this.db.options?.batchSize
    );
  }

  get(shareId: string) {
    return http.get(`${Constants.API_HOST}/shares/${shareId}`);
  }
}
