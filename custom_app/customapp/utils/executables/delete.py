import frappe
from custom_app.customapp.utils.dropbox_price_update.dropbox_price_update import upload_item_prices_to_dropbox

@frappe.whitelist()
def delete_draft_pos_invoices():
    """
    Deletes all draft POS invoices that are in 'Draft' status.
    """
    try:
        # Get all POS invoices that are in draft (status = 0)
        upload_item_prices_to_dropbox()
        draft_pos_invoices = frappe.get_all('POS Invoice', filters={'docstatus': 0})
        
        # Loop through and delete each draft invoice
        for invoice in draft_pos_invoices:
            frappe.delete_doc('POS Invoice', invoice.name, force=1, ignore_permissions=True)
        
        # Commit the transaction to ensure deletion
        frappe.db.commit()
        
        frappe.logger().info(f"Deleted {len(draft_pos_invoices)} draft POS invoices.")
    
    except Exception as e:
        frappe.logger().error(f"Failed to delete draft POS invoices: {str(e)}")