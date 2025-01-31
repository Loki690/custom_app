import frappe

@frappe.whitelist()
def get_item_stock_data(supplier=None, item=None, principal=None):
    # Build the query dynamically
    query = """
        SELECT
            i.name AS item_code,
            i.item_name AS item_name,
            i.custom_principal AS principal,
            GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ') AS suppliers,
            SUM(COALESCE(b.actual_qty, 0)) AS total_actual_qty,
            SUM(COALESCE(b_return.actual_qty, 0)) AS total_return_warehouse_qty
        FROM
            `tabItem` i
        LEFT JOIN
            `tabItem Supplier` isup ON isup.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = isup.supplier
        LEFT JOIN
            `tabBin` b ON b.item_code = i.name
        LEFT JOIN
            `tabWarehouse` w ON w.name = b.warehouse
        LEFT JOIN
            `tabBin` b_return 
            ON b_return.item_code = i.name
            AND b_return.warehouse = w.custom_default_return_warehouse
        WHERE
            w.custom_default_return_warehouse IS NOT NULL
            AND b_return.actual_qty != 0
    """
    
    # Add dynamic filters
    filters = []
    if supplier:
        filters.append(f"isup.supplier = {frappe.db.escape(supplier)}")
    if item:
        filters.append(f"i.name = {frappe.db.escape(item)}")
    if principal:
        filters.append(f"i.custom_principal = {frappe.db.escape(principal)}")
    
    # Apply filters if present
    if filters:
        query += " AND " + " AND ".join(filters)

    # Group and order
    query += """
        GROUP BY
            i.name, i.item_name, i.custom_principal
        ORDER BY
            total_return_warehouse_qty DESC
    """
    
    # Execute query and return results
    return frappe.db.sql(query, as_dict=True)
