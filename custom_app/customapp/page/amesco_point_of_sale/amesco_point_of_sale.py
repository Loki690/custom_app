# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

import json

import frappe
from frappe import _
from frappe.exceptions import AuthenticationError
from frappe.utils import cint
from frappe.utils.data import getdate
from frappe.utils.nestedset import get_root_of

from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability
from erpnext.accounts.doctype.pos_profile.pos_profile import get_child_nodes, get_item_groups
from erpnext.stock.utils import scan_barcode
#from frappe.utils.password import check_oic_password, check_password
from custom_app.customapp.utils.password import check_oic_password, check_password

from custom_app.customapp.doctype.cash_count_denomination_entry.cash_count_denomination_entry import create_cash_count_denomination_entry


def search_by_term(search_term, warehouse, price_list):
	result = search_for_serial_or_batch_or_barcode_number(search_term) or {}

	item_code = result.get("item_code", search_term)
	serial_no = result.get("serial_no", "")
	batch_no = result.get("batch_no", "")
	barcode = result.get("barcode", "")

	if not result:
		return

	item_doc = frappe.get_doc("Item", item_code)
 
	if not item_doc:
		return

	item = {
		"barcode": barcode,
		"batch_no": batch_no,
		"description": item_doc.description,
		"is_stock_item": item_doc.is_stock_item,
		"item_code": item_doc.name,
		"item_image": item_doc.image,
		"item_name": item_doc.item_name,
		"serial_no": serial_no,
		"stock_uom": item_doc.stock_uom,
		"uom": item_doc.stock_uom,
	}

	if barcode:
		barcode_info = next(filter(lambda x: x.barcode == barcode, item_doc.get("barcodes", [])), None)
		if barcode_info and barcode_info.uom:
			uom = next(filter(lambda x: x.uom == barcode_info.uom, item_doc.uoms), {})
			item.update(
				{
					"uom": barcode_info.uom,
					"conversion_factor": uom.get("conversion_factor", 1),
				}
			)

	item_stock_qty, is_stock_item = get_stock_availability(item_code, warehouse)
	item_stock_qty = item_stock_qty // item.get("conversion_factor", 1)
	item.update({"actual_qty": item_stock_qty})

	price = frappe.get_list(
		doctype="Item Price",
		filters={
			"price_list": price_list,
			"item_code": item_code,
			"batch_no": batch_no,
		},
		fields=["uom", "currency", "price_list_rate", "batch_no"],
	)

	def __sort(p):
		p_uom = p.get("uom")

		if p_uom == item.get("uom"):
			return 0
		elif p_uom == item.get("stock_uom"):
			return 1
		else:
			return 2

	# sort by fallback preference. always pick exact uom match if available
	price = sorted(price, key=__sort)

	if len(price) > 0:
		p = price.pop(0)
		item.update(
			{
				"currency": p.get("currency"),
				"price_list_rate": p.get("price_list_rate"),
			}
		)

	return {"items": [item]}





