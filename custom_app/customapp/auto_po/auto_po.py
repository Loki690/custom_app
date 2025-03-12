# import frappe
# import json

# def fetch_adm_data():
#     """Fetches ADM data from the database."""
#     sql_query = """
#         SELECT
#             bin.warehouse AS warehouse,
#             sii.item_code AS item_code,
#             sii.item_name AS item_name,
#             i.custom_principal AS principal,
#             GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ') AS suppliers,
#             SUM(sii.qty * sii.conversion_factor) / 97 AS adm,  -- Fixed to 97 days
#             bin.actual_qty AS qoh,  -- Quantity on Hand
#             transit_bin.actual_qty AS incoming,  -- Incoming stock
#             (SUM(sii.qty * sii.conversion_factor) / 97) * 37 AS reorder_point,
#             ((SUM(sii.qty * sii.conversion_factor) / 97) * 37) - (bin.actual_qty + transit_bin.actual_qty) AS suggest_order,
#             ip.uom AS uom,
#             CASE
#                 WHEN ip.uom = "PC" THEN 1
#                 ELSE ucf.value
#             END AS uom_conversion,
#             CEIL((((SUM(sii.qty * sii.conversion_factor) / 97) * 37) - (bin.actual_qty + transit_bin.actual_qty)) /
#                 CASE
#                     WHEN ip.uom = "PC" THEN 1
#                     ELSE ucf.value
#                 END) AS final_order
#         FROM
#             `tabSales Invoice Item` sii
#         JOIN
#             `tabSales Invoice` si ON si.name = sii.parent
#         JOIN
#             `tabBin` bin ON bin.item_code = sii.item_code AND bin.warehouse = sii.warehouse
#         JOIN
#             `tabWarehouse` w ON w.name = bin.warehouse
#         LEFT JOIN
#             `tabBin` transit_bin ON transit_bin.item_code = sii.item_code AND transit_bin.warehouse = w.default_in_transit_warehouse
#         JOIN
#             `tabItem` i ON i.name = sii.item_code
#         LEFT JOIN (
#             SELECT parent AS item_code, MIN(supplier) AS supplier
#             FROM `tabItem Supplier`
#             GROUP BY parent
#         ) isup ON isup.item_code = i.name
#         LEFT JOIN `tabSupplier` s ON s.name = isup.supplier
#         LEFT JOIN (
#             SELECT item_code, MIN(price_list_rate) AS price, uom
#             FROM `tabItem Price`
#             WHERE price_list = 'Standard Buying'
#             GROUP BY item_code
#         ) ip ON ip.item_code = sii.item_code
#         LEFT JOIN (
#             SELECT from_uom, value
#             FROM `tabUOM Conversion Factor`
#             GROUP BY from_uom
#         ) ucf ON ucf.from_uom = ip.uom
#         WHERE
#             si.docstatus = 1
#             AND si.posting_date >= (CURDATE() - INTERVAL 97 DAY)
#         GROUP BY
#             bin.warehouse, sii.item_code, i.custom_principal, bin.actual_qty, w.default_in_transit_warehouse, transit_bin.actual_qty
#         ORDER BY
#             bin.warehouse ASC, si.posting_date DESC;
#         LIMIT 300;
#     """

#     return frappe.db.sql(sql_query, as_dict=True)

# def process_adm_data():
#     """Processes ADM data, groups by supplier and principal, and formats for PO."""
#     adm_data = fetch_adm_data()

#     po_data = {}

#     for item in adm_data:
#         supplier = item.get("suppliers", "").split(", ")[0]  # Take first supplier
#         principal = item.get("principal")

#         if not supplier or not principal:
#             continue

#         # Group by Supplier & Principal
#         if supplier not in po_data:
#             po_data[supplier] = {}

#         if principal not in po_data[supplier]:
#             po_data[supplier][principal] = []

#         po_data[supplier][principal].append({
#             "item_code": item["item_code"],
#             "item_name": item["item_name"],
#             "warehouse": item["warehouse"],
#             "final_order": item["final_order"],
#             "uom": item["uom"]
#         })

