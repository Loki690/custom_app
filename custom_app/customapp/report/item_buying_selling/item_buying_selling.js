// Copyright (c) 2025, joncsr and contributors
// For license information, please see license.txt

frappe.query_reports["Item Buying Selling"] = {
	"filters": [

		{
            "fieldname": "supplier",
            "label": __("Supplier"),
            "fieldtype": "Link",
            "options": "Supplier",
            "reqd": 0
        },
		{
            "fieldname": "custom_principal",
            "label": __("Principal"),
            "fieldtype": "Link",
            "options": "Principal",
            "reqd": 0
        },

		{
            "fieldname": "item",
            "label": __("Item"),
            "fieldtype": "Link",
            "options": "Item",
            "reqd": 0
        },

        {
            "fieldname": "uom",
            "label": __("UOM"),
            "fieldtype": "Link",
            "options": "UOM",
            "reqd": 0
        },

        // {
        //     "fieldname": "consolidate",
        //     "label": __("Concatinate Item Multiple Suppliers"),
        //     "fieldtype": "Check",
        //     "default": 0
        // }

	]
};
