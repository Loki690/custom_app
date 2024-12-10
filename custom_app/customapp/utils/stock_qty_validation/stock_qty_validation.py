import frappe
from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_pos_reserved_qty

@frappe.whitelist()
def get_adjusted_projected_qty(item_code, warehouse):
    """
    Returns the adjusted projected quantity for an item in a specified warehouse,
    accounting for POS reserved quantities.
    """
    bin_info = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, 
                                   ["projected_qty"], as_dict=True)

    if bin_info:
        projected_qty = bin_info.projected_qty or 0
        reserved_qty_for_pos = get_pos_reserved_qty(item_code, warehouse) or 0
        adjusted_projected_qty = projected_qty - reserved_qty_for_pos
        return adjusted_projected_qty

    return 0