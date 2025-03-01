""" This script pull Facility information from the Google Sheet that contains all the data """

import os
import requests
import json
import imghdr
import hashlib
import pandas as pd
import numpy as np
from googleapiclient.discovery import build
from google.oauth2 import service_account

DATA_DIR = "../data"
CSV_FNAME = f"{DATA_DIR}/dbData.csv"
JSON_FNAME = f"{DATA_DIR}/dbData.json"
PHOTOS_DIR = f"{DATA_DIR}/photos"


def pullData(startCell: str, endCell: str, configFname: str = "config.json", apiKeyFname: str = "google-api-key.json") -> pd.DataFrame:
    print("Pulling data from the Google Sheet")

    config = json.load(open(configFname))
    apiKeyFname = apiKeyFname
    permissions = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    range = f"Database!{startCell}:{endCell}"

    creds = service_account.Credentials.from_service_account_file(
        apiKeyFname, scopes=permissions)

    service = build("sheets", "v4", credentials=creds)
    result = service.spreadsheets().values().get(spreadsheetId=config["google-sheet-id"],
                                                 range=range).execute()
    values = result.get("values", [])

    if not values:
        print("Error: No data found")
        return pd.DataFrame()
    else:
        print(
            f"Successfully pulled data from the Google Sheet: {len(values)-1} facilities")
        df = pd.DataFrame(values[1:])
        df.columns = values[0]
        df.to_csv(CSV_FNAME, index=False)
        return df


def downloadPhoto(facilityName: str, url: str, outputDir: str) -> str:
    try:
        resp = requests.get(url.strip())
        if resp.status_code == 200:
            fileType = imghdr.what(None, resp.content)

            if fileType:
                # Use a trimmed hash of the content as the file name
                fileHash = hashlib.md5(resp.content).hexdigest()[:16]
                fileName = f"{fileHash}.{fileType}"

                with open(f"{outputDir}/{fileName}", "wb") as f:
                    f.write(resp.content)
                    return fileName
            else:
                print(f"Error: Could not determine file type: {facilityName} | {url}")
        else:
            print(f"Error: Could not download photo: {facilityName} | {url} | resp: {resp.status_code}")

    except Exception as e:
        print(f"Error while downloading photo: {facilityName} | {url}")
        print(e.with_traceback())

    return ""


def generateJson():
    print("Generating the JSON file and downloading photos")

    df = pd.read_csv(CSV_FNAME)

    # Define the columns to be selected
    selectedColumns = ["Name", "Slug", "Address", "Managed By", "Type", "City", "District", "Province", "Divisional Secretariat", "Google Maps", "Phone Numbers", "Email Addresses", "Website",
                       "Facebook", "Instagram", "Accepted Genders", "Age Range - Male", "Age Range - Female", "Age Range - All", "Count - Male", "Count - Female", "Count - Total",
                       "Photos", "Sources"]

    # Rename columns
    df = df[selectedColumns].rename(columns={
        "Name": "name",
        "Slug": "slug",
        "Managed By": "managedBy",
        "Type": "type",
        "Address": "location.address",
        "City": "location.city",
        "District": "location.district",
        "Province": "location.province",
        "Divisional Secretariat": "location.divisionalSecretariat",
        "Google Maps": "location.google",
        "Phone Numbers": "contact.phone",
        "Email Addresses": "contact.email",
        "Website": "contact.website",
        "Facebook": "contact.facebook",
        "Instagram": "contact.instagram",
        "Accepted Genders": "genders",
        "Count - Male": "occupancy.male",
        "Count - Female": "occupancy.female",
        "Count - Total": "occupancy.total",
        "Age Range - Male": "ageRanges.male",
        "Age Range - Female": "ageRanges.female",
        "Age Range - All": "ageRanges.all",
        "Photos": "photos",
        "Sources": "sources"
    }).fillna("")

    # --- Clean up data ---
    # Strip trailing spaces and slashes in website links
    df["contact.website"] = df["contact.website"].apply(
        lambda url: url.strip(" /"))

    # Create lists from phone numbers
    df["contact.phone"] = df["contact.phone"].apply(
        lambda listStr: [] if not listStr.strip() else [x.strip() for x in listStr.split(",")]
    )

    # Create lists from email addresses
    df["contact.email"] = df["contact.email"].apply(
        lambda listStr: [] if not listStr.strip() else [x.strip() for x in listStr.split(",")]
        )

    df["sources"] = df["sources"].apply(
        lambda listStr: [] if not listStr.strip() else [x.strip() for x in listStr.split("|")]
    )

    jsonData = []

    for idx, row in df.iterrows():
        # Only process if a slug is present
        if row["slug"].strip():
            # --- Validate ---
            assert row["genders"].strip() in ["Male", "Female",
                                              "Both", ""], f"Invalid gender: {row['genders']} | {row['name']}"
            assert np.all([number.startswith("0") and len(number) == 10
                           for number in row["contact.phone"]]), f"Invalid phone number: {row['contact.phone']} | {row['name']}"
            assert np.all([email.__contains__("@")
                           for email in row["contact.email"]])

            # --- Construct the JSON structure ---
            facility = {}
            facility["name"] = row["name"].strip()
            facility["slug"] = row["slug"].strip()
            facility["type"] = row["type"] if row["type"] else "Voluntary Children's Home"
            facility["managedBy"] = row["managedBy"].strip()
            facility["location"] = {
                "address": row["location.address"].strip(),
                "city": row["location.city"].strip(),
                "district": row["location.district"].strip(),
                "province": row["location.province"].strip(),
                "divisionalSecretariat": row["location.divisionalSecretariat"].strip(),
                "google": row["location.google"].strip("/ ")
            }
            facility["contact"] = {
                "phone": row["contact.phone"],
                "email": row["contact.email"],
                "website": row["contact.website"].strip("/ "),
                "facebook": row["contact.facebook"].strip("/ "),
                "instagram": row["contact.instagram"].strip("/ ")
            }
            facility["genders"] = row["genders"].strip().lower() if row["genders"].strip() else "unknown"
            facility["occupancy"] = {
                "total": int(row["occupancy.total"]) if row["occupancy.total"] else None,
                "male": int(row["occupancy.male"]) if row["occupancy.male"] else None,
                "female": int(row["occupancy.female"]) if row["occupancy.female"] else None
            }
            facility["ageRanges"] = {
                "all": row["ageRanges.all"],
                "male": row["ageRanges.male"],
                "female": row["ageRanges.female"]
            }
            facility["photos"] = []
            facility["sources"] = row["sources"]

            jsonData.append(facility)
            if (row["photos"]):
                outputDir = f"{PHOTOS_DIR}/{idx}"
                os.makedirs(outputDir, exist_ok=True)

                for url in row["photos"].split("|"):
                    url = url.strip(" /")

                    if url:
                        fname = downloadPhoto(row["name"], url, outputDir)
                        if fname:
                            facility["photos"].append({
                                "fileName": fname,
                                "source": url
                            })

    json.dump(jsonData, open(JSON_FNAME, "w"), indent=4,)
    print(f"Successfully generated the JSON file with {len(jsonData)} entries")


if __name__ == "__main__":
    endColumn = "AE"
    endRow = 94

    pullData("A1", f"{endColumn}{endRow}")
    generateJson()
