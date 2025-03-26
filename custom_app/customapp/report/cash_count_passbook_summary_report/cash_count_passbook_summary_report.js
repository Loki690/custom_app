// Copyright (c) 2025, joncsr and contributors
// For license information, please see license.txt

frappe.query_reports["Cash Count Passbook Summary Report"] = {
	"filters": [
		{
			"fieldname": "doctype",
			"label": __("Document"),
			"fieldtype": "Select",
			"options": [
				"Cash Count Denomination Entry",
				"Passbook"
			],
			"default": "Cash Count Denomination Entry"
		},
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
			"fieldname": "warehouse",
			"label": __("Branch"),
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
		},
		{
			"fieldname": "amount",
			"label": __("Amount"),
			"fieldtype": "Currency",
		},
		{
			"fieldname": "match",
			"label": __("Has Match"),
			"fieldtype": "Select",
			"options": [
				"",
				"Yes",
				"No"
			],

		},
	]
};
