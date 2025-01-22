import frappe
import pandas as pd
import csv
import math


def execute():
    
    # Path to the CSV file
    file_name = "update_item_with_deals_discount.csv"
    file_path = f"/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/{file_name}"
    
    # Read the CSV file in chunks
    chunk_size = 100
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        for index, row in chunk.iterrows():
            item_code = row.get("item_code")
            valuation_rate = row.get("valuation_rate")
            
            # Validate and convert data before updating
            try:
                valuation_rate = round(float(valuation_rate), 2)
            except (ValueError, TypeError):
                print(f"Invalid valuation rate for item: {item_code}")
                continue  # Skip invalid rows
            
            if item_code:
                # Update all Sales Invoice Items matching the item_code
                frappe.db.sql("""
                    UPDATE 
                        `tabSales Invoice Item`
                    SET 
                        incoming_rate = %s
                    WHERE 
                        item_code = %s
                """, (valuation_rate, item_code))
                print(f"Updated {item_code} with rate {valuation_rate}")

        frappe.db.commit()

    print("Sales Invoice Item records updated successfully.")
    
def update_item_master_valuation():
    # Path to the CSV file
    file_path = "/home/test/frappe-bench/apps/custom_app/custom_app/customapp/utils/executables/update_valuation.csv"
    
    chunk_size = 100
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        for index, row in chunk.iterrows():
            item_code = row.get("item_code")
            valuation_rate = row.get("valuation_rate")
            
            if item_code and valuation_rate:
                try:
                    # Update the valuation_rate in the Item master
                    frappe.db.sql("""
                        UPDATE 
                            `tabItem`
                        SET 
                            valuation_rate = %s
                        WHERE 
                            name = %s
                    """, (valuation_rate, item_code))

                    print(f"Updated valuation_rate for Item: {item_code}, New Rate: {valuation_rate}")
                except Exception as e:
                    print(f"Error updating Item: {item_code}, Error: {str(e)}")
        
        # Commit changes after processing each chunk
        frappe.db.commit()
        print("Chunk committed successfully.")
    
    frappe.msgprint("Item master records updated successfully.")
    
def convert_date_to_mm_dd_yyyy(date_obj):
    """Helper function to format date as MM/DD/YYYY"""
    if date_obj:
        return date_obj.strftime('%m/%d/%Y')
    return ""

def export_sales_invoice_item_data_with_details_posting_date():
    # Path to save the exported CSV file
    export_file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/exported_sales_invoice_item_data_dec_v5-new.csv"
    
    # Query to fetch data from Sales Invoice Item with additional details
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
            sii.base_net_rate,
            sii.amount,
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
            AND si.posting_date BETWEEN '2024-12-01' AND '2024-12-31'
        GROUP BY
            sii.parent, sii.item_code
        ORDER BY
            sii.item_code
    """
    
    try:
        # Fetch the data
        data = frappe.db.sql(query, as_dict=True)
        
        # Check if data is returned
        if not data:
            print("No records found.")
            return
        
        # Write data to a CSV file
        with open(export_file_path, mode='w', newline='') as file:
            writer = csv.writer(file)
            
            # Write the header
            writer.writerow([
                "Suppliers", "Principal", "Invoice Number", "Item Code", "Item Name", "Item Group", 
                "Parent Item Group", "Grandparent Item Group", "Parent Root", "Quantity", "UOM", "Rate", "Amount", 
                "Tax Template", "Incoming Rate", "Posting Date", "Customer Name", "Customer Group", "Warehouse"
            ])
            
            # Write each row of data
            for row in data:
                # Format the posting date
                posting_date = convert_date_to_mm_dd_yyyy(row["posting_date"])
                
                writer.writerow([
                    row["suppliers"] or "No Supplier",
                    row["custom_principal"] or "No Principal",
                    row["invoice_number"],
                    row["item_code"],
                    row["item_name"],
                    row["item_group"] or "No Item Group",
                    row["parent_item_group"] or "No Parent Group",
                    row["grandparent_item_group"] or "No Grandparent Group",
                    row["parent_root"] or "No Grandparent Group",
                    row["qty"],
                    row["uom"],
                    row["base_net_rate"],
                    row["amount"],
                    row["item_tax_template"],
                    row["incoming_rate"],
                    posting_date,
                    row["customer_name"] or "No Customer",
                    row["customer_group"] or "No Group",
                    row["warehouse"] or "No Warehouse"
                ])
                print(f"Created Row for Item Code: {row['item_code']}")
        
        print(f"Sales Invoice Item data with additional details exported successfully to {export_file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")