@frappe.whitelist()
def get_items(start, page_length, price_list, item_group, pos_profile, search_term="", selected_warehouse=None):
    # Fetch selected warehouse from the request or POS Profile
    if selected_warehouse:
        warehouse = selected_warehouse
        hide_unavailable_items = frappe.db.get_value(
            "POS Profile", pos_profile, "hide_unavailable_items"
        )
    else:
        warehouse, hide_unavailable_items = frappe.db.get_value(
            "POS Profile", pos_profile, ["warehouse", "hide_unavailable_items"]
        )

    result = []

    if search_term:
        result = search_by_term(search_term, warehouse, price_list) or []
        if result:
            return result

    if not frappe.db.exists("Item Group", item_group):
        item_group = get_root_of("Item Group")

    condition = get_conditions(search_term)
    condition += get_item_group_condition(pos_profile)

    lft, rgt = frappe.db.get_value("Item Group", item_group, ["lft", "rgt"])

    bin_join_selection, bin_join_condition = "", ""
    if hide_unavailable_items:
        bin_join_selection = ", `tabBin` bin"
        bin_join_condition = (
            "AND bin.warehouse = %(warehouse)s AND bin.item_code = item.name AND bin.actual_qty > 0"
        )

    items_data = frappe.db.sql(
        """
        SELECT
            item.name AS item_code,
            item.item_name,
            item.description,
            item.custom_is_vatable,
            item.stock_uom,
            item.image AS item_image,
            item.is_stock_item,
            MAX(batch.name) as batch_no,
            MAX(batch.expiry_date) AS latest_expiry_date
        FROM
            `tabItem` item
        LEFT JOIN
            `tabBatch` batch ON batch.item = item.name
        {bin_join_selection}
        WHERE
            item.disabled = 0
            AND item.has_variants = 0
            AND item.is_sales_item = 1
            AND item.is_fixed_asset = 0
            AND item.item_group IN (SELECT name FROM `tabItem Group` WHERE lft >= {lft} AND rgt <= {rgt})
            AND {condition}
            {bin_join_condition}
        GROUP BY
            item.name, item.item_name, item.description, item.stock_uom, item.image, item.is_stock_item
        ORDER BY
            item.item_name ASC
        LIMIT
            {page_length} OFFSET {start}
        """.format(
            start=cint(start),
            page_length=cint(page_length),
            lft=cint(lft),
            rgt=cint(rgt),
            condition=condition,
            bin_join_selection=bin_join_selection,
            bin_join_condition=bin_join_condition,
        ),
        {"warehouse": warehouse},
        as_dict=1,
    )

    # Return an empty list if there are no results
    if not items_data:
        return result

    for item in items_data:
        uoms = frappe.get_doc("Item", item.item_code).get("uoms", [])

        item.actual_qty, _ = get_stock_availability(item.item_code, warehouse)
        #item.actual_qty = get_draft_pos_invoice_item_quantity(pos_profile, item.item_code, item.actual_qty)
        item.uom = item.stock_uom

        item_price = frappe.get_all(
            "Item Price",
            fields=["price_list_rate", "currency", "uom", "batch_no"],
            filters={
                "price_list": price_list,
                "item_code": item.item_code,
                "selling": True,
            },
        )

        if not item_price:
            result.append(item)

        for price in item_price:
            uom = next(filter(lambda x: x.uom == price.uom, uoms), {})

            if price.uom != item.stock_uom and uom and uom.conversion_factor:
                item.actual_qty = item.actual_qty // uom.conversion_factor

            result.append(
                {
                    **item,
                    "price_list_rate": price.get("price_list_rate"),
                    "currency": price.get("currency"),
                    "uom": price.uom or item.uom,
                    "batch_no": price.batch_no,
                }
            )
            # Add latest_expiry_date to the item

    return {"items": result}


import frappe

@frappe.whitelist()
def get_item_uoms(item_code):
    item = frappe.get_doc('Item', item_code)
    
    uom_conversions = frappe.db.sql("""
        SELECT uom, conversion_factor
        FROM `tabUOM Conversion Detail`
        WHERE parent = %s
    """, (item_code,), as_dict=True)
    
    uoms = []
    for conversion in uom_conversions:
        uoms.append({
            'uom': conversion.uom,
            'conversion_factor': conversion.conversion_factor
        })
    
    response = {
        'item_code': item.item_code,
        'description': item.description,
        'rate': item.standard_rate,
        'uoms': uoms  # List of UOM conversion details
    }

    return response


@frappe.whitelist()
def get_item_uom_prices(item_code):
    uom_prices = {}
    item_prices = frappe.get_all('Item Price', filters={'item_code': item_code}, fields=['uom', 'price_list_rate'])
    for price in item_prices:
        uom_prices[price.uom] = price.price_list_rate
    return {'uom_prices': uom_prices}




@frappe.whitelist()
def search_for_serial_or_batch_or_barcode_number(search_value: str) -> dict[str, str | None]:
	# return scan_barcode(search_value)
	try: 

		result = scan_barcode(search_value)
		return result
	except Exception as e: 
	  frappe.throw(_("An error occurred while searching for serial, batch, or barcode number: {0}").format(str(e)))



def get_conditions(search_term):
	condition = "("
	condition += """item.name like {search_term}
		or item.item_name like {search_term}""".format(search_term=frappe.db.escape("%" + search_term + "%"))
	condition += add_search_fields_condition(search_term)
	condition += ")"

	return condition


