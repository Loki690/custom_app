import frappe
import xml.etree.ElementTree as ET
from xml.dom.minidom import parseString
import random

@frappe.whitelist()
def generate_stock_trans_xml_pos(start_date, end_date):
    """Generate XML data from POS Invoice Item within a date range."""
    try:
        # Query to fetch data with a limit of 10 rows for testing
        print(f"Generating XML file for transactions between {start_date} and {end_date}")
        
        query = f"""
        SELECT
            i.custom_edpms_code AS hprodid,
            i.item_name AS brand,
            pii.rate AS p_sales,
            (SELECT valuation_rate FROM `tabStock Ledger Entry` 
             WHERE item_code = pii.item_code 
             ORDER BY posting_date DESC, posting_time DESC LIMIT 1) AS p_purchase,
            '{start_date}T00:00:00' AS tran_date,
            1 AS stock
        FROM
            `tabPOS Invoice` pi
        INNER JOIN
            `tabPOS Invoice Item` pii ON pi.name = pii.parent
        INNER JOIN
            `tabItem` i ON i.name = pii.item_code
        LEFT JOIN 
            `tabItem Price` ip ON ip.item_code = i.name 
            AND ip.selling = 1
            AND ip.price_list = 'Standard Selling'
            AND ip.uom = 'PC'
        WHERE
            pi.docstatus = 1
            AND i.custom_edpms_code != 'NULL'
            AND i.custom_edpms_code != ''
            AND i.custom_edpms_code != '0'
            AND pi.posting_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY i.custom_edpms_code, i.item_name
        """
        
        data = frappe.db.sql(query, as_dict=True)

        # Define namespaces
        namespaces = {"xsi": "http://www.w3.org/2001/XMLSchema-instance"}
        ET.register_namespace("xsi", namespaces["xsi"])

        # Create root element with namespace
        root = ET.Element("data", {
            "xmlns:xsi": namespaces["xsi"],
            "xsi:noNamespaceSchemaLocation": "stock_trans_d.xsd",
        })

        # Add version data
        version = ET.SubElement(root, "version")
        ET.SubElement(version, "software").text = "3.9"
        ET.SubElement(version, "db").text = "1.6"

        # Define chunk size
        chunk_size = 100
        total_rows = len(data)
        chunks = [data[i:i + chunk_size] for i in range(0, total_rows, chunk_size)]

        for chunk_idx, chunk in enumerate(chunks, start=1):
            print(f"Processing chunk {chunk_idx}/{len(chunks)}...")
            for idx, row in enumerate(chunk, start=1):
                row_element = ET.SubElement(root, "row", {"id": str((chunk_idx - 1) * chunk_size + idx)})
                ET.SubElement(row_element, "coy_code").text = "RDI-R11-DS-0751"
                ET.SubElement(row_element, "hprodid").text = row["hprodid"]
                ET.SubElement(row_element, "brand").text = row["brand"].split()[0]  # get only the first word value
                ET.SubElement(row_element, "p_sales").text = f"{row['p_sales']:.2f}"
                ET.SubElement(row_element, "p_purchase").text = f"{row['p_purchase']:.2f}"
                ET.SubElement(row_element, "tran_date").text = row["tran_date"]
                ET.SubElement(row_element, "stock").text = str(random.randint(1, 20))  # Random stock value up to 20
                # Add a blank line between rows
                ET.SubElement(root, "row")
                print(f"Row {idx} in chunk {chunk_idx} added to XML")

        # Convert the ElementTree to a string
        rough_string = ET.tostring(root, encoding="utf-8")
        
        # Prettify using xml.dom.minidom
        parsed = parseString(rough_string)
        pretty_xml = parsed.toprettyxml(indent="  ")

        # Write the prettified XML to a file
        file_name = "doh_d_bal.xml"
        file_path = f"{frappe.utils.get_files_path()}/{file_name}"
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(pretty_xml)

        # Return the file content as response
        with open(file_path, "r", encoding="utf-8") as file:
            file_content = file.read()

        return {"success": True, "file_content": file_content}

    except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Error generating XML file")
            return {"success": False, "message": str(e)}


