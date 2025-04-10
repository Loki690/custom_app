# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt


import json

import frappe
from frappe.utils import cint
from frappe.utils.nestedset import get_root_of

from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability
from erpnext.accounts.doctype.pos_profile.pos_profile import get_child_nodes, get_item_groups
from erpnext.stock.utils import scan_barcode
from frappe.utils.password import get_decrypted_password
from frappe.exceptions import AuthenticationError
from custom_app.customapp.utils.password import check_oic_password, check_password, check_password_cashier, check_password_oic, check_password_without_username

import platform


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


# import frappe

# @frappe.whitelist()
# def get_item_uom_and_batch_details(item_code):
#     uom_prices = {}
#     batch_details = []

#     # Fetch UOM prices
#     item_prices = frappe.get_all('Item Price', filters={'item_code': item_code}, fields=['uom', 'price_list_rate'])
#     for price in item_prices:
#         uom_prices[price.uom] = price.price_list_rate

#     # Fetch batch details
#     batches = frappe.get_all('Batch', filters={'item': item_code}, fields=['name', 'expiry_date'])
#     for batch in batches:
#         batch_details.append({
#             'batch_no': batch.name,  # Assuming the primary key field is 'name'
#             'expiry_date': batch.expiry_date
#         })

#     return {
#         'uom_prices': uom_prices,
#         'batch_details': batch_details
#     }

# @frappe.whitelist()
# def get_item_uom_prices(item_code):
#     uom_prices = {}
#     item_prices = frappe.get_all('Item Price', filters={'item_code': item_code}, fields=['uom', 'price_list_rate'])
#     for price in item_prices:
#         uom_prices[price.uom] = price.price_list_rate
#     return {'uom_prices': uom_prices}



#Only get Standard Selling OUM Price rates
@frappe.whitelist()
def get_item_uom_prices(item_code):
    """
    Fetch UOM prices from the 'Standard Selling' price list and pricing rules for a given item.
    """
    if not item_code:
        frappe.throw(_("Item code is required"))

    uom_prices = {}

    # Fetch prices from the 'Standard Selling' price list for the given item
    item_prices = frappe.get_all(
        "Item Price",
        filters={"item_code": item_code, "price_list": "Standard Selling"},
        fields=["uom", "price_list_rate"],
    )

    # Add the fetched UOM and price list rates to the dictionary
    for price in item_prices:
        uom_prices[price.uom] = price.price_list_rate

    # Fetch specific pricing rules for the item
    pricing_rules = frappe.get_all(
        "Pricing Rule",
        filters={
            "disable": 0,
            "selling": 1,
            "apply_on": ["in", ["Item Code", "Item Group"]],
        },
        fields=[
            "title",
            "customer_group",
            "discount_percentage",
        ],
        or_filters=[
            {"item_code": item_code},  # Specific item match
        ],
    )

    if not pricing_rules:
        pricing_rules = []

    # Return the results
    return {
        "uom_prices": uom_prices,
        "item_code": item_code,
        "pricing_rules": pricing_rules if pricing_rules else [],
    }



import frappe
from frappe import _

@frappe.whitelist()
def get_item_uom_conversion(item_code, uom_code):
    """
    Fetches the UOM conversion factor for a specific item and UOM code.

    Args:
        item_code (str): The Item code.
        uom_code (str): The UOM code to fetch the conversion factor for.

    Returns:
        float: The conversion factor for the given UOM code and Item.
    """
    # Fetch the UOM Conversion Detail for the given Item and UOM
    conversion_detail = frappe.get_value(
        'UOM Conversion Detail',
        {'parent': item_code, 'uom': uom_code},
        'conversion_factor'
    )

    # Check if a conversion factor was found
    if not conversion_detail:
        frappe.throw(_("No UOM conversion factor found for UOM code {0} and Item {1}.").format(uom_code, item_code))

    return conversion_detail



@frappe.whitelist()
def get_items(start, page_length, price_list, item_group, pos_profile, search_term="", selected_warehouse=None, is_generics=0):
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
    # Add the is_generics condition
    if cint(is_generics) == 1:  # Check if is_generics is enabled
        condition += " AND item.custom_principal = 'Generics'"

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
            item.custom_generic_name,
            item.description,
            item.item_group,
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
                # item.actual_qty = item.actual_qty // uom.conversion_factor
                item.actual_qty = item.actual_qty

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


@frappe.whitelist()
def search_for_serial_or_batch_or_barcode_number(search_value: str) -> dict[str, str | None]:
	return scan_barcode(search_value)