def add_search_fields_condition(search_term):
	condition = ""
	search_fields = frappe.get_all("POS Search Fields", fields=["fieldname"])
	if search_fields:
		for field in search_fields:
			condition += " or item.`{}` like {}".format(
				field["fieldname"], frappe.db.escape("%" + search_term + "%")
			)
	return condition


def get_item_group_condition(pos_profile):
	cond = "and 1=1"
	item_groups = get_item_groups(pos_profile)
	if item_groups:
		cond = "and item.item_group in (%s)" % (", ".join(["%s"] * len(item_groups)))

	return cond % tuple(item_groups)




@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def item_group_query(doctype, txt, searchfield, start, page_len, filters):
	item_groups = []
	cond = "1=1"
	pos_profile = filters.get("pos_profile")

	if pos_profile:
		item_groups = get_item_groups(pos_profile)

		if item_groups:
			cond = "name in (%s)" % (", ".join(["%s"] * len(item_groups)))
			cond = cond % tuple(item_groups)

	return frappe.db.sql(
		f""" select distinct name from `tabItem Group`
			where {cond} and (name like %(txt)s) limit {page_len} offset {start}""",
		{"txt": "%%%s%%" % txt},
	)


@frappe.whitelist()
def check_opening_entry(user):
	open_vouchers = frappe.db.get_all(
		"POS Opening Entry",
		filters={"user": user, "pos_closing_entry": ["in", ["", None]], "docstatus": 1},
		fields=["name", "company", "pos_profile", "period_start_date"],
		order_by="period_start_date desc",
	)

	return open_vouchers

@frappe.whitelist()
def get_shift_count(pos_profile):
    today = getdate()
    count = frappe.db.count('POS Opening Entry', {
        'pos_profile': pos_profile,
        'posting_date': today,
    })
    return count

@frappe.whitelist()
def get_pos_profile_shift(pos_profile):
    try:
        # Retrieve the POS Profile document
        pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
        return pos_profile_doc.custom_set_max_shift
    except frappe.DoesNotExistError:
        frappe.throw(_("POS Profile '{0}' does not exist").format(pos_profile))
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error fetching POS Profile')
        frappe.throw(_("An error occurred while fetching the POS Profile: {0}").format(str(e)))

@frappe.whitelist()
def create_opening_voucher(pos_profile, company, balance_details, custom_shift):
	balance_details = json.loads(balance_details)

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Entry",
			"period_start_date": frappe.utils.get_datetime(),
			"posting_date": frappe.utils.getdate(),
			"user": frappe.session.user,
			"pos_profile": pos_profile,
			"company": company,
			"custom_shift": custom_shift,
		}
	)
	new_pos_opening.set("balance_details", balance_details)
	new_pos_opening.submit()

	return new_pos_opening.as_dict()


@frappe.whitelist()
def get_past_order_list(search_term, status, pos_profile, limit=10000):
	fields = ["name", "grand_total", "currency", "customer", "posting_time", "posting_date", "pos_profile"]
	invoice_list = []

	if search_term and status:
		invoices_by_customer = frappe.db.get_all(
			"POS Invoice",
			filters={"customer": ["like", f"%{search_term}%"], 'pos_profile': pos_profile, "status": status},
			fields=fields,
			order_by="posting_time asc", 
			page_length=limit,
		)
		invoices_by_name = frappe.db.get_all(
			"POS Invoice",
			filters={"name": ["like", f"%{search_term}%"], 'pos_profile': pos_profile, "status": status},
			fields=fields,
			page_length=limit,
		)

		invoice_list = invoices_by_customer + invoices_by_name
	elif status:
		invoice_list = frappe.db.get_all(
			"POS Invoice", filters={"status": status, 'pos_profile': pos_profile }, fields=fields, order_by="posting_time asc",   page_length=limit
		)
		
	return invoice_list


