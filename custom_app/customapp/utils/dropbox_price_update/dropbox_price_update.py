import frappe
import dropbox
import csv
import requests
from frappe.utils import get_files_path
from frappe import _

# Dropbox App credentials
APP_KEY = 'rdyekitmskfb1jp'  # Replace with your app key
APP_SECRET = 'cjue7zlj3igmenv'  # Replace with your app secret
REFRESH_TOKEN = 'XPCkXeWH0JAAAAAAAAAAAYJD_PklQXUPo5BkwpfKPut1OBU_Q0SFwYVgaEkYTj2f'

def get_new_access_token(app_key, app_secret, refresh_token):
    """Generate a new access token using the refresh token."""
    url = "https://api.dropboxapi.com/oauth2/token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    response = requests.post(url, data=data, auth=(app_key, app_secret))
    if response.status_code == 200:
        access_token = response.json().get("access_token")
        return access_token
    else:
        frappe.log_error(f"Error refreshing access token: {response.text}", "Dropbox Token Refresh Error")
        raise Exception("Failed to refresh Dropbox access token.")

@frappe.whitelist()
def upload_item_prices_to_dropbox():
    try:
        # Step 1: Get new Dropbox access token
        access_token = get_new_access_token(APP_KEY, APP_SECRET, REFRESH_TOKEN)
        dbx = dropbox.Dropbox(access_token)

        # Step 2: Generate CSV file
        file_name = "Item Price.csv"
        file_path = generate_item_prices_csv(file_name)

        # Step 3: Upload to Dropbox
        folder_name = "/Item Price"
        create_folder_if_not_exists(dbx, folder_name)
        upload_file_to_dropbox(dbx, file_path, folder_name, file_name)

        return {"success": True, "message": _("Item Prices CSV uploaded to Dropbox successfully.")}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error uploading Item Prices to Dropbox"))
        return {"success": False, "message": str(e)}

def generate_item_prices_csv(file_name):
    """Generate a CSV file containing detailed Item Prices."""
    file_path = f"{get_files_path()}/{file_name}"
    
    # Fetch Item Price data with the updated SQL logic
    item_prices = frappe.db.sql("""
        SELECT
            s.supplier_name AS supplier,
            i.custom_principal AS principal,
            i.item_group AS item_group,
            i.name AS item_code,
            i.item_name AS item_name,
            ip.uom AS uom,
            ip.price_list AS price_list,
            ip.price_list_rate AS selling_price,
            ip.currency AS currency
        FROM
            `tabItem Price` ip
        JOIN
            `tabItem` i ON ip.item_code = i.name
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            ip.selling = 1
            AND i.valuation_rate > 0
        GROUP BY
            i.name, ip.price_list
        ORDER BY
            i.name ASC
    """, as_dict=True)

    # Write data to CSV
    with open(file_path, mode="w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        # Write the header row
        writer.writerow([
            "Supplier", "Principal", "Item Group", "Item Code", "Item Name",
            "UOM", "Price List", "Selling Price", "Currency"
        ])
        
        # Write each row of data
        for row in item_prices:
            writer.writerow([
                row.get("supplier", ""),
                row.get("principal", ""),
                row.get("item_group", ""),
                row.get("item_code", ""),
                row.get("item_name", ""),
                row.get("uom", ""),
                row.get("price_list", ""),
                row.get("selling_price", ""),
                row.get("currency", ""),
            ])
    
    return file_path


def create_folder_if_not_exists(dbx, folder_name):
    """Create a folder in Dropbox if it doesn't already exist."""
    try:
        dbx.files_get_metadata(folder_name)  # Check if folder exists
    except dropbox.exceptions.ApiError as e:
        if isinstance(e.error, dropbox.files.GetMetadataError) and e.error.is_path():
            dbx.files_create_folder(folder_name)
        else:
            raise e

# def upload_file_to_dropbox(dbx, file_path, folder_name, file_name):
#     """Upload a file to Dropbox."""
#     with open(file_path, "rb") as f:
#         dbx.files_upload(f.read(), f"{folder_name}/{file_name}", mode=dropbox.files.WriteMode("overwrite"))
        
        
        
def upload_file_to_dropbox(dbx, file_path, folder_name, file_name):
    """Delete existing file and upload a new one to Dropbox."""
    dropbox_file_path = f"{folder_name}/{file_name}"
    
    # Step 1: Delete the existing file if it exists
    try:
        dbx.files_delete_v2(dropbox_file_path)
        frappe.log_error(f"Deleted existing file: {dropbox_file_path}", "Dropbox File Delete")
    except dropbox.exceptions.ApiError as e:
        if isinstance(e.error, dropbox.files.DeleteError) and e.error.is_path_lookup():
            # File does not exist; safe to ignore
            frappe.log_error(f"File not found (no need to delete): {dropbox_file_path}", "Dropbox File Delete")
        else:
            raise e  # Re-raise other errors

    # Step 2: Upload the new file
    with open(file_path, "rb") as f:
        dbx.files_upload(f.read(), dropbox_file_path, mode=dropbox.files.WriteMode("overwrite"))
        frappe.log_error(f"Uploaded new file: {dropbox_file_path}", "Dropbox File Upload")

