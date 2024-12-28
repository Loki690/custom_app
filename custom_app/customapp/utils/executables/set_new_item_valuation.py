import frappe
import pandas as pd
import csv

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

    print("Sales Invoice Item records updated successfully.")
    
def stock_ledger_entry_execute():
    # Path to the CSV file
    file_path = "/home/erpapp/frappe-bench/apps/custom_app/custom_app/customapp/utils/executables/item_new_valuation_3.csv"
    
    # Read the CSV file in chunks
    chunk_size = 100
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        for index, row in chunk.iterrows():
            item_code = row.get("item_code")
            valuation_rate = row.get("valuation_rate")
            
            if item_code and valuation_rate:
                # Update all Stock Ledger Entries matching the item_code
                frappe.db.sql("""
                    UPDATE 
                        `tabStock Ledger Entry`
                    SET 
                        valuation_rate = %s
                    WHERE 
                        item_code = %s
                """, (valuation_rate, item_code))
                
                print(f"Updated valuation rate for {item_code}: {valuation_rate}")
        
        # Commit changes after processing each chunk
        frappe.db.commit()
        print(f"Chunk committed successfully.")
    
    frappe.msgprint("Stock Ledger Entry records updated successfully.")
    
    
    
def update_item_master_valuation():
    # Path to the CSV file
    file_path = "/home/erpapp/frappe-bench/apps/custom_app/custom_app/customapp/utils/executables/item_new_valuation_2.csv"
    
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
    