#     return po_data

# def create_purchase_orders():
#     """Creates Purchase Orders in Frappe from processed ADM data."""
#     po_data = process_adm_data()


#     for supplier, principals in po_data.items():
#         for principal, items in principals.items():
#             if not items:
#                 continue

#             # Create Purchase Order
#             po = frappe.get_doc({
#                 "doctype": "Purchase Order",
#                 "supplier": supplier,
#                 "schedule_date": frappe.utils.nowdate(),
#                 "items": []
#             })

#             for item in items:
#                 po.append("items", {
#                     "item_code": item["item_code"],
#                     "item_name": item["item_name"],
#                     "schedule_date": frappe.utils.nowdate(),
#                     "qty": item["final_order"],
#                     "warehouse": item["warehouse"],
#                     "uom": item["uom"]
#                 })

#             po.insert()
#             po.submit()
#             frappe.db.commit()
#             frappe.msgprint(f"Purchase Order created for Supplier: {supplier}, Principal: {principal}")

# # Run the automation
# create_purchase_orders()
import frappe
import json
from datetime import datetime
from typing import List, Dict


def save_adm_data_to_json(data: List[Dict]) -> str:
    """
    Saves ADM data to a JSON file in Frappe.
    
    Args:
        data (List[Dict]): ADM data to save
    
    Returns:
        str: File name of the saved JSON
    """
    file_name = f"ADM_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    file_doc = frappe.get_doc({
        "doctype": "File",
        "file_name": file_name,
        "content": json.dumps(data, indent=4),
        "is_private": 1,
    })
    file_doc.save()
    frappe.db.commit()
    return file_doc.file_name


def process_adm_data(chunk_size: int = 5000) -> Dict:
    """
    Processes ADM data with chunked processing.
    
    Args:
        chunk_size (int): Number of records to process in each iteration
    
    Returns:
        Dict: Processed purchase order data
    """
    adm_data = adm_by_supplier_and_principal()
    

    # Save ADM data as JSON
    json_file_name = save_adm_data_to_json(adm_data)
    frappe.msgprint(f"ADM data saved as JSON file: {json_file_name}")
    print(f"ADM data saved as JSON file: {json_file_name}")

    po_data = {}

    for item in adm_data:
        supplier = item.get("suppliers")  # Take first supplier
        principal = item.get("principal")

        if not supplier or not principal:
            continue

        # Group by Supplier & Principal
        if supplier not in po_data:
            po_data[supplier] = {}

        if principal not in po_data[supplier]:
            po_data[supplier][principal] = []

        po_data[supplier][principal].append({
            "item_code": item["item_code"],
            "item_name": item["item_name"],
            "warehouse": item["warehouse"],
            "final_order": item["final_order"],
            "uom": item["uom"],
        })

    print(f"Processed ADM data: {json.dumps(po_data, indent=4)}")
    return po_data


def create_purchase_orders(chunk_size: int = 100):
    """
    Creates Purchase Orders in Frappe from processed ADM data.
    
    Args:
        chunk_size (int): Number of items to process in batches
    """
    po_data = process_adm_data()

    for supplier, principals in po_data.items():
        for principal, items in principals.items():
            # Process items in chunks to prevent memory overload
            for i in range(0, len(items), chunk_size):
                chunk_items = items[i:i+chunk_size]

                if not chunk_items:
                    continue

                # Create Purchase Order
                po = frappe.get_doc({
                    "doctype": "Purchase Order",
                    "supplier": supplier,
                    "custom_principal": principal,
                    "schedule_date": frappe.utils.add_days(frappe.utils.nowdate(), 7),  # add 7 days to the current date
                    "items": [],
                })

                for item in chunk_items:
                    po.append("items", {
                        "item_code": item["item_code"],
                        "item_name": item["item_name"],
                        "schedule_date": frappe.utils.add_days(frappe.utils.nowdate(), 7),
                        "qty": item["final_order"],
                        "warehouse": item["warehouse"],
                        "uom": item["uom"],
                    })

                po.insert()
                # po.submit()
                frappe.db.commit()
                frappe.msgprint(
                    f"Purchase Order created for Supplier: {supplier}, "
                    f"Principal: {principal}, Batch: {i//chunk_size + 1}"
                )
                
                
