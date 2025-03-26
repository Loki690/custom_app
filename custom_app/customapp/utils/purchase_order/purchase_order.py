import frappe
import csv
from frappe.utils.file_manager import save_file
from frappe.utils import get_url

@frappe.whitelist()
def supplier_items(supplier=None, principal=None):
    filters = []
    sql_conditions = ""

    # Apply dynamic filtering
    if supplier:
        filters.append("s.name = %(supplier)s")
    if principal:
        filters.append("i.custom_principal = %(principal)s")  # Adjust field based on your schema

    # Combine filters if both provided
    if filters:
        sql_conditions = " AND " + " AND ".join(filters)

    items = frappe.db.sql(
        f"""
        SELECT
            i.name AS item_code,
            i.item_name AS item_name,
            i.stock_uom AS uom
        FROM
            `tabItem` i
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            i.disabled != 1
            {sql_conditions}
        ORDER BY
            i.name ASC
        """,
        {"supplier": supplier, "principal": principal},
        as_dict=True
    )

    return items



