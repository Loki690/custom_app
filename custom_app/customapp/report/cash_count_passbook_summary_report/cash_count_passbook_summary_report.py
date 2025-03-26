# Copyright (c) 2025, joncsr and contributors 
# For license information, please see license.txt

import frappe

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": "Cash Count Denomination Entry",
            "fieldname": "cash_count_id",
            "fieldtype": "Link",
            "options": "Cash Count Denomination Entry",
            "width": 200,
        },
        {
            "label": "Posting Date",
            "fieldname": "posting_date",
            "fieldtype": "Date",
            "width": 120,
        },
        {
            "label": "Branch",
            "fieldname": "branch",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Cashier",
            "fieldname": "cashier_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Cash Count Amount",
            "fieldname": "amount",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "Passbook",
            "fieldname": "passbook",
            "fieldtype": "Link",
            "options": "Passbook",
            "width": 200,
        },
         {
            "label": "Passbook Amount",
            "fieldname": "passbook_amount",
            "fieldtype": "Currency",
            "width": 200,
        },
    ]

def get_data(filters):
    # Check which doctype is selected and run the appropriate query
    if filters.get("doctype") == "Cash Count Denomination Entry":
        return cash_count_query(filters)
    elif filters.get("doctype") == "Passbook":
        return passbook_query(filters)
    else:
        return []  # Return empty list if no valid doctype is selected

def cash_count_query(filters):
    query = """
        SELECT 
            ccde.name AS cash_count_id,
            ccde.custom_branch AS branch,
            ccde.custom_cashier_name AS cashier_name,
            ccde.custom_cash_count_total AS amount,
            ccde.custom_match_passbook AS passbook, 
            pbk.amount AS passbook_amount,
            ccde.custom_date AS posting_date
        FROM 
            `tabCash Count Denomination Entry` AS ccde
        LEFT JOIN 
			`tabPassbook` AS pbk ON pbk.name = ccde.custom_match_passbook
    """

    # Add conditions based on filters
    conditions = []
    if filters.get("status"):
        conditions.append("docstatus = %(status)s")
    if filters.get("amount"):
        conditions.append("custom_cash_count_total = %(amount)s")
    if filters.get("warehouse"):
        conditions.append("custom_branch = %(warehouse)s")
    if filters.get("match"):
        if filters["match"] == "Yes":
            conditions.append("custom_match_passbook IS NOT NULL")
        elif filters["match"] == "No":
            conditions.append("custom_match_passbook IS NULL")

    if filters.get("from_date") and filters.get("to_date"):
        conditions.append("custom_date BETWEEN %(from_date)s AND %(to_date)s")

    # Append conditions to query
    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    # Execute the query with filters
    return frappe.db.sql(query, filters, as_dict=True)

def passbook_query(filters):
    query = """
        SELECT 
            pccm.cash_count AS cash_count_id,
            ccde.custom_branch AS branch,
            pccm.cashier_name AS cashier_name,
            ccde.custom_cash_count_total AS amount,
            pbk.name AS passbook, 
            ccde.custom_date AS posting_date,
            pbk.amount AS passbook_amount
        FROM 
            `tabPassbook` AS pbk
        LEFT JOIN
            `tabPassbook Cash Count Match` AS pccm ON pccm.parent = pbk.name
        LEFT JOIN
            `tabCash Count Denomination Entry` AS ccde ON ccde.name = pccm.cash_count
    """

    # Add conditions based on filters
    conditions = []
    if filters.get("status"):
        conditions.append("pbk.docstatus = %(status)s")
    if filters.get("amount"):
        conditions.append("pbk.amount = %(amount)s")
    if filters.get("warehouse"):
        conditions.append("ccde.custom_branch = %(warehouse)s")
    if filters.get("match"):
        if filters["match"] == "Yes":
            conditions.append("ccde.custom_match_passbook IS NOT NULL")
        elif filters["match"] == "No":
            conditions.append("ccde.custom_match_passbook IS NULL")

    if filters.get("from_date") and filters.get("to_date"):
        conditions.append("pbk.date BETWEEN %(from_date)s AND %(to_date)s")

    # Append conditions to query
    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    # Execute the query with filters
    return frappe.db.sql(query, filters, as_dict=True)
