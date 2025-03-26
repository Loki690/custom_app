// Copyright (c) 2025, joncsr and contributors
// For license information, please see license.txt

frappe.query_reports["DC Daily Material Request Report"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_days(frappe.datetime.now_date(), -1),
			"reqd": 1
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.now_date(),
			"reqd": 1
		},
		{
			"fieldname": "mt_type",
			"label": __("Material Request Type"),
			"fieldtype": "Select",
			"options": [
				"",
				"Purchase",
				"Material Transfer",
				"Material Issue"
			],
			"reqd": 0
		},
		{
			"fieldname": "source_warehouse",
			"label": __("Source Warehouse"),
			"fieldtype": "Link",
			"options": "Warehouse",
			"reqd": 0,
			"get_query": function () {
				return {
					"filters": {
						"warehouse_type": ["!=", "Transit"]
					}
				};
			},
			"default": "DC-Vinzon - ADC"
		},
		{
			"fieldname": "set_warehouse",
			"label": __("Target Warehouse"),
			"fieldtype": "Link",
			"options": "Warehouse",
			"reqd": 0,
			"get_query": function () {
				return {
					"filters": {
						"warehouse_type": ["!=", "Transit"]
					}
				};
			}
		},
		{
			"fieldname": "from_date_required",
			"label": __("Required by From"),
			"fieldtype": "Date",
			"reqd": 0
		},
		{
			"fieldname": "to_date_required",
			"label": __("Required by To"),
			"fieldtype": "Date",
			"reqd": 0
		}
	]
};