@frappe.whitelist()
def set_customer_info(fieldname, customer, value=""):
	if fieldname == "loyalty_program":
		frappe.db.set_value("Customer", customer, "loyalty_program", value)

	contact = frappe.get_cached_value("Customer", customer, "customer_primary_contact")
	if not contact:
		contact = frappe.db.sql(
			"""
			SELECT parent FROM `tabDynamic Link`
			WHERE
				parenttype = 'Contact' AND
				parentfield = 'links' AND
				link_doctype = 'Customer' AND
				link_name = %s
			""",
			(customer),
			as_dict=1,
		)
		contact = contact[0].get("parent") if contact else None

	if not contact:
		new_contact = frappe.new_doc("Contact")
		new_contact.is_primary_contact = 1
		new_contact.first_name = customer
		new_contact.set("links", [{"link_doctype": "Customer", "link_name": customer}])
		new_contact.save()
		contact = new_contact.name
		frappe.db.set_value("Customer", customer, "customer_primary_contact", contact)

	contact_doc = frappe.get_doc("Contact", contact)

	if fieldname == "email_id":
		contact_doc.set("email_ids", [{"email_id": value, "is_primary": 1}])
		frappe.db.set_value("Customer", customer, "email_id", value)
	elif fieldname == "mobile_no":
		contact_doc.set("phone_nos", [{"phone": value, "is_primary_mobile_no": 1}])
		frappe.db.set_value("Customer", customer, "mobile_no", value)
	elif fieldname == "custom_oscapwdid":
		contact_doc.set("custom_osca_or_pwd_ids", [{"osca_pwd_id": value, "is_primary": 1}])
		frappe.db.set_value("Customer", customer, "custom_oscapwdid", value)
	elif fieldname == "custom_transaction_type":
		contact_doc.set("custom_transaction_types", [{"transaction_type": value, "is_primary_transaction": 1}])
		frappe.db.set_value("Customer", customer, "custom_transaction_type", value)

	contact_doc.save()


@frappe.whitelist()
def get_pos_profile_data(pos_profile):
	pos_profile = frappe.get_doc("POS Profile", pos_profile)
	pos_profile = pos_profile.as_dict()

	_customer_groups_with_children = []
	for row in pos_profile.customer_groups:
		children = get_child_nodes("Customer Group", row.customer_group)
		_customer_groups_with_children.extend(children)

	pos_profile.customer_groups = _customer_groups_with_children
	return pos_profile



@frappe.whitelist()
def confirm_user_password(password):
    """
    Wrapper function for checking password without requiring a username.
    """
    return check_oic_password(password)  
	


@frappe.whitelist()
def confirm_user_acc_password(password):
    # Get the current user
    user = frappe.session.user

    try:
        # Check if the entered password matches the stored hashed password
        if check_password(user, password):
            return True
        else:
            return False
    except AuthenticationError:
        return False

@frappe.whitelist()
def get_pos_closing_details(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'POS Closing Entry Detail', 
            filters={'parent': parent},
            fields=['parent', 
                    'mode_of_payment', 
                    'opening_amount', 
                    'expected_amount', 
                    'closing_amount' ]  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_closing_details Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


@frappe.whitelist()
def get_pos_warehouse(pos_profile):
    warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
    return warehouse
@frappe.whitelist()
def create_and_submit_pos_closing_entry(cashier, pos_profile, company, pos_opening_entry_id, posting_date, posting_time):
    """
    Create and submit a new POS Closing Entry document.

    Args:
        cashier (str): The user creating the entry
        pos_profile (str): The POS profile
        company (str): The company name
        pos_opening_entry_id (str): The ID of the POS opening entry

    Returns:
        str: The name of the submitted document
    """
    try:
        # Create a new POS Closing Entry document
        voucher = frappe.new_doc("POS Closing Entry")
        voucher.pos_profile = pos_profile
        voucher.user = cashier
        voucher.company = company
        voucher.pos_opening_entry = pos_opening_entry_id
        voucher.period_end_date = frappe.utils.now_datetime()
        voucher.posting_date = posting_date
        voucher.posting_time = posting_time
        
        # Insert and submit the document
        voucher.insert()
        # add time to submit
        #
        voucher.submit()

        # Commit the transaction to save changes
        frappe.db.commit()        
        # user the create_cash_count_denomination_entry here import
        create_cash_count_denomination_entry(cashier, pos_profile, voucher.pos_opening_entry)
        return voucher.name

    except frappe.exceptions.ValidationError as e:
        frappe.throw(frappe._("Validation Error: {0}").format(str(e)))

    except Exception as e:
        frappe.throw(frappe._("An error occurred while creating the document: {0}").format(str(e)))
    