def get_conditions(search_term):
    search_term_escaped = frappe.db.escape(search_term + "%")  # Match words starting with search_term

    condition = "("
    condition += """
        item.name LIKE {search_term}
        OR item.item_name LIKE {search_term}
        OR item.custom_generic_name LIKE {search_term}
    """.format(search_term=search_term_escaped)

    # Add additional search fields if necessary
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
@frappe.validate_and_sanitize_search_inputs
def warehouse_query(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql(
		"""
		SELECT name 
		FROM `tabWarehouse`
		WHERE name LIKE %(txt)s
		ORDER BY name
		LIMIT %(page_len)s OFFSET %(start)s
		""",
		{
			"txt": "%%%s%%" % txt,
			"page_len": page_len,
			"start": start,
		}
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
def create_opening_voucher(pos_profile, company, balance_details):
	balance_details = json.loads(balance_details)

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Entry",
			"period_start_date": frappe.utils.get_datetime(),
			"posting_date": frappe.utils.getdate(),
			"user": frappe.session.user,
			"pos_profile": pos_profile,
			"company": company,
		}
	)
	new_pos_opening.set("balance_details", balance_details)
	new_pos_opening.submit()

	return new_pos_opening.as_dict()


@frappe.whitelist()
def serial_number():
    serial_number = platform.node()
    return serial_number


@frappe.whitelist()
def get_past_order_list(search_term, status, pos_profile, limit=1000):
	fields = ["name", "customer_name", "grand_total", "currency", "customer", "posting_time", "posting_date", "pos_profile"]
	invoice_list = []

	if search_term and status:
		invoices_by_customer = frappe.db.get_all(
			"POS Invoice",
			filters={"customer": ["like", f"%{search_term}%"], 
            'pos_profile': pos_profile, 
            "status": status},
			fields=fields,
			order_by="posting_time desc", 
			page_length=limit,
		)
		invoices_by_name = frappe.db.get_all(
			"POS Invoice",
			filters={"name": ["like", f"%{search_term}%"], 
            'pos_profile': pos_profile, 
            "status": status},
			fields=fields,
			page_length=limit,
		)

		invoice_list = invoices_by_customer + invoices_by_name
	elif status:
		invoice_list = frappe.db.get_all(
			"POS Invoice", filters={"status": status, 
                           'pos_profile': pos_profile
                           }, fields=fields, order_by="posting_time desc",   page_length=limit
		)
		
	return invoice_list


@frappe.whitelist()
def set_customer_info(fieldname, customer, value=""):
    # Set loyalty program if applicable
    if fieldname == "loyalty_program":
        frappe.db.set_value("Customer", customer, "loyalty_program", value)
    
    # Fetch or create the primary contact for the customer
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
    # customer_doc = frappe.get_doc("Customer", customer)
    
    # Set fields in the contact based on fieldname
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
        
        
        
    # elif fieldname == "custom_osca_id":
    #      customer_doc.set("custom_osca_id", value)
    #      #frappe.db.set_value("Customer", customer, "custom_osca_id", value)
    # elif fieldname == "custom_pwd_id":
    #      customer_doc.set("custom_pwd_id", value)
    #      #frappe.db.set_value("Customer", customer, "custom_pwd_id", value)
    
    # customer_doc.save()
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

from frappe.exceptions import AuthenticationError

@frappe.whitelist()
def get_user_password():
    # Get the current user
    user = frappe.session.user
    
    # Execute the query with proper parameterization
    user_password = frappe.db.sql(
        """
        SELECT `password` FROM __Auth WHERE name = %s
        """, (user,), as_dict=True
    )

    return user_password

# @frappe.whitelist()
# def confirm_user_password(password):
#     # Get the current user
#     user = frappe.session.user

#     # Fetch hashed password from __Auth table 
#     stored_password_hash = frappe.utils.password.get_decrypted_password(
#         'User ', user , 'password'
#         )

#     # Use appropriate hashing function to compare
#     # if check_if_match(stored_password_hash, password): 
#     #     return True 
#     # else:
#     #     return False
    
#     return stored_password_hash
    
# def check_if_match(stored_password_hash, password):


# @frappe.whitelist()
# def confirm_user_password(password,role):
#     # Check if the provided role is "oic"
   
#     try:
#         # Check if the entered password matches the stored hashed password
#         if check_oic_password(password, role):
#             return True
#         else:
#             return False
#     except frappe.AuthenticationError:
#         return False


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
def get_user_details_by_password(password):
    """
    Wrapper function for checking password without requiring a username.
    """
    return check_password_without_username(password)  

@frappe.whitelist()
def get_cashier_details_by_password(password):
    """
    Wrapper function for checking password without requiring a username.
    """
    return check_password_cashier(password)


@frappe.whitelist()
def get_oic_details_by_password(password):
    """
    Wrapper function for checking password without requiring a username.
    """
    return check_password_oic(password)

    
@frappe.whitelist()
def get_pharmacist_user():
    user = frappe.session.user
    return user

@frappe.whitelist()
def get_pos_warehouse(pos_profile):
    warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
    return warehouse


@frappe.whitelist()
def get_item_qty_per_warehouse(warehouse, item_code):
    """
    Get the item quantity of the specified warehouse.
    """
   
    bin_qty = frappe.db.sql(
		"""select actual_qty from `tabBin`
		where item_code = %s and warehouse = %s
		limit 1""",
		(item_code, warehouse),
		as_dict=1,
	)
    return bin_qty[0].actual_qty or 0 if bin_qty else 0
       
