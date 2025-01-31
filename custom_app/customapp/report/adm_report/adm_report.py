import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Warehouse"),
            "fieldname": "warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
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
            "label": _("Principal"),
            "fieldname": "custom_principal",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Suppliers"),
            "fieldname": "suppliers",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("Total Sold QTY"),
            "fieldname": "total_sold_qty",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("UOM"),
            "fieldname": "uom",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("In Transit Warehouse"),
            "fieldname": "in_transit_warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
        {
            "label": _("No. of Days"),
            "fieldname": "num_days",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("ADM"),
            "fieldname": "adm",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("QoH"),
            "fieldname": "qoh",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Incoming"),
            "fieldname": "incoming",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Re-order Point"),
            "fieldname": "reorder_point",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Suggest Order"),
            "fieldname": "suggest_order",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Standard Buying UOM"),
            "fieldname": "standard_buying_uom",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("UOM Conversion"),
            "fieldname": "uom_conversion",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("Suggested Buying"),
            "fieldname": "suggested_buying",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("Final Order"),
            "fieldname": "final_order",
            "fieldtype": "Data",
            "width": 150
        }
    ]

def get_data(filters):
    conditions = []
    query_filters = {}

    # Adding date filter to the conditions
    if filters.get("date_from"):
        conditions.append("si.posting_date >= %(date_from)s")
        query_filters["date_from"] = filters.get("date_from")

    if filters.get("date_to"):
        conditions.append("si.posting_date <= %(date_to)s")
        query_filters["date_to"] = filters.get("date_to")
        
    if filters.get("item_code"):
        conditions.append("sii.item_code = %(item_code)s")
        query_filters["item_code"] = filters.get("item_code")
        
    if filters.get("warehouse"):
        conditions.append("bin.warehouse = %(warehouse)s")
        query_filters["warehouse"] = filters.get("warehouse")

    # If no conditions, default to always true
    where_clause = " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT
            bin.warehouse AS warehouse,
            sii.item_code AS item_code,
            sii.item_name AS item_name,
            i.custom_principal AS custom_principal,
            GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ') AS suppliers,
            SUM(sii.qty * sii.conversion_factor) AS total_sold_qty,
            "PC" AS uom,
            w.default_in_transit_warehouse AS in_transit_warehouse,
            DATEDIFF(%(date_to)s, %(date_from)s) + 1 AS num_days,
            SUM(sii.qty * sii.conversion_factor) / (DATEDIFF(%(date_to)s, %(date_from)s) + 1) AS adm,
            bin.actual_qty AS qoh,
            transit_bin.actual_qty AS incoming,
            SUM(sii.qty * sii.conversion_factor) / (DATEDIFF(%(date_to)s, %(date_from)s) + 1) * 30 AS reorder_point,
            (SUM(sii.qty * sii.conversion_factor) / (DATEDIFF(%(date_to)s, %(date_from)s) + 1) * 30) - (bin.actual_qty + transit_bin.actual_qty) AS suggest_order,
            ip.uom AS standard_buying_uom,
            CASE 
                WHEN  ip.uom = "PC" THEN 1
                ELSE ucf.value
            END AS uom_conversion,
            ((SUM(sii.qty * sii.conversion_factor) / (DATEDIFF(%(date_to)s, %(date_from)s) + 1) * 30) - (bin.actual_qty + transit_bin.actual_qty)) / 
            CASE 
                WHEN ip.uom = "PC" THEN 1
                ELSE ucf.value
            END AS suggested_buying,
            CEIL(((SUM(sii.qty * sii.conversion_factor) / (DATEDIFF(%(date_to)s, %(date_from)s) + 1) * 30) - (bin.actual_qty + transit_bin.actual_qty)) / 
                CASE 
                    WHEN ip.uom = "PC" THEN 1
                ELSE ucf.value
            END) AS final_order
        FROM
            `tabSales Invoice Item` sii
        JOIN
            `tabSales Invoice` si ON si.name = sii.parent
        JOIN
            `tabBin` bin ON bin.item_code = sii.item_code AND bin.warehouse = sii.warehouse
        JOIN
            `tabWarehouse` w ON w.name = bin.warehouse
        LEFT JOIN
            `tabBin` transit_bin ON transit_bin.item_code = sii.item_code AND transit_bin.warehouse = w.default_in_transit_warehouse
        JOIN
            `tabItem` i ON i.name = sii.item_code
        LEFT JOIN (
            SELECT parent AS item_code, MIN(supplier) AS supplier
            FROM `tabItem Supplier`
            GROUP BY parent
        ) isup ON isup.item_code = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = isup.supplier
        LEFT JOIN (
            SELECT item_code, MIN(price_list_rate) AS price, uom
            FROM `tabItem Price`
            WHERE price_list = 'Standard Buying'
            GROUP BY item_code
        ) ip ON ip.item_code = sii.item_code
        LEFT JOIN (
            SELECT from_uom, value
            FROM `tabUOM Conversion Factor`
            GROUP BY from_uom
        ) ucf ON ucf.from_uom = ip.uom
        WHERE
            si.docstatus = 1
            AND {where_clause}  -- Date filters applied here
        GROUP BY
            bin.warehouse, sii.item_code, i.custom_principal, bin.actual_qty, w.default_in_transit_warehouse, transit_bin.actual_qty
        ORDER BY
            bin.warehouse ASC, si.posting_date DESC,    SUM(sii.qty * sii.conversion_factor) DESC
    """

    return frappe.db.sql(query, query_filters, as_dict=True)
