import frappe


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "label": "ID",
            "fieldname": "material_request",
            "fieldtype": "Link",
            "options": "Material Request",
            "width": 120,
        },
        {
            "label": "Creation",
            "fieldname": "material_request_date",
            "fieldtype": "Datetime",
            "width": 120,
        },
        {
            "label": "Required By",
            "fieldname": "required_by_date",
            "fieldtype": "Date",
            "width": 120,
        },
        {
            "label": "Source Warehouse",
            "fieldname": "source_warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 120,
        },
        {
            "label": "Set Target Warehouse",
            "fieldname": "target_warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 120,
        },
        {
            "label": "MR Status",
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": "MR Remarks",
            "fieldname": "remarks",
            "fieldtype": "Small Text",
            "width": 120,
        },
        {
            "label": "MR Created By",
            "fieldname": "owner",
            "fieldtype": "Link",
            "options": "User",
            "width": 120,
        },
        {
            "label": "Pick List ID",
            "fieldname": "pick_list",
            "fieldtype": "Link",
            "options": "Pick List",
            "width": 200,
        },
        {
            "label": "PL Created By",
            "fieldname": "pick_list_owner",
            "fieldtype": "Link",
            "options": "User",
            "width": 120,
        },
        {
            "label": "PL Create On",
            "fieldname": "pick_list_date",
            "fieldtype": "Datetime",
            "width": 120,
        },
        {
            "label": "Stock Entry ID (Send)",
            "fieldname": "stock_entry",
            "fieldtype": "Link",
            "options": "Stock Entry",
            "width": 200,
        },
        {
            "label": "STE Created By (Send)",
            "fieldname": "stock_entry_owner",
            "fieldtype": "Link",
            "options": "User",
            "width": 120,
        },
        {
            "label": "STE Created On (Send)",
            "fieldname": "stock_entry_date",
            "fieldtype": "Datetime",
            "width": 120,
        },
        {
            "label": "Stock Entry ID (Received)",
            "fieldname": "outgoing_stock_entry",
            "fieldtype": "Link",
            "options": "Stock Entry",
            "width": 200,
        },
         {
            "label": "STE Created By (Received)",
            "fieldname": "stock_entry_owner_received",
            "fieldtype": "Link",
            "options": "User",
            "width": 120,
        },
        {
            "label": "STE Created On (Received)",
            "fieldname": "stock_entry_date_received",
            "fieldtype": "Datetime",
            "width": 120,
        },
        {
            "label": "% Ordered",
            "fieldname": "ordered",
            "fieldtype": "Percent",
            "width": 120,
        },
        {
            "label": "% Received",
            "fieldname": "received",
            "fieldtype": "Percent",
            "width": 120,
        },
        {
            "label": "Transfer Status",
            "fieldname": "transfer_status",
            "fieldtype": "Data",
            "width": 120,
        },
    ]


def get_data(filters):
    conditions = []

    # Apply date filters
    if filters.get("from_date"):
        conditions.append("mr.transaction_date >= %(from_date)s")
    if filters.get("to_date"):
        conditions.append("mr.transaction_date <= %(to_date)s")
    if filters.get("mt_type"):
        conditions.append("mr.material_request_type = %(mt_type)s")
    if filters.get("source_warehouse"):
        conditions.append("mr.set_from_warehouse = %(source_warehouse)s")
    if filters.get("set_warehouse"):
        conditions.append("mr.set_warehouse = %(set_warehouse)s")
    if filters.get("from_date_required"):
        conditions.append("mr.schedule_date >= %(from_date_required)s")
    if filters.get("to_date_required"):
        conditions.append("mr.schedule_date <= %(to_date_required)s")

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Query to fetch data
    return frappe.db.sql(
        f"""
        SELECT 
            mr.name AS material_request,
            mr.creation AS material_request_date,
            mr.schedule_date AS required_by_date,
            mr.set_from_warehouse AS source_warehouse,
            mr.set_warehouse AS target_warehouse,
            pl.name AS pick_list,
            pl.owner AS pick_list_owner,
            pl.creation AS pick_list_date,
            se.name AS stock_entry,
            se.owner AS stock_entry_owner,
            se.creation AS stock_entry_date,
            ser.name AS outgoing_stock_entry,
            ser.owner AS stock_entry_owner_received,
            ser.creation AS stock_entry_date_received,
            mr.status AS status,
            mr.custom_remarks AS remarks,
            mr.owner AS owner,
            mr.per_ordered AS ordered,
            mr.per_received AS received,
            mr.transfer_status AS transfer_status
        FROM 
            `tabMaterial Request` mr
        LEFT JOIN 
            `tabPick List` pl ON pl.material_request = mr.name
        LEFT JOIN 
            `tabStock Entry` se ON se.pick_list = pl.name
        LEFT JOIN 
            `tabStock Entry` ser ON ser.outgoing_stock_entry = se.name
        WHERE 
            {where_clause}
        Group BY 
            mr.name
        ORDER BY 
            mr.transaction_date ASC
    """,
        filters,
        as_dict=1,
    )

