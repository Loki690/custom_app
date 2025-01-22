import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {"label": "Branch", "fieldname": "Branch", "fieldtype": "Data", "width": 200},
        {
            "label": "Medicine",
            "fieldname": "Medicine",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Medicine Market Share",
            "fieldname": "Medicine Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {"label": "Food", "fieldname": "Food", "fieldtype": "Currency", "width": 150},
        {
            "label": "Food Market Share",
            "fieldname": "Food Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {
            "label": "Non-Food",
            "fieldname": "Non-Food",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Non-Food Market Share",
            "fieldname": "Non-Food Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {
            "label": "Favorway",
            "fieldname": "Favorway",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Favorway Market Share",
            "fieldname": "Favorway Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {
            "label": "Instruments",
            "fieldname": "Instruments",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Instruments Market Share",
            "fieldname": "Instruments Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {
            "label": "Service Item",
            "fieldname": "Service Item",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Service Market Share",
            "fieldname": "Service Market Share",
            "fieldtype": "Percent",
            "width": 150,
        },
        {
            "label": "Grand Total",
            "fieldname": "Grand Total",
            "fieldtype": "Currency",
            "width": 150,
        },
    ]


def get_data(filters):
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    # Print the current user
    current_user = frappe.session.user
    print(f"Current User: {current_user}")

    # Get assigned warehouses for the current user
    warehouses = pos_profile_user_assigned_warehouses(current_user)
    if not warehouses:
        frappe.throw(_("No warehouses are assigned to the current user."))
    print(warehouses)

    # Extract warehouse names into a list
    warehouse_names = [w["warehouse"] for w in warehouses]

    # Validate filters
    if not start_date or not end_date:
        frappe.throw(_("Start Date and End Date are required."))

    # SQL Query
    query = """
SELECT
    ws.Branch,
    ws.Medicine,
    ROUND((ws.Medicine / ws.GrandTotal) * 100, 2) AS `Medicine Market Share`,
    ws.Food,
    ROUND((ws.Food / ws.GrandTotal) * 100, 2) AS `Food Market Share`,
    ws.NonFood,
    ROUND((ws.NonFood / ws.GrandTotal) * 100, 2) AS `Non-Food Market Share`,
    ws.Favorway,
    ROUND((ws.Favorway / ws.GrandTotal) * 100, 2) AS `Favorway Market Share`,
    ws.Instruments,
    ROUND((ws.Instruments / ws.GrandTotal) * 100, 2) AS `Instruments Market Share`,
    ws.ServiceItem,
    ROUND((ws.ServiceItem / ws.GrandTotal) * 100, 2) AS `Service Market Share`,
    ws.GrandTotal
FROM (
    SELECT
        pi.set_warehouse AS Branch,

        -- Calculate sales for Medicine
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Medicine')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Medicine')
            THEN pii.amount ELSE 0 END), 2) AS Medicine,
            
        -- Calculate sales for Food
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Food')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Food')
            THEN pii.amount ELSE 0 END), 2) AS Food,
            
        -- Calculate sales for Non-Food
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Non-Food')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Non-Food')
            THEN pii.amount ELSE 0 END), 2) AS NonFood,

        -- Calculate sales for Favorway
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Favorway')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Favorway')
            THEN pii.amount ELSE 0 END), 2) AS Favorway,
            
        -- Calculate sales for Instruments
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Instruments')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Instruments')
            THEN pii.amount ELSE 0 END), 2) AS Instruments,
            
        -- Calculate sales for Service Item
        ROUND(SUM(CASE 
            WHEN ig.lft >= (SELECT lft FROM `tabItem Group` WHERE name = 'Service Item - POS Entry')
                AND ig.rgt <= (SELECT rgt FROM `tabItem Group` WHERE name = 'Service Item - POS Entry')
            THEN pii.amount ELSE 0 END), 2) AS ServiceItem,
            
        -- Calculate total sales
        ROUND(SUM(pii.amount), 2) AS GrandTotal

    FROM
        `tabPOS Invoice` AS pi
    INNER JOIN
        `tabPOS Invoice Item` AS pii ON pii.parent = pi.name
    INNER JOIN
        `tabItem Group` AS ig ON ig.name = pii.item_group
    WHERE
        pi.docstatus != 2
        AND pi.posting_date BETWEEN %(start_date)s AND %(end_date)s
        AND pi.set_warehouse IN %(warehouse_names)s
    GROUP BY
        pi.set_warehouse
) AS ws
"""

    # Execute the query and return the data
    data = frappe.db.sql(
        query,
        {
            "start_date": start_date,
            "end_date": end_date,
            "warehouse_names": warehouse_names,
        },
        as_dict=1,
    )

    return data


def pos_profile_user_assigned_warehouses(user):

    pos_profiles = frappe.get_all(
        "POS Profile User", filters={"user": user}, fields=["parent"]
    )

    if not pos_profiles:
        return []

    warehouses = frappe.get_all(
        "POS Profile",
        filters={"name": ["in", [profile["parent"] for profile in pos_profiles]]},
        fields=["warehouse"],
    )

    return warehouses