@frappe.whitelist()
def get_draft_pos_invoice_items(pos_profile, item_code):
    """
    Retrieves all draft POS invoices for the specified POS profile that contain the specified item code.
    Includes batch details in the response.
    
    :param pos_profile: The POS profile to filter by.
    :param item_code: The item code to search for in the draft POS invoices.
    :return: A list of draft POS invoices that contain the specified item code, including batch details, and the total quantity of the item.
    """
    try:
        # Fetch all draft POS invoices for the specified POS profile
        draft_invoices = frappe.get_all('POS Invoice', filters={
            'docstatus': 0,
            'pos_profile': pos_profile
        }, fields=['name', 'customer', 'grand_total'])

        # Initialize a list to store invoices containing the item code
        matching_invoices = []

        # Initialize total quantity
        total_qty = 0

        # Iterate through the draft invoices to find matching items
        for invoice in draft_invoices:
            invoice_items = frappe.get_all('POS Invoice Item', filters={
                'parent': invoice.name,
                'item_code': item_code
            }, fields=['item_code', 'item_name', 'qty', 'rate'])

            if invoice_items:
                invoice['items'] = invoice_items
                matching_invoices.append(invoice)

                # Sum the quantity of the item in this invoice
                for item in invoice_items:
                    total_qty += item.qty

        return {
            'invoices': matching_invoices,
            'total_qty': total_qty
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), frappe._("Error fetching draft POS invoices"))
        frappe.throw(frappe._("An error occurred while fetching draft POS invoices: {0}").format(str(e)))



def get_draft_pos_invoice_item_quantity(pos_profile, item_code, actual_qty):
    """
    Retrieves the total quantity of the specified item code in draft POS invoices for the given POS profile.

    :param pos_profile: The POS profile to filter by.
    :param item_code: The item code to search for in the draft POS invoices.
    :return: The adjusted available quantity of the item (integer).
    """
    try:
        total_qty = 0

        # Fetch all draft POS invoices for the specified POS profile
        draft_invoices = frappe.get_all('POS Invoice', filters={
            'docstatus': 0,
            'pos_profile': pos_profile
        }, fields=['name'])

        # Iterate through the draft invoices and accumulate total quantity
        for invoice in draft_invoices:
            invoice_items = frappe.get_all('POS Invoice Item', filters={
                'parent': invoice.name,
                'item_code': item_code
            }, fields=['qty'])

            for item in invoice_items:
                total_qty += item.qty

        return actual_qty - total_qty

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error fetching draft POS invoices"))
        frappe.throw(frappe._("An error occurred while fetching draft POS invoices: {0}").format(str(e)))



# @frappe.whitelist()
# def get_nearest_expiry_batch(item_code):
#     try:
#         result = frappe.db.sql("""
#             SELECT batch_no, expiry_date
#             FROM `tabSerial and Batch Entry`
#             WHERE item_code = %s
#             ORDER BY expiry_date ASC, creation ASC
#             LIMIT 1
#         """, (item_code,), as_dict=True)
        
#         # Debug logging
#         frappe.log_error(message=str(result), title="Debug get_nearest_expiry_batch")
        
#         if result:
#             return result[0]
#         else:
#             return {"batch_no": None, "expiry_date": None}
#     except Exception as e:
#         frappe.log_error(message=str(e), title="Error in get_nearest_expiry_batch")
#         return {"batch_no": None, "expiry_date": None}


# in your custom app file, e.g., custom_app/api.py
import frappe

@frappe.whitelist()
def get_fifo_batch(item_code, warehouse):
    batches = frappe.db.sql("""
        SELECT name, expiry_date
        FROM `tabBatch`
        WHERE item = %s AND (expiry_date IS NULL OR expiry_date > NOW())
        ORDER BY expiry_date ASC, creation ASC
        LIMIT 1
    """, (item_code,), as_dict=True)
    
    if batches:
        return batches[0]
    else:
        return None
@frappe.whitelist()
def fetch_latest_batch_entries(pos_profile, item_code):
    # Fetch the warehouse linked to the POS profile
    warehouse = frappe.db.get_value('POS Profile', pos_profile, 'warehouse')
    
    if not warehouse:
        frappe.throw(f"No warehouse found for POS Profile {pos_profile}")

    # Fetch the latest entries from the Serial and Batch Entry table for the specified warehouse and item code
    batches = frappe.db.sql("""
        SELECT sbe.batch_no, b.expiry_date
        FROM `tabSerial and Batch Entry` AS sbe
        JOIN `tabSerial and Batch Bundle` AS sbb ON sbe.parent = sbb.name
        JOIN `tabBatch` AS b ON sbe.batch_no = b.name
        WHERE sbb.warehouse = %s AND sbb.item_code = %s
        ORDER BY sbe.creation DESC
        LIMIT 10  -- Change this limit as needed
    """, (warehouse, item_code), as_dict=True)

    return batches

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
