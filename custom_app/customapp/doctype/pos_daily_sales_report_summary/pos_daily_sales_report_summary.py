# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class POSDailySalesReportSummary(Document):
	pass

def before_insert(doc, method):
    pass
        
@frappe.whitelist()
def get_pos_invoices(pos_profile, from_date, to_date):
    try:
        # SQL query to fetch the required fields
        query = """
            SELECT
                name,
                custom_invoice_series,
                status,
                custom_vatable_sales,
                custom_vat_exempt_sales,
                custom_zero_rated_sales,
                custom_vat_amount,
                total_taxes_and_charges,
                net_total,
                grand_total,
                change_amount,
                custom_pa_name,
                customer,
                is_return,
                return_against,
                custom_date_time_posted
            FROM
                `tabPOS Invoice`
            WHERE
                pos_profile = %s
                AND posting_date BETWEEN %s AND %s
                AND docstatus != 2
        """
        # Execute the query and get the records
        records = frappe.db.sql(query, (pos_profile, from_date, to_date), as_dict=True)

        net_total = 0
        grand_total = 0
        total_transaction = 0  # Variable to count total transactions (invoices)
        total_items = 0  # Variable to sum total items across all invoices

        # Initialize the total values
        totals = {
            'total_vatable_sales': 0,
            'total_vat_exempt_sales': 0,
            'total_zero_rated_sales': 0,
            'total_vat_amount': 0,
            'total_taxes_and_charges': 0,
            'total_change_amount': 0
        }

        # Dictionary to accumulate payment totals by mode of payment
        payment_totals = {}
        
        clerk_totals = {}

        # Loop through the records to calculate the totals
        for record in records:
            totals['total_vatable_sales'] += record.get('custom_vatable_sales', 0)
            totals['total_vat_exempt_sales'] += record.get('custom_vat_exempt_sales', 0)
            totals['total_zero_rated_sales'] += record.get('custom_zero_rated_sales', 0)
            totals['total_vat_amount'] += record.get('custom_vat_amount', 0)
            totals['total_taxes_and_charges'] += record.get('total_taxes_and_charges', 0)
            net_total += record.get('net_total', 0)
            grand_total += record.get('grand_total', 0)
            totals['total_change_amount'] += record.get('change_amount', 0)

            # Count each invoice (transaction)
            total_transaction += 1

            # Fetch items associated with each invoice
            item_query = """
                SELECT
                    qty
                FROM
                    `tabPOS Invoice Item`
                WHERE
                    parent = %s
            """
            items = frappe.db.sql(item_query, (record['name'],), as_dict=True)

            # Sum the quantities of items in each invoice
            total_items += sum(item.get('qty', 0) for item in items)

            # Fetch payments for each invoice
            payment_query = """
                SELECT
                    mode_of_payment,
                    SUM(amount) AS total_amount
                FROM
                    `tabSales Invoice Payment`
                WHERE
                    parent = %s
                    AND amount > 0
                GROUP BY
                    mode_of_payment
            """
            payments = frappe.db.sql(payment_query, (record['name'],), as_dict=True)

            # Aggregate payments by mode of payment
            for payment in payments:
                mode = payment['mode_of_payment']
                payment_totals[mode] = payment_totals.get(
                    mode, 0) + payment['total_amount']

            # Update clerk totals and transaction counts

            clerk_name = record['custom_pa_name']
            grand_total_for_invoice = record.get('grand_total', 0)
                
            if clerk_name in clerk_totals:
                clerk_totals[clerk_name]['grand_total'] += grand_total_for_invoice
                clerk_totals[clerk_name]['transaction_count'] += 1
            else:
                clerk_totals[clerk_name] = {
                    'grand_total': grand_total_for_invoice,
                    'transaction_count': 1
                }

        # Calculate non-cash payment total
        non_cash_payment = sum(
            total for mode, total in payment_totals.items() if mode.lower() != "cash"
        )

        # Calculate cash payment
        cash_payment = grand_total - non_cash_payment

        # Update payment totals dictionary
        payment_totals["Cash"] = cash_payment

        # Convert payment totals dictionary into an array
        aggregated_payments = [
            {'mode_of_payment': mode, 'total_amount': total}
            for mode, total in payment_totals.items()
        ]
        
        # Build the clerk transactions list
        clerk_transactions = [
            {
                'clerk_name': clerk_name,
                'grand_total': totals['grand_total'],
                'transaction_count': totals['transaction_count']
            }
            for clerk_name, totals in clerk_totals.items()
        ]

        # Return the result
        return {
            'records': records,
            'totals': totals,
            'net_total': net_total,
            'grand_total': grand_total,
            'payments': aggregated_payments,
            'total_transaction': total_transaction,
            'total_items': total_items,
            'clerk_transactions': clerk_transactions
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoices Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
        
def set_sales_details(doc, totals):
    
    for doc.sales_details in totals:
        doc.sales_details.total_vatable_sales = totals['total_vatable_sales']
        doc.sales_details.total_vat_exempt_sales = totals['total_vat_exempt_sales']
        doc.sales_details.total_zero_rated_sales = totals['total_zero_rated_sales']
        doc.sales_details.total_vat_amount = totals['total_vat_amount']
        doc.sales_details.total_taxes_and_charges = totals['total_taxes_and_charges']
        doc.sales_details.total_net_total = totals['total_net_total']
        doc.sales_details.total_grand_total = totals['total_grand_total']
        doc.sales_details.total_change_amount = totals['total_change_amount']