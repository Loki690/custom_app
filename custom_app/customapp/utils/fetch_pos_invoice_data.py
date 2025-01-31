import frappe
@frappe.whitelist()
def fetch_pos_invoice_data(custom_cashier, pos_profile, from_date, to_date):
    # Validate input parameters
    if not from_date or not custom_cashier:
        return []

    # Query to fetch data based on custom_cashier, pos_profile, from_date, and to_date
    # Include a condition to filter out rows where the amount is zero
    query = """
        SELECT
            pi.name AS pos_invoice,
            pi.pos_profile,
            pi.customer_name,
            pi.posting_date,
            pi.custom_invoice_series AS invoice_series,
            pi.custom_cashier_name AS cashier_name,
            sip.mode_of_payment,
            CASE
                WHEN sip.mode_of_payment IN ('Credit Card', 'Debit Card') THEN sip.custom_approval_code
                WHEN sip.mode_of_payment = 'QR Payment' THEN sip.custom_qr_reference_number
                ELSE NULL
            END AS reference_code,
            sip.custom_payment_type AS payment_type,
            sip.custom_card_name AS name_on_card,
            CASE
                WHEN sip.mode_of_payment IN ('Credit Card', 'Debit Card') THEN sip.custom_bank_name
                WHEN sip.mode_of_payment = 'QR Payment' THEN sip.custom_bank_type
                ELSE NULL
            END AS bankqr_used,
            pi.change_amount as change_amount,
            CASE
                WHEN sip.mode_of_payment = 'Cash' THEN sip.amount - pi.change_amount
                ELSE sip.amount
            END AS payment_amount
           
        FROM
            `tabPOS Invoice` pi
        LEFT JOIN
            `tabSales Invoice Payment` sip ON sip.parent = pi.name
        WHERE
            pi.docstatus = 1
            AND pi.custom_cashier = %s
            AND pi.pos_profile = %s
            AND pi.custom_date_time_posted BETWEEN %s AND %s
            AND sip.amount IS NOT NULL
            AND sip.amount != 0
        ORDER BY
            pi.name, sip.idx
    """
    
    # Execute the query with the provided parameters
    data = frappe.db.sql(query, (custom_cashier, pos_profile, from_date, to_date), as_dict=True)
    
    # Return the fetched data
    return data
