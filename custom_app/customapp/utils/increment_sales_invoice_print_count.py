import frappe
from frappe import _

@frappe.whitelist()
def increment_sales_invoice_print_count(sales_invoice):
    try:
        # Fetch the sales invoice document
        invoice = frappe.get_doc('Sales Invoice', sales_invoice)
        current_print_count = invoice.print_counter or 0

        # Determine the new print count
        if not invoice.is_printed:
            new_print_count = 1
        else:
            new_print_count = current_print_count + 1

        # Update directly in database for better performance
        frappe.db.sql("""
            UPDATE `tabSales Invoice`
            SET print_counter = %s, is_printed = 1
            WHERE name = %s
        """, (new_print_count, sales_invoice))
        
        frappe.db.commit()
        
        return new_print_count

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Sales Invoice Print Count Error')
        frappe.throw(_('Failed to update print count: {0}').format(str(e)))