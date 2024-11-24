# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

class POSZReading(Document):
    pass

def on_submit(doc, method):
    return
    # update_pos_profile_last_z_reading(doc)

def update_pos_profile_last_z_reading(doc):
        pos_profile_doc = frappe.get_doc('POS Profile', doc.pos_profile)
        pos_profile_doc.custom_last_z_reading = doc.date_to
        pos_profile_doc.custom_old_accumulated_sales = pos_profile_doc.custom_old_accumulated_sales + doc.net_sales
        pos_profile_doc.save()
        
        
def before_insert(doc, method):
    total_items_count = 0  # Initialize a counter for the total items
    
    
    
    # for transaction in doc.confirmed_transaction:
    #     pos_invoice = get_pos_invoice(transaction.pos_trasaction)
    #     if pos_invoice:
    #         # Fetch the POS Invoice items related to the invoice
    #         pos_invoice_items = get_pos_invoice_items(pos_invoice[0].name)
    #         # Count the number of items and add to the total count
    #         total_items_count += len(pos_invoice_items)
    
    # doc.confirmed_transaction_item_total = total_items_count
    
def get_pos_invoice(invoice):
    try:
        record = frappe.get_all(
            'POS Invoice', 
            filters={'custom_invoice_series': invoice},
            fields=['name']
        )
        
        return record
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))

@frappe.whitelist()
def get_pos_invoice_items(parent):
    frappe.flags.ignore_permissions = True 
    try:
        records = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent', 'net_amount', 'amount']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice_items Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_pos_invoice_details(parent):
    frappe.flags.ignore_permissions = True 
    try:
        # Fetching POS Invoice Items
        invoice_items = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent', 'net_amount', 'amount']  # Specify the fields you want to fetch
        )
        
        # Fetching Sales Invoice Payments
        payments = frappe.get_all(
            'Sales Invoice Payment', 
           filters={
                'parent': parent,
                # 'amount': ['>', 0]  # Filter to only include payments with amount > 0
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        
        # Prepare the combined result
        result = {
            "invoice_items": invoice_items,
            "payments": payments
        }
        
        return result
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice_details Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


@frappe.whitelist()
def get_z_reading(pos_profile, from_date, to_date):
    try:
        # SQL query to fetch the required fields from `POS Invoice`
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
                custom_date_time_posted,
                posting_date
            FROM
                `tabPOS Invoice`
            WHERE
                pos_profile = %s
                AND posting_date BETWEEN %s AND %s
                AND status != 'Draft'
                AND docstatus != 2
            ORDER BY posting_date, custom_invoice_series
        """
        # Execute the query and get the records
        records = frappe.db.sql(query, (pos_profile, from_date, to_date), as_dict=True)

        # Initialize the total values and payment modes dictionary
        totals = {
            'total_vatable_sales': 0,
            'total_vat_exempt_sales': 0,
            'total_zero_rated_sales': 0,
            'total_vat_amount': 0,
            'total_taxes_and_charges': 0,
            'total_net_total': 0,
            'total_grand_total': 0,
            'total_change_amount': 0,
            'total_items_count': 0
        }
        payment_modes = {}

        # Loop through the records to calculate totals, fetch item count, and accumulate payment modes
        for record in records:
            # Update the totals with rounding
            totals['total_vatable_sales'] += round(record.get('custom_vatable_sales', 0), 2)
            totals['total_vat_exempt_sales'] += round(record.get('custom_vat_exempt_sales', 0), 2)
            totals['total_zero_rated_sales'] += round(record.get('custom_zero_rated_sales', 0), 2)
            totals['total_vat_amount'] += round(record.get('custom_vat_amount', 0), 2)
            totals['total_taxes_and_charges'] += round(record.get('total_taxes_and_charges', 0), 2)
            totals['total_net_total'] += round(record.get('net_total', 0), 2)
            totals['total_grand_total'] += round(record.get('grand_total', 0), 2)
            totals['total_change_amount'] += round(record.get('change_amount', 0), 2)

            # Query to get the total quantity of items for the current invoice
            item_count_query = """
                SELECT
                    SUM(qty) AS total_items
                FROM
                    `tabPOS Invoice Item`
                WHERE
                    parent = %s
            """
            item_count = frappe.db.sql(item_count_query, (record['name'],), as_dict=True)[0].get('total_items', 0)

            # Attach the item count to the record and update the overall total items count
            record['total_items'] = item_count
            totals['total_items_count'] += item_count

            # Query to get payment modes from `Sales Invoice Payment`
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

            # Accumulate counts and amounts for each mode of payment
            for payment in payments:
                mode = payment.get('mode_of_payment')
                amount = payment.get('total_amount', 0)

                if mode not in payment_modes:
                    payment_modes[mode] = {
                        'count': 0,
                        'total_amount': 0
                    }
                payment_modes[mode]['count'] += 1
                payment_modes[mode]['total_amount'] += round(amount, 2)

        # Convert the `payment_modes` dictionary to an array
        payment_modes_array = []
        for mode, data in payment_modes.items():
            payment_modes_array.append({
                'mode_of_payment': mode,
                'count': data['count'],
                'total_amount': round(data['total_amount'], 2)
            })

        # Get the beginning and ending custom_invoice_series based on posting_date
        if records:
            beginning_custom_invoice_series = records[0].get('custom_invoice_series')
            ending_custom_invoice_series = records[-1].get('custom_invoice_series')
        else:
            beginning_custom_invoice_series = None
            ending_custom_invoice_series = None

        # Round all totals to 2 decimal points before returning
        for key in totals:
            if isinstance(totals[key], float):  # Round only the monetary totals
                totals[key] = round(totals[key], 2)
        
        # Return records, totals, payment_modes_array, and beginning/ending invoice series
        return {
            'records': records,
            'totals': totals,
            'payment_modes': payment_modes_array,  # Converted to array
            'beginning_custom_invoice_series': beginning_custom_invoice_series,
            'ending_custom_invoice_series': ending_custom_invoice_series
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
