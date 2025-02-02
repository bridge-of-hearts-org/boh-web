""" This script pull Facility information from the Google Sheet that contains all the data """

import pandas as pd
import numpy as np
import json
from googleapiclient.discovery import build
from google.oauth2 import service_account

CSV_FNAME = "../data/dbData.csv"
JSON_FNAME = "../data/dbData.json"


def pullData(startCell: str, endCell: str):
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
    else:
        df = pd.DataFrame(values[1:])
        df.columns = values[0]
        df.to_csv(CSV_FNAME, index=False)


def generateJson():
    df = pd.read_csv(CSV_FNAME)

    # Define the columns to be selected
    selectedColumns = ["Name", "Address", "Managed By", "District", "Province", "Divisional Secretariat",
                       "Phone Numbers", "Email Addresses", "Website", "Count - Male", "Count - Female", "Count - Total"]

    # Rename columns
    df = df[selectedColumns].rename(columns={
        "Name": "name",
        "Managed By": "managedBy",
        "Address": "location.address",
        "District": "location.district",
        "Province": "location.province",
        "Divisional Secretariat": "location.divisionalSecretariat",
        "Phone Numbers": "contact.phone",
        "Email Addresses": "contact.email",
        "Website": "contact.website",
        "Count - Female": "residents.female",
        "Count - Male": "residents.male",
        "Count - Total": "residents.total",
    })

    # Clean up data
    df["managedBy"].replace(np.nan, "", inplace=True)
    df["contact.website"].replace(np.nan, "", inplace=True)
    df["contact.phone"] = df["contact.phone"].apply(lambda listStr: [] if pd.isna(
        listStr) else [x.strip() for x in listStr.split(",")])
    df["contact.email"] = df["contact.email"].apply(lambda listStr: [] if pd.isna(
        listStr) else [x.strip() for x in listStr.split(",")])

    jsonData = []

    for _, row in df.iterrows():
        facility = {}
        facility["name"] = row["name"]
        facility["type"] = "Voluntary Children's Home"
        facility["managedBy"] = row["managedBy"]
        facility["location"] = {
            "address": row["location.address"],
            "district": row["location.district"],
            "province": row["location.province"],
            "divisionalSecretariat": row["location.divisionalSecretariat"]
        }
        facility["contact"] = {
            "phone": row["contact.phone"],
            "email": row["contact.email"],
            "website": row["contact.website"]
        }
        facility["residents"] = {
            "total": int(row["residents.total"]) if not np.isnan(row["residents.total"]) else None,
            "male": int(row["residents.male"]) if not np.isnan(row["residents.male"]) else None,
            "female": int(row["residents.female"]) if not np.isnan(row["residents.female"]) else None,
        }

        jsonData.append(facility)

    json.dump(jsonData, open(JSON_FNAME, "w"), indent=4,)


if __name__ == "__main__":
    endColumn = "AE"
    endRow = 23

    pullData("A1", f"{endColumn}{endRow}")
    generateJson()
