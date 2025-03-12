import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Item Code"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 150
        },
        {
            "label": _("Item Name"),
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("UOM"),
            "fieldname": "uom",
            "fieldtype": "Link",
            "options": "UOM",
            "width": 100
        },
        {
            "label": _("QOH"),
            "fieldname": "quantity",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Warehouse"),
            "fieldname": "warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
        {
            "label": _("Price Per Unit"),
            "fieldname": "selling_price",
            "fieldtype": "Currency",
            "width": 100
        },
        {
            "label": _("Amount"),
            "fieldname": "amount",
            "fieldtype": "Currency",
            "width": 120
        }
    ]

def get_data(filters):
    conditions = []
    query_filters = {}

    # Apply filters
    if filters.get("warehouse"):
        conditions.append("bin.warehouse = %(warehouse)s")
        query_filters["warehouse"] = filters["warehouse"]

    if filters.get("item_code"):
        conditions.append("bin.item_code = %(item_code)s")
        query_filters["item_code"] = filters["item_code"]

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT
            bin.item_code AS item_code,
            item.item_name AS item_name,
            bin.stock_uom AS uom,
            bin.actual_qty AS quantity,
            bin.warehouse AS warehouse,
            COALESCE(price.price_list_rate, 0) AS selling_price,
            COALESCE(bin.actual_qty * price.price_list_rate, 0) AS amount
        FROM
            `tabBin` bin
        JOIN
            `tabItem` item ON bin.item_code = item.name
        LEFT JOIN (
            SELECT item_code, price_list_rate
            FROM `tabItem Price`
            WHERE price_list = 'Standard Selling'
            AND UOM = 'PC'
        ) price ON bin.item_code = price.item_code
        WHERE {where_clause}
        ORDER BY bin.warehouse ASC, bin.item_code ASC
    """

    return frappe.db.sql(query, query_filters, as_dict=True)