def export_sales_invoice_item_data_with_principal_and_supplier():
    # Path to save the exported CSV file
    export_file_path = "/home/erpapp/frappe-bench/apps/custom_app/custom_app/customapp/utils/executables/exported_sales_invoice_item_with_principal_and_supplier.csv"
    
    # Query to fetch data from Sales Invoice Item with Principal and Supplier information
    query = """
        SELECT  
            GROUP_CONCAT(DISTINCT s.supplier_name) AS suppliers,
            i.custom_principal AS custom_principal,
            sii.parent AS invoice_number,
            sii.item_code,
            sii.item_name,
            sii.qty,
            sii.uom,
            sii.base_net_rate,
            sii.amount,
            sii.item_tax_template,
            sii.incoming_rate
          
        FROM
            `tabSales Invoice Item` sii
        LEFT JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            sii.docstatus != 2
            AND sii.creation BETWEEN '2024-10-01' AND '2024-10-31'
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
                "Suppliers", "Principal", "Invoice Number", "Item Code", "Item Name", "Quantity",
                "UOM", "Rate", "Amount", "Tax Template", "Incoming Rate",
            ])
            
            # Write each row of data
            for row in data:
                writer.writerow([
                    row["suppliers"] or "No Supplier",
                    row["custom_principal"] or "No Principal",
                    row["invoice_number"],
                    row["item_code"],
                    row["item_name"],
                    row["qty"],
                    row["uom"],
                    row["base_net_rate"],
                    row["amount"],
                    row["item_tax_template"],
                    row["incoming_rate"],
                ])
                print(f"Created Row for Item Code: {row['item_code']}")
        
        print(f"Sales Invoice Item data with principal and supplier exported successfully to {export_file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

import math

def export_sales_invoice_item_data_with_principal_and_supplier_in_batches():
    # Base path for saving exported CSV files
    base_export_file_path = "/home/erpapp/frappe-bench/apps/custom_app/custom_app/customapp/utils/exports"
    
    # Query to fetch data from Sales Invoice Item with Principal and Supplier information within a date range
    query = """
        SELECT
            GROUP_CONCAT(DISTINCT s.supplier_name) AS suppliers,
            i.custom_principal AS custom_principal,
            sii.parent AS invoice_number,
            sii.item_code,
            sii.item_name,
            sii.qty,
            sii.uom,
            sii.base_net_rate,
            sii.amount,
            sii.item_tax_template,
            sii.incoming_rate
        FROM
            `tabSales Invoice Item` sii
        LEFT JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            sii.docstatus != 2
            AND sii.creation BETWEEN '2024-10-01' AND '2024-10-31'
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
            print("No records found for the specified date range.")
            return
        
        # Define the batch size
        batch_size = 100000
        
        # Calculate the total number of batches
        total_batches = math.ceil(len(data) / batch_size)
        
        for batch_num in range(total_batches):
            # Calculate start and end indices for the current batch
            start_index = batch_num * batch_size
            end_index = start_index + batch_size
            
            # Get the current batch of data
            batch_data = data[start_index:end_index]
            
            # Define the file name for the current batch
            export_file_path = f"{base_export_file_path}_batch_{batch_num + 1}.csv"
            
            # Write batch data to a CSV file
            with open(export_file_path, mode='w', newline='') as file:
                writer = csv.writer(file)
                
                # Write the header
                writer.writerow([
                    "Custom Principal", "Suppliers", "Invoice Number", "Item Code", "Item Name", "Quantity",
                    "UOM", "Rate", "Amount", "Item Tax Template" "Incoming Rate",
                ])
                
                # Write each row of data
                for row in batch_data:
                    writer.writerow([
                        row["custom_principal"] or "No Principal",
                        row["suppliers"] or "No Supplier",
                        row["invoice_number"],
                        row["item_code"],
                        row["item_name"],
                        row["qty"],
                        row["uom"],
                        row["base_net_rate"],
                        row["amount"],
                        row["item_tax_template"],
                        row["incoming_rate"],
                    ])
                    print(f"Batch {batch_num + 1}: Created Row for Item Code: {row['item_code']}")
            
            print(f"Batch {batch_num + 1}: Data exported successfully to {export_file_path}")
        
        print("All batches exported successfully.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        
def export_sales_invoice_item_data_with_details():
    # Path to save the exported CSV file
    export_file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/exported_sales_invoice_item_data_nov-V5.csv"
    
    # Query to fetch data from Sales Invoice Item with additional details
    query = """
        SELECT  
            GROUP_CONCAT(DISTINCT s.supplier_name) AS suppliers,
            i.custom_principal AS custom_principal,
            sii.parent AS invoice_number,
            sii.item_code,
            sii.item_name,
            sii.qty,
            sii.uom,
            sii.base_net_rate,
            sii.amount,
            sii.item_tax_template,
            sii.incoming_rate,
            sii.discount_percentage,
            sii.discount_amount,
            si.posting_date,
            si.customer_name,
            si.customer_group,
            sii.warehouse,
            i.item_group
        FROM
            `tabSales Invoice Item` sii
        LEFT JOIN
            `tabSales Invoice` si ON si.name = sii.parent
        LEFT JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            sii.docstatus != 2
            AND si.posting_date BETWEEN '2024-11-01' AND '2024-11-30'
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
                "Suppliers", "Principal", "Invoice Number", "Item Code", "Item Name", "Quantity",
                "UOM", "Rate", "Amount", "Tax Template", "Incoming Rate", "Discount Percentage",
                "Discount Amount", "Posting Date", "Customer Name", "Customer Group",
                "Warehouse", "Item Group"
            ])
            
            # Write each row of data
            for row in data:
                # Use the helper function to format the posting date
                posting_date = convert_date_to_mm_dd_yyyy(row["posting_date"])
                
                writer.writerow([
                    row["suppliers"] or "No Supplier",
                    row["custom_principal"] or "No Principal",
                    row["invoice_number"],
                    row["item_code"],
                    row["item_name"],
                    row["qty"],
                    row["uom"],
                    row["base_net_rate"],
                    row["amount"],
                    row["item_tax_template"],
                    row["incoming_rate"],
                    row["discount_percentage"] or 0,
                    row["discount_amount"] or 0,
                    posting_date,
                    row["customer_name"] or "No Customer",
                    row["customer_group"] or "No Group",
                    row["warehouse"] or "No Warehouse",
                    row["item_group"] or "No Item Group"
                ])
                print(f"Created Row for Item Code: {row['item_code']}")
        
        print(f"Sales Invoice Item data with additional details exported successfully to {export_file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        
def convert_date_to_mm_dd_yyyy(date_obj):
    """Helper function to format date as MM/DD/YYYY"""
    if date_obj:
        return date_obj.strftime('%m/%d/%Y')
    return ""

def export_sales_invoice_item_data_with_details_posting_date():
    # Path to save the exported CSV file
    export_file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/exported_sales_invoice_item_data_oct_v5-new.csv"
    
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
            AND si.posting_date BETWEEN '2024-10-01' AND '2024-10-31'
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
        
        
def export_item_with_valuation():
    # Paths for input and output files
    input_file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/item_deals_discount.csv"
    output_file_path = "/home/jon/frappe-bench2/test-amesco/apps/custom_app/custom_app/customapp/utils/executables/item_valuation_deals_disc.csv"
    
    chunk_size = 100
    result_data = []  # To store results before writing to the output file
    
    for chunk in pd.read_csv(input_file_path, chunksize=chunk_size):
        for index, row in chunk.iterrows():
            item_id = row.get("ID")  # Get the ID column from the CSV file
            
            if item_id:
                try:
                    # Fetch valuation_rate and deals_discount based on the item ID
                    valuation_data = frappe.db.sql("""
                        SELECT 
                            valuation_rate
                        FROM 
                            `tabItem`
                        WHERE 
                            name = %s
                    """, (item_id,), as_dict=True)
                    
                    if valuation_data:
                        valuation_rate = valuation_data[0].get("valuation_rate")
                        
                        # Add the data to the result list
                        result_data.append({
                            "ID": item_id,
                            "valuation_rate": valuation_rate,
                        })

                        print(f"Fetched valuation_rate and deals_discount for Item ID: {item_id}, Valuation Rate: {valuation_rate}")
                    else:
                        print(f"No data found for Item ID: {item_id}")
                except Exception as e:
                    print(f"Error fetching data for Item ID: {item_id}, Error: {str(e)}")
    
    # Export the results to a new CSV file
    if result_data:
        result_df = pd.DataFrame(result_data)
        result_df.to_csv(output_file_path, index=False)
        print(f"Export completed successfully. Output file: {output_file_path}")
    else:
        print("No data to export.")

