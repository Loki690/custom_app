import io
import frappe
# import pandas as pd
import csv
# from custom_app.customapp.utils.gdrive.gdrive import upload_file
# from frappe.utils import get_files_path
from datetime import datetime
from datetime import date


# def execute(date_from, date_to):
#     # Path to the CSV file
#     file_name = "item_last_purchase.csv"
#     file_path = f"/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/{file_name}"
    
#     # Read CSV in chunks and update Sales Invoice Items
#     chunk_size = 100
#     for chunk in pd.read_csv(file_path, chunksize=chunk_size):
#         data_to_update = []
#         for _, row in chunk.iterrows():
#             item_code = row.get("item_code")
#             # valuation_rate = row.get("valuation_rate")
          
#             valuation_rate = row.get("valuation_rate", 0)
#             last_p_rate = row.get("last_p_rate", 0)
#             final_rate = last_p_rate if last_p_rate else valuation_rate
            
#             try:
#                 final_rate = round(float(final_rate), 2)
#                 if item_code:
#                     data_to_update.append((final_rate, item_code, date_from, date_to))
#             except (ValueError, TypeError):
#                 print(f"Invalid data for item: {item_code}")
        
#         # Update database for each item
#         for data in data_to_update:
#             try:
#                 frappe.db.sql(
#                     """
#                     UPDATE `tabSales Invoice Item` sii
#                     LEFT JOIN `tabSales Invoice` si ON si.name = sii.parent
#                     SET sii.incoming_rate = %s
#                     WHERE sii.item_code = %s
#                     AND si.posting_date BETWEEN %s AND %s
#                     """,
#                     data
#                 )
#                 frappe.db.commit()
#                 print(f"Item {data[1]} updated successfully.")
              
#             except Exception as e:
#                 print(f"Error updating item {data[1]}: {str(e)}")
                
#     print(f"{len(data_to_update)} Sales Invoice Items updated successfully.")

def convert_date_to_mm_dd_yyyy(date_obj):
    """Helper function to format date as MM/DD/YYYY"""
    if date_obj:
        return date_obj.strftime('%m/%d/%Y')
    return ""


def export_sales_invoice_item_data_with_details_posting_date(date_from, date_to):
    
    print("Generating CSV file...")
    
    query = """
        SELECT  
            GROUP_CONCAT(DISTINCT s.supplier_name) AS suppliers,
            i.custom_principal AS custom_principal,
            sii.parent AS invoice_number,
            sii.item_code,
            sii.item_name,
            i.item_group,
            ig.parent_item_group AS parent_item_group,  
            parent_ig.parent_item_group AS grandparent_item_group,  
            parent_root.parent_item_group AS parent_root,
            sii.qty,
            sii.uom,
            sii.conversion_factor,
            sii.base_net_rate,
            sii.base_net_amount,
            sii.item_tax_template,
            sii.incoming_rate,
            si.posting_date,
            si.customer_name,
            si.customer_group,
            sii.warehouse
        FROM
            `tabSales Invoice Item` sii
        LEFT JOIN
            `tabSales Invoice` si ON si.name = sii.parent
        LEFT JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN
            `tabItem Group` ig ON ig.name = i.item_group
        LEFT JOIN
            `tabItem Group` parent_ig ON parent_ig.name = ig.parent_item_group 
        LEFT JOIN
            `tabItem Group` parent_root ON parent_root.name = parent_ig.parent_item_group  
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            sii.docstatus != 2
            AND si.posting_date BETWEEN %s AND %s
        GROUP BY
            sii.parent, sii.item_code
        ORDER BY
            sii.item_code
    """
    
    try:
        data = frappe.db.sql(query, (date_from, date_to), as_dict=True)
        if not data:
            print("No records found.")
            return
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "suppliers", "custom_principal", "invoice_number", "item_code", "item_name", 
            "item_group", "parent_item_group", "grandparent_item_group", "parent_root", 
            "qty", "uom", "conversion_factor", "base_net_rate", "base_net_amount", "item_tax_template", 
            "incoming_rate", "posting_date", "customer_name", "customer_group", "warehouse"
        ])
        writer.writeheader()
        
        for row in data:
            row["posting_date"] = convert_date_to_mm_dd_yyyy(row["posting_date"])  # Use the helper function
            writer.writerow(row)
        output.seek(0)
        return output.getvalue()
    except Exception as e:
        print(f"Error: {str(e)}")
        
        
        
@frappe.whitelist() 
def process_csv_data(data):
    data = data.splitlines()
    reader = csv.DictReader(data)

    print("Processing CSV data...")

    processed_data = []
    for row in reader:
        parent_root = row.get('parent_root', '')
        grandparent_item_group = row.get('grandparent_item_group', '')
        parent_item_group = row.get('parent_item_group', '')
        item_group = row.get('item_group', '')

        # Set the correct 'parent_group' field
        if parent_root in ['Food', 'Medicine']:
            row['parent_group'] = parent_root
        elif parent_item_group in ['Instruments', 'Non-Food', 'Food']:
            row['parent_group'] = parent_item_group
        elif parent_item_group in ['Service Item - POS Entry']:
            row['parent_group'] = 'Service Item - POS Entry'
        elif grandparent_item_group in ['Non-Food', 'Food', 'Medicine']:
            row['parent_group'] = grandparent_item_group
        elif item_group in ['Favorway']:
            row['parent_group'] = 'Instruments'
        elif item_group in ['Store Supplies']:
            row['parent_group'] = 'Store Supplies'
        else:
            row['parent_group'] = ''

        # Remove unwanted columns
        row.pop('parent_root', None)
        row.pop('grandparent_item_group', None)
        row.pop('parent_item_group', None)

        processed_data.append(row)

    # Write processed data back to CSV format
    output = io.StringIO()
    fieldnames = [field for field in reader.fieldnames if field not in ['parent_root', 'grandparent_item_group', 'parent_item_group']]
    fieldnames.insert(fieldnames.index('item_group') + 1, 'parent_group')

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(processed_data)
    
    output.seek(0)
    return output.getvalue()



@frappe.whitelist()
def schedule_sales_invoice_item():
    
    date_from = date.today().replace(day=1).strftime('%Y-%m-%d') # First day of the current month
    date_to = date.today().strftime('%Y-%m-%d') # Current date
    
    export_sales_invoice(date_from, date_to)
    
    print(f"Updating Sales Invoice Items from {date_from} to {date_to}")


@frappe.whitelist()
def export_sales_invoice(date_from, date_to): 
    try:
        print(f"Processing sales invoice from {date_from} to {date_to}")

        # Generate raw CSV data
        raw_csv_data = export_sales_invoice_item_data_with_details_posting_date(date_from, date_to)
        
        if not raw_csv_data:
            return {"status": "error", "message": "No records found for the given date range."}

        # Process CSV Data (remove extra columns and format)
        processed_csv = process_csv_data(raw_csv_data)  # returns processed CSV data as a string

        # Convert processed CSV data to a dictionary with key-value pairs
        processed_data = list(csv.DictReader(io.StringIO(processed_csv)))
        
        print(processed_data)

        return {"status": "success", "message": processed_data}

    except Exception as e:
        frappe.log_error(f"Error exporting sales invoice: {str(e)}", "Export Sales Invoice")
        return {"status": "error", "message": f"Error: {str(e)}"}


