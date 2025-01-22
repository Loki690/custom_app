import frappe

@frappe.whitelist()
def get_item_stock_data(supplier=None, item=None):
    # Build the query dynamically
    query = """
        SELECT
            sle.item_code AS item_code,
            i.item_name AS item_name,
            i.custom_principal AS principal,
            GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ') AS suppliers,
            sle.warehouse AS warehouse,
            COALESCE(b.actual_qty, 0) AS actual_qty,
            w.custom_default_return_warehouse AS default_return_warehouse,
            COALESCE(b_return.actual_qty, 0) AS return_warehouse_qty
        FROM
            `tabStock Ledger Entry` sle
        JOIN
            `tabWarehouse` w ON w.name = sle.warehouse
        LEFT JOIN
            `tabBin` b_return 
            ON b_return.item_code = sle.item_code
            AND b_return.warehouse = w.custom_default_return_warehouse
        LEFT JOIN
            `tabBin` b 
            ON b.item_code = sle.item_code
            AND b.warehouse = sle.warehouse
        LEFT JOIN
            `tabItem` i 
            ON i.name = sle.item_code
        LEFT JOIN
            `tabItem Supplier` isup ON isup.parent = sle.item_code -- Get item suppliers
        LEFT JOIN
            `tabSupplier` s ON s.name = isup.supplier  
        WHERE
            w.custom_default_return_warehouse IS NOT NULL
    """
    
    # Add dynamic filters
    filters = []
    if supplier:
        filters.append(f"isup.supplier = {frappe.db.escape(supplier)}")
    if item:
        filters.append(f"sle.item_code = {frappe.db.escape(item)}")
    
    # Apply filters if present
    if filters:
        query += " AND " + " AND ".join(filters)

    # Group and order
    query += """
        GROUP BY
            sle.item_code, i.item_name, sle.warehouse, 
            w.custom_default_return_warehouse, b.actual_qty, b_return.actual_qty
        ORDER BY
            COALESCE(b_return.actual_qty, 0) DESC
    """
    
    # Execute query and return results
    return frappe.db.sql(query, as_dict=True)