# custom_app/customapp/api.py

import frappe
from frappe import _

@frappe.whitelist()  # This decorator exposes the function as an API endpoint
def get_items(item_group=None):
    """
    Fetch items by item group (optional filter)
    """
    if not item_group:
        return frappe.get_all("Item", fields=["name", "item_group", "stock_uom", "standard_rate"])
    
    return frappe.get_all(
        "Item",
        filters={"item_group": item_group},
        fields=["name", "item_group", "stock_uom", "standard_rate"]
    )
