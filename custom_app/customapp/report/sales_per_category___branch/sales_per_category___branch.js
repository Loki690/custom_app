// Copyright (c) 2025, joncsr and contributors
// For license information, please see license.txt

frappe.query_reports["Sales Per Category - Branch"] = {
	"filters": [
		{
			"fieldname": "start_date",
			"label": __("Start Date"),
			"fieldtype": "Date",
			"reqd": 1,
			"default": frappe.datetime.add_days(frappe.datetime.now_date(), -30), // Default to 30 days ago
			"width": "80"
		},
		{
			"fieldname": "end_date",
			"label": __("End Date"),
			"fieldtype": "Date",
			"reqd": 1,
			"default": frappe.datetime.now_date(), // Default to today
			"width": "80"
		}
	]
};