@frappe.whitelist()
def generate_stock_trans_xml_sales(start_date, end_date):
    """Generate XML data from Sales Invoice Items within a date range."""
    try:
        # Query to fetch data with the given conditions
        print(f"Generating XML file for sales transactions between {start_date} and {end_date}")
        
        query = f"""
        SELECT
            i.custom_edpms_code AS hprodid,
            i.item_name AS brand,
            ip.price_list_rate AS p_sales, -- Fetch rate from Item Price
            (SELECT valuation_rate 
             FROM `tabStock Ledger Entry` 
             WHERE item_code = sii.item_code 
             ORDER BY posting_date DESC, posting_time DESC LIMIT 1) AS p_purchase, -- Fetch valuation rate from Stock Ledger Entry
            '{start_date}T00:00:00' AS tran_date,
            1 AS stock
        FROM
            `tabSales Invoice` si
        INNER JOIN
            `tabSales Invoice Item` sii ON si.name = sii.parent
        INNER JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN 
            `tabItem Price` ip ON ip.item_code = i.name 
            AND ip.selling = 1
            AND ip.price_list = 'Standard Selling'
            AND ip.uom = 'PC'
        WHERE
            si.docstatus = 1
            AND sii.warehouse = 'CSD - ADC' -- Filter for warehouse
            AND i.custom_edpms_code != 'NULL'
            AND i.custom_edpms_code != ''
            AND i.custom_edpms_code != '0'
            AND si.posting_date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY 
            i.custom_edpms_code, i.item_name
        """
        
        data = frappe.db.sql(query, as_dict=True)

        # Define namespaces
        namespaces = {"xsi": "http://www.w3.org/2001/XMLSchema-instance"}
        ET.register_namespace("xsi", namespaces["xsi"])

        # Create root element with namespace
        root = ET.Element("data", {
            "xmlns:xsi": namespaces["xsi"],
            "xsi:noNamespaceSchemaLocation": "stock_trans_d.xsd",
        })

        # Add version data
        version = ET.SubElement(root, "version")
        ET.SubElement(version, "software").text = "3.9"
        ET.SubElement(version, "db").text = "1.6"

        # Define chunk size
        chunk_size = 100
        total_rows = len(data)
        chunks = [data[i:i + chunk_size] for i in range(0, total_rows, chunk_size)]

        for chunk_idx, chunk in enumerate(chunks, start=1):
            print(f"Processing chunk {chunk_idx}/{len(chunks)}...")
            for idx, row in enumerate(chunk, start=1):
                row_element = ET.SubElement(root, "row", {"id": str((chunk_idx - 1) * chunk_size + idx)})
                ET.SubElement(row_element, "coy_code").text = "RDI-R11-DW-0093"
                ET.SubElement(row_element, "hprodid").text = row["hprodid"]
                ET.SubElement(row_element, "brand").text = row["brand"].split()[0]  # get only the first word value
                ET.SubElement(row_element, "p_sales").text = f"{row['p_sales']:.2f}"
                ET.SubElement(row_element, "p_purchase").text = f"{row['p_purchase']:.2f}" if row["p_purchase"] else "0.00"
                ET.SubElement(row_element, "tran_date").text = row["tran_date"]
                ET.SubElement(row_element, "stock").text = str(random.randint(1, 20))  # Random stock value up to 20
                
                # Add a blank line between rows
                ET.SubElement(root, "row")
                print(f"Row {idx} in chunk {chunk_idx} added to XML")

        # Convert the ElementTree to a string
        rough_string = ET.tostring(root, encoding="utf-8")
        
        # Prettify using xml.dom.minidom
        parsed = parseString(rough_string)
        pretty_xml = parsed.toprettyxml(indent="  ")

        # Write the prettified XML to a file
        file_name = "doh_d_bal.xml"
        file_path = f"{frappe.utils.get_files_path()}/{file_name}"
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(pretty_xml)

        # Return the file content as response
        with open(file_path, "r", encoding="utf-8") as file:
            file_content = file.read()

        return {"success": True, "file_content": file_content}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error generating XML file for Sales")
        return {"success": False, "message": str(e)}
