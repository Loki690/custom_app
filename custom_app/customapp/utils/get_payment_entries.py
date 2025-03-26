import frappe

@frappe.whitelist()
def get_payment_entries(date):
    """
    Fetch payment entries for a given posting date.
    """
    if not date:
        frappe.throw(_("The 'date' parameter is required for fetching payment entries."))

    try:
        query = """
            SELECT
                pe.name AS name,
                pe.posting_date AS posting_date,
                pe.payment_type AS payment_type,
                pe.party_name AS party_name,
                pe.cost_center AS cost_center,
                pe.mode_of_payment AS mode_of_payment,
                pe.paid_amount AS paid_amount,
                GROUP_CONCAT(per.reference_name) AS reference_names
            FROM
                `tabPayment Entry` pe
            LEFT JOIN
                `tabPayment Entry Reference` per ON per.parent = pe.name
            LEFT JOIN 
                `tabSales Invoice` si ON si.name = per.reference_name
            WHERE
                pe.posting_date = %(date)s
                AND (per.reference_doctype IS NULL OR per.reference_doctype = "Sales Invoice")
                AND (si.set_warehouse IS NULL OR si.set_warehouse != "CSD - ADC")
                AND (si.cost_center IS NULL OR si.cost_center != "SU-06 - CSD - ADC")
                AND pe.docstatus = 1
            GROUP BY
                pe.name
            ORDER BY
                pe.posting_date DESC;
        """

        result = frappe.db.sql(query, {"date": date}, as_dict=True)

        # If no records are found, return an empty list
        if not result:
            return {"message": "No payment entries found for the given date."}

        return result

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="Payment Entry Fetch Error")
        frappe.throw(_("An error occurred while fetching payment entries: {0}").format(str(e)))