def adm_by_supplier_and_principal(supplier: str = None, principal: str = None, chunk_size: int = 1000):
    """
    Fetches ADM data from the database and processes it by supplier and principal.
    Only includes rows where final_order is positive.
    """
    offset = 0
    all_results = []

    while True:
        sql_query = f"""
        SELECT
            bin.warehouse AS warehouse,
            sii.item_code AS item_code,
            sii.item_name AS item_name,
            i.custom_principal AS principal,
            s.name AS suppliers,
            SUM(sii.qty * sii.conversion_factor) / 97 AS adm,
            bin.actual_qty AS qoh,
            transit_bin.actual_qty AS incoming,
            (SUM(sii.qty * sii.conversion_factor) / 97) * 37 AS reorder_point,
            ((SUM(sii.qty * sii.conversion_factor) / 97) * 37) - (bin.actual_qty + transit_bin.actual_qty) AS suggest_order,
            ip.uom AS uom,
            CASE 
                WHEN ip.uom = "PC" THEN 1
                ELSE ucf.value
            END AS uom_conversion,
            CEIL((((SUM(sii.qty * sii.conversion_factor) / 97) * 37) - (bin.actual_qty + transit_bin.actual_qty)) / 
                CASE 
                    WHEN ip.uom = "PC" THEN 1
                    ELSE ucf.value
                END) AS final_order
        FROM
            `tabSales Invoice Item` sii
        JOIN
            `tabSales Invoice` si ON si.name = sii.parent
        JOIN
            `tabBin` bin ON bin.item_code = sii.item_code AND bin.warehouse = sii.warehouse
        JOIN
            `tabWarehouse` w ON w.name = bin.warehouse
        LEFT JOIN
            `tabBin` transit_bin ON transit_bin.item_code = sii.item_code AND transit_bin.warehouse = w.default_in_transit_warehouse
        JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN (
            SELECT parent AS item_code, MIN(supplier) AS supplier
            FROM `tabItem Supplier`
            GROUP BY parent
        ) isup ON isup.item_code = i.name
        LEFT JOIN `tabSupplier` s ON s.name = isup.supplier
        LEFT JOIN (
            SELECT item_code, MIN(price_list_rate) AS price, uom
            FROM `tabItem Price`
            WHERE price_list = 'Standard Buying'
            GROUP BY item_code
        ) ip ON ip.item_code = sii.item_code
        LEFT JOIN (
            SELECT from_uom, value
            FROM `tabUOM Conversion Factor`
            GROUP BY from_uom
        ) ucf ON ucf.from_uom = ip.uom
        WHERE
            si.docstatus = 1
            AND si.posting_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 97 DAY) AND CURDATE()
            AND w.name = "Polomolok - ADC"
        GROUP BY
            bin.warehouse, sii.item_code, i.custom_principal, bin.actual_qty, 
            w.default_in_transit_warehouse, transit_bin.actual_qty
        HAVING
            ((SUM(sii.qty * sii.conversion_factor) / 97) * 37) - (bin.actual_qty + transit_bin.actual_qty) > 0  -- Only positive final_order
        ORDER BY
            bin.warehouse ASC, si.posting_date DESC
        LIMIT %(chunk_size)s OFFSET %(offset)s;
        """

        # Execute the query with parameters
        chunk_results = frappe.db.sql(
            sql_query,
            {
                "supplier": supplier,
                "principal": principal,
                "chunk_size": chunk_size,
                "offset": offset,
            },
            as_dict=True,
        )
        
        # print(chunk_results)

        if not chunk_results:
            break

        all_results.extend(chunk_results)
        offset += chunk_size

    return all_results