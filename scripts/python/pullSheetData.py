""" This script pull Facility information from the Google Sheet that contains all the data """

import pandas as pd
import numpy as np
import json
from googleapiclient.discovery import build
from google.oauth2 import service_account

CSV_FNAME = "../data/dbData.csv"
JSON_FNAME = "../data/dbData.json"


def pullData(startCell: str, endCell: str) -> pd.DataFrame:
    config = json.load(open("config.json"))
    apiKeyFname = "google-api-key.json"
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
        df = pd.DataFrame(values[1:])
        df.columns = values[0]
        df.to_csv(CSV_FNAME, index=False)
        return df


def generateJson():
    df = pd.read_csv(CSV_FNAME)

    # Define the columns to be selected
    selectedColumns = ["Name", "Address", "Managed By", "City", "District", "Province", "Divisional Secretariat", "Google Maps", "Phone Numbers", "Email Addresses", "Website",
                       "Facebook", "Instagram", "Accepted Genders", "Age Range - Male", "Age Range - Female", "Age Range - All", "Count - Male", "Count - Female", "Count - Total"]

    # Rename columns
    df = df[selectedColumns].rename(columns={
        "Name": "name",
        "Managed By": "managedBy",
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
    })

    # --- Clean up data ---
    df["managedBy"].replace(np.nan, "", inplace=True)
    df["location.city"].replace(np.nan, "", inplace=True)
    df["location.google"].replace(np.nan, "", inplace=True)
    df["contact.website"].replace(np.nan, "", inplace=True)
    df["contact.facebook"].replace(np.nan, "", inplace=True)
    df["contact.instagram"].replace(np.nan, "", inplace=True)
    df["ageRanges.male"].replace(np.nan, "", inplace=True)
    df["ageRanges.female"].replace(np.nan, "", inplace=True)
    df["ageRanges.all"].replace(np.nan, "", inplace=True)

    # Strip trailing spaces and slashes in website links
    df["contact.website"] = df["contact.website"]

    # Create lists from phone numbers
    df["contact.phone"] = df["contact.phone"].apply(lambda listStr: [] if pd.isna(
        listStr) else [x.strip() for x in listStr.split(",")])

    # Create lists from email addresses
    df["contact.email"] = df["contact.email"].apply(lambda listStr: [] if pd.isna(
        listStr) else [x.strip() for x in listStr.split(",")])

    jsonData = []

    for _, row in df.iterrows():
        # --- Validate ---
        assert row["genders"] in ["Male", "Female", "Both"]
        assert np.all([number.startswith("0") and len(number) == 10
                      for number in row["contact.phone"]])
        assert np.all([email.__contains__("@")
                      for email in row["contact.email"]])

        # --- Construct the JSON structure ---
        facility = {}
        facility["name"] = row["name"].strip()
        facility["type"] = "Voluntary Children's Home"
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
        facility["genders"] = row["genders"].strip().lower()
        facility["occupancy"] = {
            "total": int(row["occupancy.total"]) if not np.isnan(row["occupancy.total"]) else None,
            "male": int(row["occupancy.male"]) if not np.isnan(row["occupancy.male"]) else None,
            "female": int(row["occupancy.female"]) if not np.isnan(row["occupancy.female"]) else None
        }
        facility["ageRanges"] = {
            "all": row["ageRanges.all"],
            "male": row["ageRanges.male"],
            "female": row["ageRanges.female"]
        }

        jsonData.append(facility)

    json.dump(jsonData, open(JSON_FNAME, "w"), indent=4,)


if __name__ == "__main__":
    endColumn = "AE"
    endRow = 23

    pullData("A1", f"{endColumn}{endRow}")
    generateJson()
