import frappe

@frappe.whitelist()
def get_item_qty(item_code, warehouse):
    """
    Fetch actual quantity of an item in a specific warehouse.

    Args:
        item_code (str): Item code to filter.
        warehouse (str): Warehouse name to filter.

    Returns:
        dict: Dictionary containing item, warehouse, and actual quantity.
    """
    result = frappe.db.sql("""
        SELECT
            bin.item_code AS item,
            bin.warehouse AS warehouse,
            bin.actual_qty AS actual_quantity
        FROM
            `tabBin` bin
        WHERE
            bin.actual_qty != 0
            AND bin.item_code = %(item_code)s
            AND bin.warehouse = %(warehouse)s
    """, {
        "item_code": item_code,
        "warehouse": warehouse
    }, as_dict=True)

    if result:
        return result[0]  # Return the first matching record
    else:
        return {"item": item_code, "warehouse": warehouse, "actual_quantity": 0}
