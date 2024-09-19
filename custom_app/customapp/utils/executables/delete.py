import frappe
@frappe.whitelist()
def delete_draft_pos_invoices():
    """
    Deletes all draft POS invoices.
    """
    try:
        draft_pos_invoices = frappe.get_all('POS Invoice', filters={'status': 0})
        for invoice in draft_pos_invoices:
            frappe.delete_doc('POS Invoice', invoice.name, force=1, ignore_permissions=True)
        frappe.db.commit()
        frappe.logger().info(f"Deleted {len(draft_pos_invoices)} draft POS invoices.")
    except Exception as e:
        frappe.logger().error(f"Failed to delete draft POS invoices: {str(e)}")