# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DSRSSalesInvoiceBranchWide(Document):
	pass


@frappe.whitelist()
def dsrs_sales_invoice_branch_wide(warehouse, from_date, to_date):
    """
    Fetch sales invoice data for a specific warehouse and date range,
    including item details and payment references (from Payment Entry Reference).

    Args:
        warehouse (str): Warehouse to filter the sales invoices.
        from_date (str): Start of the date range (YYYY-MM-DD).
        to_date (str): End of the date range (YYYY-MM-DD).

    Returns:
        dict: Contains records of sales invoices and their details, along with totals.
    """
    try:
        # SQL query to fetch invoice details
        invoice_query = """
            SELECT
                si.name AS invoice_name,
                si.customer,
                si.customer_name,
                si.grand_total,
                si.posting_date
            FROM
                `tabSales Invoice` si
            WHERE
                si.set_warehouse = %s
                AND si.posting_date BETWEEN %s AND %s
                AND si.docstatus != 2
                AND si.is_pos = 0
            ORDER BY
                si.posting_date DESC, si.name
        """

        # Execute the invoice query
        invoices = frappe.db.sql(invoice_query, (warehouse, from_date, to_date), as_dict=True)

        if not invoices:
            return {"records": [], "total_grand_total": 0, "total_payments": 0, "payments_by_mode": []}

        # Get all invoice names for further queries
        invoice_names = [invoice['invoice_name'] for invoice in invoices]

        # Fetch items related to the invoices
        item_query = """
            SELECT
                sii.parent AS invoice_name,
                sii.item_code,
                sii.item_name,
                sii.qty,
                sii.rate,
                sii.amount,
                sii.sales_order
            FROM
                `tabSales Invoice Item` sii
            WHERE
                sii.parent IN %(invoice_names)s
        """

        items = frappe.db.sql(item_query, {"invoice_names": tuple(invoice_names)}, as_dict=True)

        # Fetch payment entries related to the invoices
        payment_entry_query = """
            SELECT
                per.reference_name AS invoice_name,
                per.parent AS payment_entry,
                per.allocated_amount AS paid_out,
                pe.mode_of_payment
            FROM
                `tabPayment Entry Reference` per
            JOIN
                `tabPayment Entry` pe ON per.parent = pe.name
            WHERE
                per.reference_name IN %(invoice_names)s
        """

        payment_entries = frappe.db.sql(payment_entry_query, {"invoice_names": tuple(invoice_names)}, as_dict=True)

        # Map payment entries to their invoices
        payment_entry_map = {entry["invoice_name"]: entry for entry in payment_entries}

        # Group items by invoice name
        items_by_invoice = {}
        for item in items:
            invoice_name = item["invoice_name"]
            if invoice_name not in items_by_invoice:
                items_by_invoice[invoice_name] = []
            items_by_invoice[invoice_name].append({
                "item_code": item["item_code"],
                "item_name": item["item_name"],
                "qty": item["qty"],
                "rate": item["rate"],
                "amount": item["amount"],
                "sales_order": item["sales_order"]
            })

        # Combine all data into final records
        final_records = []
        total_grand_total = 0
        payments_by_mode = {}

        for invoice in invoices:
            invoice_name = invoice["invoice_name"]
            payment_entry_data = payment_entry_map.get(invoice_name, {})
            mode_of_payment = payment_entry_data.get("mode_of_payment")
            paid_out = payment_entry_data.get("paid_out", 0)

            # Aggregate total paid_out per mode_of_payment
            if mode_of_payment:
                if mode_of_payment not in payments_by_mode:
                    payments_by_mode[mode_of_payment] = 0
                payments_by_mode[mode_of_payment] += paid_out

            final_records.append({
                "invoice_name": invoice_name,
                "customer": invoice["customer"],
                "customer_name": invoice["customer_name"],
                "grand_total": invoice["grand_total"],
                "posting_date": invoice["posting_date"],
                "items": items_by_invoice.get(invoice_name, []),
                "payment_entry": payment_entry_data.get("payment_entry"),
                "paid_out": paid_out,
                "mode_of_payment": mode_of_payment,
                "balance": invoice["grand_total"] - paid_out
            })
            total_grand_total += invoice["grand_total"]

        total_payments = sum(payments_by_mode.values())
        total_balance = total_grand_total - total_payments
        

        # Format payments_by_mode as an array
        payments_by_mode_array = [{"mode_of_payment": key, "total_paid_out": value} for key, value in payments_by_mode.items()]

        # Return the final records and totals
        return {
            "records": final_records,
            "total_grand_total": total_grand_total,
            "total_payments": total_payments,
            "payments_by_mode": payments_by_mode_array,
            "total_balance": total_balance
        }

    except Exception as e:
        # Log the error with a traceback for debugging
        frappe.log_error(frappe.get_traceback(), 'dsrs_sales_invoice_branch_wide Error')

        # Throw a detailed error message
        frappe.throw(frappe._("An error occurred while fetching data: {0}").format(str(e)))






