#! /usr/bin/env python3

import polib
import os


def verify_po_file(file_path):
    try:
        # Load the .po file
        po = polib.pofile(file_path)

        # Iterate through each entry in the .po file
        for entry in po:
            # Check if msgid or msgstr is empty
            if not entry.msgid or not entry.msgstr:
                print(f"Empty msgid or msgstr found at: {entry.occurrences}")

        print("Verification complete. No empty msgid or msgstr found.")

    except Exception as e:
        print(f"An error occurred: {e}")


for file in os.listdir("locale"):
    if file != "pseudo-LOCALE.po" and file.endswith(".po"):
        print(f"Verifying {file}...")
        po_file_path = f"locale/{file}"
        verify_po_file(po_file_path)
