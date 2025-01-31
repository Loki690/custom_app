import frappe


@frappe.whitelist()
def increment_material_issue_print_count(material_issue_summary):
    try:
        # Fetch the document
        issue_summary = frappe.get_doc('Material Issue Summary', material_issue_summary)
        current_print_count = issue_summary.print_counter or 0

        # Determine the new print count
        new_print_count = current_print_count + 1


        if not issue_summary.is_printed:
            new_print_count = 1
        else:
            new_print_count = current_print_count + 1 

        # Update the field directly in the database
        frappe.db.sql("""
            UPDATE `tabMaterial Issue Summary`
            SET print_counter = %s, is_printed = 1
            WHERE name = %s
        """, (new_print_count, material_issue_summary))
        
        # Commit the transaction
        frappe.db.commit()
        
        return new_print_count

    except Exception as e:
        # Log the error and provide feedback
        frappe.log_error(frappe.get_traceback(), 'Error incrementing print count for Material Issue Summary')
        frappe.throw(_('Error incrementing print count: {0}').format(str(e)))
