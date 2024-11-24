import frappe
import pandas as pd

def execute():
    # Path to the CSV file
    file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/item_new_valuation.csv"
    
    # Read the CSV file in chunks
    chunk_size = 100
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        for index, row in chunk.iterrows():
            item_code = row.get("item_code")
            valuation_rate = row.get("valuation_rate")
            
            if item_code and valuation_rate:
                # Update all Sales Invoice Items matching the item_code
                frappe.db.sql("""
                    UPDATE 
                        `tabSales Invoice Item`
                    SET 
                        incoming_rate = %s
                    WHERE 
                        item_code = %s
                """, (valuation_rate, item_code))
                print(f"Committing changes... {item_code} {valuation_rate}")
        print(f'Committing changes... {row.get("item_code")} {row.get("valuation_rate")}')
        frappe.db.commit()

    frappe.msgprint("Sales Invoice Item records updated successfully.")
